import axios, { AxiosRequestConfig } from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';
import { BadRequestError } from '@errors/AppError';
import CryptoJS from 'crypto-js';
import env from '@config/env';
import { normalizePemFromEnv } from '@utils/jwt.util';

interface CreateOrderRequest {
  amount: number; // Amount in NPR (e.g., 1 for NPR 1.00) - will be converted to paisa internally
  currency: number; // 524 for NPR
  description: string; // Order ID/Description
  approveURL: string;
  cancelURL: string;
  declineURL: string;
}

interface CreateOrderResponse {
  status: string; // "00" for success
  orderID: string; // Encrypted OrderID from bank
  sessionID: string; // Encrypted SessionID from bank
  decryptedOrderID: string; // Decrypted OrderID
  decryptedSessionID: string; // Decrypted SessionID
  url: string; // Payment page URL
  errorMessage?: string;
}

interface GetOrderStatusRequest {
  orderID?: string; // Decrypted OrderID
  sessionID?: string; // Decrypted SessionID
}

interface GetOrderStatusResponse {
  status: string;
  orderID: string;
  sessionID: string;
  /**
   * Raw order status from bank.
   * Can be numeric ("2", "3", "4") or textual ("APPROVED", "DECLINED", "CANCELLED").
   */
  orderStatus: string;
  responseCode?: string;
  errorMessage?: string;
}

export class NabilService {
  // Use environment variables for production, fallback to test values
  private readonly apiUrl: string;
  private readonly merchantId: string;
  private readonly certPath: string;
  private readonly keyPath: string;
  private httpsAgent: https.Agent | null = null;
  private readonly decryptionKey: string; // DES-ECB decryption key (hex)

  constructor() {
    // API URL: Use production URL from env, fallback to test URL
    this.apiUrl = env.NABIL_API_URL || 'https://api.compassplus.com:11611/Exec';
    
    // Merchant ID: Use production merchant ID from env, fallback to test merchant ID
    this.merchantId = env.NABIL_MERCHANT_ID || 'NABIL106809';
    
    // Decryption Key: Use production decrypt key from env, fallback to test decrypt key
    this.decryptionKey = env.NABIL_DECRYPT_KEY || '0123456789abcdef';
    
    // Path to SSL certificates
    // Use process.cwd() for serverless environments where __dirname might not work correctly
    const certDir = process.env.CERT_DIR || path.join(__dirname, '../cert');
    // IMPORTANT:
    // The CompassPlus test endpoint typically requires the TEST client certificate,
    // and production requires the PRODUCTION client certificate.
    //
    // If we always prefer production certificates in dev, the bank can reject the
    // request (e.g. status 54). So pick defaults based on whether a production API
    // URL is explicitly configured.
    const isProductionEnv = !!env.NABIL_API_URL; // if set, assume production gateway
    this.certPath = path.join(
      certDir,
      isProductionEnv ? 'api.merosathi.co.production.crt' : 'merosathi.co.crt'
    );
    this.keyPath = path.join(
      certDir,
      isProductionEnv ? 'api.merosathi.co.production.key' : 'merosathi.key'
    );
    
    // Log configuration (without sensitive values)
    console.log('🔧 Nabil Service Configuration:');
    console.log('  API URL:', this.apiUrl);
    console.log('  Merchant ID:', this.merchantId);
    console.log('  Decrypt Key:', this.decryptionKey ? `${this.decryptionKey.substring(0, 8)}...` : 'Not set');
    console.log('  Environment:', isProductionEnv ? 'PRODUCTION' : 'TEST');
    console.log('  Client cert mode:', isProductionEnv ? 'PRODUCTION' : 'TEST');
    
    // Don't load certificates in constructor - load lazily when needed
    // This allows the module to load even if certificates are missing
  }

  /**
   * Lazy load HTTPS agent with certificates
   * Only loads when actually making a request
   * Supports both file-based and environment variable-based certificates
   */
  private getHttpsAgent(): https.Agent {
    if (this.httpsAgent) {
      return this.httpsAgent;
    }

    let cert: string | Buffer;
    let key: string | Buffer;

    // Try to load from environment variables first (for Vercel/serverless)
    const certFromEnv = process.env.NABIL_CERT_BASE64;
    const keyFromEnv = process.env.NABIL_KEY_BASE64;

    console.log('🔍 Loading SSL certificates...');
    console.log('  Cert from env:', certFromEnv ? `✅ Set (${certFromEnv.length} chars)` : '❌ Not set');
    console.log('  Key from env:', keyFromEnv ? `✅ Set (${keyFromEnv.length} chars)` : '❌ Not set');

    if (certFromEnv && keyFromEnv) {
      try {
        // Decode base64 PEM from env, then normalize newlines (fixes OpenSSL
        // error:04800066:PEM routines::bad end line when headers/body are one line).
        cert = normalizePemFromEnv(Buffer.from(certFromEnv, 'base64').toString('utf-8'));
        key = normalizePemFromEnv(Buffer.from(keyFromEnv, 'base64').toString('utf-8'));
        console.log('✅ Loaded SSL certificates from environment variables');
        console.log('  Cert length:', cert.length, 'chars');
        console.log('  Key length:', key.length, 'chars');
      } catch (envError) {
        console.error('❌ Failed to decode certificates from environment variables');
        throw new Error(
          `Failed to decode certificates from environment variables: ${envError instanceof Error ? envError.message : String(envError)}`
        );
      }
    } else {
      // Fallback to file-based certificates
      // Try multiple possible paths for different environments
      // Priority: Production certificates first, then test certificates
      const certDir = process.env.CERT_DIR || path.join(__dirname, '../cert');
      const possibleCertPaths = [
        // Production certificates (priority)
        this.certPath,
        path.join(process.cwd(), 'src/cert/api.merosathi.co.production.crt'),
        path.join(process.cwd(), 'cert/api.merosathi.co.production.crt'),
        path.join(__dirname, '../../cert/api.merosathi.co.production.crt'),
        path.join(__dirname, '../cert/api.merosathi.co.production.crt'),
        // Test certificates (fallback)
        path.join(certDir, 'merosathi.co.crt'),
        path.join(process.cwd(), 'src/cert/merosathi.co.crt'),
        path.join(process.cwd(), 'cert/merosathi.co.crt'),
        path.join(__dirname, '../../cert/merosathi.co.crt'),
        path.join(__dirname, '../cert/merosathi.co.crt'),
      ];

      const possibleKeyPaths = [
        // Production keys (priority)
        this.keyPath,
        path.join(process.cwd(), 'src/cert/api.merosathi.co.production.key'),
        path.join(process.cwd(), 'cert/api.merosathi.co.production.key'),
        path.join(__dirname, '../../cert/api.merosathi.co.production.key'),
        path.join(__dirname, '../cert/api.merosathi.co.production.key'),
        // Test keys (fallback)
        path.join(certDir, 'merosathi.key'),
        path.join(process.cwd(), 'src/cert/merosathi.key'),
        path.join(process.cwd(), 'cert/merosathi.key'),
        path.join(__dirname, '../../cert/merosathi.key'),
        path.join(__dirname, '../cert/merosathi.key'),
      ];

      let foundCertPath: string | null = null;
      let foundKeyPath: string | null = null;

      for (const certPath of possibleCertPaths) {
        if (fs.existsSync(certPath)) {
          foundCertPath = certPath;
          break;
        }
      }

      for (const keyPath of possibleKeyPaths) {
        if (fs.existsSync(keyPath)) {
          foundKeyPath = keyPath;
          break;
        }
      }

      if (!foundCertPath) {
        throw new Error(
          `SSL certificate not found. Tried paths: ${possibleCertPaths.join(', ')}. ` +
          `Please ensure the certificate files are available or set NABIL_CERT_BASE64 and NABIL_KEY_BASE64 environment variables. ` +
          `In serverless environments, you may need to include them in the deployment or use environment variables.`
        );
      }

      if (!foundKeyPath) {
        throw new Error(
          `SSL private key not found. Tried paths: ${possibleKeyPaths.join(', ')}. ` +
          `Please ensure the key file is available or set NABIL_CERT_BASE64 and NABIL_KEY_BASE64 environment variables. ` +
          `In serverless environments, you may need to include it in the deployment or use environment variables.`
        );
      }

      cert = normalizePemFromEnv(fs.readFileSync(foundCertPath, 'utf8'));
      key = normalizePemFromEnv(fs.readFileSync(foundKeyPath, 'utf8'));
      console.log(`✅ Loaded SSL certificates from files: ${foundCertPath}, ${foundKeyPath}`);
    }

    // Create HTTPS agent with client SSL certificates
    // Note: For production, we may need to include CA certificate chain
    // If Nabil Bank provides intermediate/CA certificates, they should be included in the cert
    this.httpsAgent = new https.Agent({
      cert,
      key,
      rejectUnauthorized: true, // Verify server certificate
      // If you have CA/intermediate certificates, include them:
      // ca: caCertificates, // Uncomment if you have CA chain
    });
    
    console.log('✅ HTTPS Agent created with client SSL certificate');

    return this.httpsAgent;
  }

  /**
   * Create a payment order with Nabil Bank
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Convert amount to paisa (multiply by 100)
    const amountInPaisa = Math.round(request.amount * 100);

    // Log request details for debugging
    console.log('📤 Nabil Bank CreateOrder Request:');
    console.log('  Merchant ID:', this.merchantId);
    console.log('  Amount (NPR):', request.amount);
    console.log('  Amount (Paisa):', amountInPaisa);
    console.log('  Currency:', request.currency);
    console.log('  Description:', request.description);
    console.log('  Approve URL:', request.approveURL);
    console.log('  Cancel URL:', request.cancelURL);
    console.log('  Decline URL:', request.declineURL);

    // Build XML request (matching exact format from Nabil Bank documentation)
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request><Operation>CreateOrder</Operation>
<Language>EN</Language>
<Order>
<OrderType>Purchase</OrderType>
<Merchant>${this.merchantId}</Merchant>
<Amount>${amountInPaisa}</Amount>
<Currency>${request.currency}</Currency>
<Description>${this.escapeXml(request.description)}</Description>
<ApproveURL>${this.escapeXml(request.approveURL)}</ApproveURL>
<CancelURL>${this.escapeXml(request.cancelURL)}</CancelURL>
<DeclineURL>${this.escapeXml(request.declineURL)}</DeclineURL>
<Fee>0</Fee>
</Order>
</Request>
</TKKPG>`;

    try {
      const response = await axios.post(this.apiUrl, xmlRequest, {
        headers: {
          'Content-Type': 'text/xml',
          'Content-Length': Buffer.byteLength(xmlRequest).toString(),
        },
        httpsAgent: this.getHttpsAgent(),
        timeout: 30000, // 30 seconds timeout
      });

      // Parse XML response
      const parsedResponse = await parseStringPromise(response.data, {
        explicitArray: false,
        mergeAttrs: true,
      });

      const tkkpg = parsedResponse.TKKPG || {};
      const responseData = tkkpg.Response || {};
      const orderData = responseData.Order || {};

      // Check for errors
      if (tkkpg.Error) {
        const error = tkkpg.Error;
        throw new BadRequestError(
          `Nabil Bank Error: ${error.ErrorMessage || error.Message || JSON.stringify(error)}`
        );
      }

      // Extract response data
      // Status is directly in Response
      const status = responseData.Status || responseData.status || '';
      // OrderID, SessionID, and URL are nested in Response.Order
      const encryptedOrderID = orderData.OrderID || orderData.OrderId || orderData.orderID || '';
      const encryptedSessionID = orderData.SessionID || orderData.SessionId || orderData.sessionID || '';
      const url = orderData.URL || orderData.Url || orderData.url || '';


      if (status !== '00' && status !== '') {
        // Log full response for debugging
        console.error('❌ Nabil Bank CreateOrder Error:');
        console.error('  Status:', status);
        console.error('  Full Response:', JSON.stringify(parsedResponse, null, 2));
        console.error('  Request XML:', xmlRequest);
        
        const errorMessage = responseData.ErrorMessage || responseData.errorMessage || responseData.Message || 'Order creation failed';
        const errorCode = responseData.ErrorCode || responseData.errorCode || '';
        
        // Common status codes and their meanings
        const statusMeanings: { [key: string]: string } = {
          '55': 'Invalid order data (check merchant ID, callback URLs, amount, or currency)',
          '30': 'Invalid merchant ID',
          '31': 'Invalid amount',
          '32': 'Invalid currency',
          '33': 'Invalid callback URL',
        };
        
        const statusMeaning = statusMeanings[status] || 'Unknown error';
        const fullErrorMessage = errorCode 
          ? `${errorMessage} (Status: ${status}, Code: ${errorCode}) - ${statusMeaning}`
          : `${errorMessage} (Status: ${status}) - ${statusMeaning}`;
        
        throw new BadRequestError(`Nabil Bank Error: ${fullErrorMessage}`);
      }

      if (!encryptedOrderID || !encryptedSessionID || !url) {
        throw new BadRequestError(
          `Invalid response from Nabil Bank: Missing required fields. Status: ${status}, OrderID: ${encryptedOrderID}, SessionID: ${encryptedSessionID}, URL: ${url}. Full response: ${JSON.stringify(parsedResponse)}`
        );
      }

      // Decrypt OrderID and SessionID
      let decryptedOrderID = '';
      let decryptedSessionID = '';
      
      try {
        console.log('========================================');
        console.log('NABIL ORDER CREATION - DECRYPTION');
        console.log('========================================');
        console.log('Encrypted OrderID:', encryptedOrderID);
        console.log('Encrypted SessionID:', encryptedSessionID);
        
        decryptedOrderID = this.decryptNabilId(encryptedOrderID);
        decryptedSessionID = this.decryptNabilId(encryptedSessionID);
        
        console.log('Decrypted OrderID:', decryptedOrderID);
        console.log('Decrypted SessionID:', decryptedSessionID);
        console.log('========================================');
      } catch (decryptError: any) {
        console.error('========================================');
        console.error('DECRYPTION ERROR');
        console.error('========================================');
        console.error('Error:', decryptError.message);
        console.error('Stack:', decryptError.stack);
        console.error('Encrypted OrderID:', encryptedOrderID);
        console.error('Encrypted SessionID:', encryptedSessionID);
        console.error('========================================');
        // Still return empty strings if decryption fails
        // The system will work but GetOrderStatus won't work until decryption is fixed
      }

      return {
        status,
        orderID: encryptedOrderID, // Keep encrypted for storage
        sessionID: encryptedSessionID, // Keep encrypted for storage
        decryptedOrderID,
        decryptedSessionID,
        url,
      };
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      // Log detailed error information for debugging
      console.error('❌ Nabil Bank API Error Details:');
      console.error('  API URL:', this.apiUrl);
      console.error('  Merchant ID:', this.merchantId);
      console.error('  Error Code:', error.code);
      console.error('  Error Message:', error.message);
      console.error('  Has Response:', !!error.response);
      console.error('  Has Request:', !!error.request);
      
      if (error.code) {
        console.error('  Error Code Details:', error.code);
        // Common error codes
        if (error.code === 'ECONNREFUSED') {
          console.error('  💡 Connection refused - Check API URL and network connectivity');
        } else if (error.code === 'ETIMEDOUT') {
          console.error('  💡 Request timed out - Check network connectivity or increase timeout');
        } else if (error.code === 'ENOTFOUND') {
          console.error('  💡 DNS lookup failed - Check API URL is correct');
        } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
          console.error('  💡 SSL Certificate issue - Check certificates are valid and correctly configured');
        }
      }

      // Handle axios errors
      if (error.response) {
        // Server responded with error status
        console.error('  Response Status:', error.response.status);
        console.error('  Response Data:', error.response.data);
        throw new BadRequestError(
          `Nabil Bank API Error: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        // Request made but no response
        const errorDetails = error.code 
          ? `Nabil Bank API Error: No response from server (${error.code}). Check API URL: ${this.apiUrl}`
          : `Nabil Bank API Error: No response from server. Check API URL: ${this.apiUrl}`;
        throw new BadRequestError(errorDetails);
      } else {
        // Error setting up request
        throw new BadRequestError(`Nabil Bank API Error: ${error.message}`);
      }
    }
  }

  /**
   * Get order status from Nabil Bank
   * Note: Requires DECRYPTED OrderID and SessionID
   */
  async getOrderStatus(
    request: GetOrderStatusRequest
  ): Promise<GetOrderStatusResponse> {
    if (!request.orderID && !request.sessionID) {
      throw new BadRequestError('Either orderID or sessionID is required');
    }

    // Build XML request with Merchant ID and decrypted OrderID/SessionID
    // Format matches bank's requirement: SessionID outside <Order> tag
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request>
<Operation>GetOrderStatus</Operation>
<Language>EN</Language>
<Order>
<Merchant>${this.merchantId}</Merchant>
${request.orderID ? `<OrderID>${this.escapeXml(request.orderID)}</OrderID>` : ''}
</Order>
${request.sessionID ? `<SessionID>${this.escapeXml(request.sessionID)}</SessionID>` : ''}
</Request>
</TKKPG>`;

    // Log XML request with details
    console.log('========================================');
    console.log('NABIL GETORDERSTATUS REQUEST (XML)');
    console.log('========================================');
    console.log('Decrypted OrderID:', request.orderID);
    console.log('Decrypted SessionID:', request.sessionID);
    console.log('Merchant ID:', this.merchantId);
    console.log('');
    console.log('XML Request:');
    console.log(xmlRequest);
    console.log('========================================');

    try {
      const response = await axios.post(this.apiUrl, xmlRequest, {
        headers: {
          'Content-Type': 'text/xml',
          'Content-Length': Buffer.byteLength(xmlRequest).toString(),
        },
        httpsAgent: this.getHttpsAgent(),
        timeout: 30000,
      });

      // Log XML response
      console.log('========================================');
      console.log('NABIL GETORDERSTATUS RESPONSE (XML)');
      console.log('========================================');
      console.log(response.data);
      console.log('========================================');

      // Parse XML response
      const parsedResponse = await parseStringPromise(response.data, {
        explicitArray: false,
        mergeAttrs: true,
      });

      const tkkpg = parsedResponse.TKKPG || {};
      const responseData = tkkpg.Response || {};
      const orderData = responseData.Order || {};

      // Check for errors
      if (tkkpg.Error) {
        const error = tkkpg.Error;
        throw new BadRequestError(
          `Nabil Bank Error: ${error.ErrorMessage || error.Message || 'Unknown error'}`
        );
      }

      // Extract response data
      // Status is directly in Response
      const status = responseData.Status || responseData.status || '';
      // OrderID and SessionID might be in Response or Response.Order
      const orderID = orderData.OrderID || orderData.OrderId || responseData.OrderID || responseData.OrderId || '';
      const sessionID = orderData.SessionID || orderData.SessionId || responseData.SessionID || responseData.SessionId || '';
      // OrderStatus and ResponseCode are typically in Response.Order
      const rawOrderStatus = (orderData.OrderStatus || responseData.OrderStatus || '').toString().trim();
      const orderStatus = rawOrderStatus; // Keep raw value (numeric or text)
      const responseCode = orderData.ResponseCode || responseData.ResponseCode || '';

      if (status !== '00') {
        const errorMessage = responseData.ErrorMessage || 'Failed to get order status';
        throw new BadRequestError(`Nabil Bank Error: ${errorMessage} (Status: ${status})`);
      }

      return {
        status,
        orderID,
        sessionID,
        orderStatus,
        responseCode,
      };
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      // Handle axios errors
      if (error.response) {
        throw new BadRequestError(
          `Nabil Bank API Error: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        throw new BadRequestError('Nabil Bank API Error: No response from server');
      } else {
        throw new BadRequestError(`Nabil Bank API Error: ${error.message}`);
      }
    }
  }

  /**
   * Convenience helper:
   * Accepts the raw encrypted values from Nabil (format: @encrypted@1@<HEX>)
   * and internally:
   *  1) Decrypts them using the same DES-ECB (no padding) logic as phpseclib/OpenSSL
   *  2) Calls GetOrderStatus with the decrypted OrderID / SessionID
   *
   * This mirrors the PHP sample:
   *   $encryptedOrderId = str_replace("@encrypted@1@", "", $encryptedOrderId);
   *   $decrypted = openssl_decrypt(hex2bin($encryptedOrderId), 'des-ecb', hex2bin($keyValue), OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, '');
   *
   * So from your controller / route you can simply pass the encrypted strings
   * you receive from the bank (e.g. OrderIDEncrypted, SessionIDEncrypted).
   */
  async getOrderStatusFromEncrypted(encryptedOrderID?: string, encryptedSessionID?: string): Promise<GetOrderStatusResponse> {
    if (!encryptedOrderID && !encryptedSessionID) {
      throw new BadRequestError('Either encryptedOrderID or encryptedSessionID is required');
    }

    let decryptedOrderID: string | undefined;
    let decryptedSessionID: string | undefined;

    try {
      if (encryptedOrderID) {
        decryptedOrderID = this.decryptNabilId(encryptedOrderID);
      }
      if (encryptedSessionID) {
        decryptedSessionID = this.decryptNabilId(encryptedSessionID);
      }
    } catch (error: any) {
      // Surface a clear error if decryption itself fails
      throw new BadRequestError(`Failed to decrypt Nabil IDs: ${error.message}`);
    }

    return this.getOrderStatus({
      orderID: decryptedOrderID,
      sessionID: decryptedSessionID,
    });
  }

  /**
   * Map Nabil order status to payment status
   * Supports both numeric codes (2/3/4) and textual statuses (APPROVED/DECLINED/CANCELLED)
   */
  mapOrderStatusToPaymentStatus(orderStatus: number | string): 'success' | 'failed' | 'cancelled' {
    // Normalize to handle both numeric codes and textual statuses
    let code: number | null = null;

    if (typeof orderStatus === 'number') {
      code = orderStatus;
    } else {
      const trimmed = orderStatus.toString().trim();
      const numeric = Number(trimmed);

      if (!Number.isNaN(numeric)) {
        code = numeric;
      } else {
        const s = trimmed.toUpperCase();
        if (s === 'APPROVED' || s === 'APPROVE') {
          return 'success';
        }
        if (s === 'DECLINED' || s === 'DECLINE') {
          return 'failed';
        }
        if (s === 'CANCELLED' || s === 'CANCELED' || s === 'CANCEL') {
          return 'cancelled';
        }
        // Unknown textual status → treat as failed
        return 'failed';
      }
    }

    // Map numeric status codes if available
    switch (code) {
      case 2:
        return 'success';
      case 3:
        return 'failed';
      case 4:
        return 'cancelled';
      default:
        return 'failed';
    }
  }

  /**
   * Parse Nabil Bank callback XML message
   * Expected format:
   * <Message date="...">
   *   <Version>1.0</Version>
   *   <OrderID>...</OrderID>
   *   <SessionId>...</SessionId>
   *   ...
   * </Message>
   */
  async parseCallbackXml(xmlString: string): Promise<{
    orderId: string;
    sessionId: string;
    orderStatus: string;
    purchaseAmount: number;
    totalAmount: number;
    currency: string;
    tranDateTime: string;
    orderIDEncrypted?: string;
    orderDescription?: string;
    transactionType?: string;
    language?: string;
    version?: string;
    bankName?: string;
    currencyISOAlpha?: string;
    orderStatusScr?: string;
  }> {
    try {
      const parsed = await parseStringPromise(xmlString, {
        explicitArray: false,
        mergeAttrs: true,
        trim: true,
      });

      const message = parsed.Message || parsed.message || {};
      
      // Extract all fields
      const orderId = message.OrderID || message.OrderId || message.orderID || '';
      const sessionId = message.SessionId || message.SessionID || message.sessionId || '';
      const orderStatus = message.OrderStatus || message.orderStatus || '';
      const purchaseAmount = parseFloat(message.PurchaseAmount || message.purchaseAmount || '0');
      const totalAmount = parseFloat(message.TotalAmount || message.totalAmount || '0');
      const currency = message.Currency || message.currency || '';
      const tranDateTime = message.TranDateTime || message.tranDateTime || '';
      const orderIDEncrypted = message.OrderIDEncrypted || message.orderIDEncrypted || message.OrderIdEncrypted || '';
      const orderDescription = message.OrderDescription || message.orderDescription || '';
      const transactionType = message.TransactionType || message.transactionType || 'Purchase';
      const language = message.Language || message.language || 'EN';
      const version = message.Version || message.version || '1.0';
      const bankName = message.BankName || message.bankName || 'PSP NABIL';
      const currencyISOAlpha = message.CurrencyISOAlpha || message.currencyISOAlpha || 'NPR';
      const orderStatusScr = message.OrderStatusScr || message.orderStatusScr || '';

      if (!orderId || !sessionId) {
        throw new BadRequestError('Missing required fields: OrderID or SessionId');
      }

      return {
        orderId,
        sessionId,
        orderStatus,
        purchaseAmount,
        totalAmount,
        currency,
        tranDateTime,
        orderIDEncrypted,
        orderDescription,
        transactionType,
        language,
        version,
        bankName,
        currencyISOAlpha,
        orderStatusScr,
      };
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError(`Failed to parse XML: ${error.message}`);
    }
  }

  /**
   * Map Nabil OrderStatus to callback status enum
   */
  mapOrderStatusToCallbackStatus(orderStatus: string): 'APPROVED' | 'CANCELED' | 'DECLINED' | 'EXPIRED' {
    const status = orderStatus.toUpperCase().trim();
    if (status === 'APPROVED' || status === 'APPROVE') {
      return 'APPROVED';
    }
    if (status === 'CANCELED' || status === 'CANCELLED' || status === 'CANCEL') {
      return 'CANCELED';
    }
    if (status === 'DECLINED' || status === 'DECLINE') {
      return 'DECLINED';
    }
    if (status === 'EXPIRED' || status === 'EXPIRE') {
      return 'EXPIRED';
    }
    // Default to DECLINED for unknown statuses
    return 'DECLINED';
  }

  /**
   * Decrypt encrypted OrderID or SessionID from Nabil Bank
   * Format: @encrypted@1@<hex_encrypted_data>
   * Algorithm: DES-ECB with no padding (matches OpenSSL/phpseclib)
   * Key: 0123456789abcdef (hex)
   * 
   * Matches PHP code:
   * $encryptedOrderId = str_replace("@encrypted@1@", "", $encryptedOrderId);
   * $decrypted = openssl_decrypt(hex2bin($encryptedOrderId), 'des-ecb', hex2bin($keyValue), OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, '');
   * 
   * Note: Uses FULL hex string length (not just first 16 chars)
   */
  decryptNabilId(encryptedString: string): string {
    try {
      // Remove @encrypted@1@ prefix (matches PHP: str_replace("@encrypted@1@", "", ...))
      const hexEncrypted = encryptedString.replace(/^@encrypted@1@/, '');
      
      if (!hexEncrypted) {
        throw new BadRequestError('Invalid encrypted string format');
      }

      // Convert hex string to binary (matches PHP: hex2bin($encryptedOrderId))
      // Use the FULL hex string length (not just first 16 chars)
      const encryptedBytes = Buffer.from(hexEncrypted, 'hex');
      
      // Convert key from hex string to binary (matches PHP: hex2bin($keyValue))
      const keyBytes = Buffer.from(this.decryptionKey, 'hex');
      
      // Verify key length (DES requires 8 bytes)
      if (keyBytes.length !== 8) {
        throw new BadRequestError(`Invalid key length: DES requires 8 bytes, got ${keyBytes.length}`);
      }

      // Convert to crypto-js format
      // CryptoJS expects WordArray format
      const encryptedWordArray = CryptoJS.lib.WordArray.create(encryptedBytes);
      const keyWordArray = CryptoJS.lib.WordArray.create(keyBytes);

      // Decrypt using DES-ECB with no padding (matches OpenSSL OPENSSL_ZERO_PADDING)
      const decrypted = CryptoJS.DES.decrypt(
        { ciphertext: encryptedWordArray } as any,
        keyWordArray,
        {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.NoPadding,
        }
      );

      // Convert to string and trim whitespace (matches PHP: trim())
      // Remove null bytes and trim
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8).replace(/\0/g, '').trim();
      
      if (!decryptedString) {
        throw new BadRequestError('Decryption failed or resulted in empty string');
      }

      return decryptedString;
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError(`Failed to decrypt: ${error.message}`);
    }
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}






