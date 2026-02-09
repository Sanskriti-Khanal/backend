import axios, { AxiosRequestConfig } from 'axios';
import { BadRequestError } from '@errors/AppError';
import env from '@config/env';

interface InitiatePaymentRequest {
  return_url: string;
  website_url: string;
  amount: number; // Amount in paisa (e.g., 10000 for NPR 100.00)
  purchase_order_id: string;
  purchase_order_name: string;
  customer_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

interface InitiatePaymentResponse {
  pidx: string; // Payment ID
  payment_url: string; // URL to redirect user for payment
  expires_at: string;
  expires_in: number;
}

interface VerifyPaymentResponse {
  status: string;
  pidx: string;
  total_amount: number;
  transaction_id?: string;
  fee?: number;
  refunded?: boolean;
}

export class KhaltiService {
  private readonly apiUrl: string;
  private readonly secretKey: string;
  private readonly publicKey: string;

  constructor() {
    // Khalti API URLs
    // Production: https://khalti.com/api/v2
    // Test/Sandbox: https://dev.khalti.com/api/v2
    let apiUrl = env.KHALTI_API_URL || 'https://dev.khalti.com/api/v2';
    
    // Normalize API URL - ensure it ends with /api/v2
    if (apiUrl && !apiUrl.includes('/api/v2')) {
      // If URL doesn't include /api/v2, append it
      apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
      apiUrl = `${apiUrl}/api/v2`;
    }
    
    this.apiUrl = apiUrl;
    this.secretKey = env.KHALTI_SECRET_KEY || '';
    this.publicKey = env.KHALTI_PUBLIC_KEY || '';

    console.log('🔧 Khalti Service Configuration:');
    console.log('  API URL:', this.apiUrl);
    console.log('  Environment:', this.apiUrl.includes('dev.') ? 'TEST/SANDBOX' : 'PRODUCTION');
    console.log('  Secret Key:', this.secretKey ? `${this.secretKey.substring(0, 8)}...` : 'Not set');
    console.log('  Public Key:', this.publicKey ? `${this.publicKey.substring(0, 8)}...` : 'Not set');
  }

  /**
   * Initiate payment with Khalti
   * Creates a payment session and returns payment URL
   */
  async initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    if (!this.secretKey) {
      throw new BadRequestError('Khalti secret key is not configured');
    }

    // Pre-request validation
    const validationErrors: string[] = [];
    
    if (!request.return_url || typeof request.return_url !== 'string') {
      validationErrors.push('return_url is required and must be a string');
    } else if (request.return_url.includes('localhost') || request.return_url.includes('127.0.0.1')) {
      validationErrors.push('return_url must be a publicly accessible HTTPS URL (not localhost)');
    } else if (!request.return_url.startsWith('https://')) {
      validationErrors.push('return_url must use HTTPS protocol');
    }
    
    if (!request.website_url || typeof request.website_url !== 'string') {
      validationErrors.push('website_url is required and must be a string');
    } else if (request.website_url.includes('localhost') || request.website_url.includes('127.0.0.1')) {
      validationErrors.push('website_url must be a publicly accessible HTTPS URL (not localhost)');
    } else if (!request.website_url.startsWith('https://')) {
      validationErrors.push('website_url must use HTTPS protocol');
    }
    
    if (!request.amount || typeof request.amount !== 'number' || request.amount < 100) {
      validationErrors.push('amount must be at least 100 paisa (NPR 1.00)');
    }
    
    if (!request.purchase_order_id || typeof request.purchase_order_id !== 'string' || request.purchase_order_id.length < 3) {
      validationErrors.push('purchase_order_id must be at least 3 characters');
    }
    
    if (!request.purchase_order_name || typeof request.purchase_order_name !== 'string' || request.purchase_order_name.length < 3) {
      validationErrors.push('purchase_order_name must be at least 3 characters');
    }
    
    if (validationErrors.length > 0) {
      throw new BadRequestError(`Khalti validation error: ${validationErrors.join('; ')}`);
    }

    // Build request payload - only include customer_info if it has values
    const payload: any = {
      return_url: request.return_url,
      website_url: request.website_url,
      amount: request.amount, // Amount in paisa
      purchase_order_id: request.purchase_order_id,
      purchase_order_name: request.purchase_order_name,
    };
    
    // Only include customer_info if it exists and has at least one property
    if (request.customer_info && Object.keys(request.customer_info).length > 0) {
      payload.customer_info = request.customer_info;
    }

    try {
      console.log('📤 Sending Khalti payment request:');
      console.log('  URL:', `${this.apiUrl}/epayment/initiate/`);
      console.log('  Payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post<InitiatePaymentResponse>(
        `${this.apiUrl}/epayment/initiate/`,
        payload,
        {
          headers: {
            'Authorization': `Key ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ Khalti payment initiated successfully');
      console.log('  Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Khalti InitiatePayment Error:');
      console.error('  Status:', error.response?.status);
      console.error('  Status Text:', error.response?.statusText);
      console.error('  Full Response:', JSON.stringify(error.response || {}, null, 2));
      console.error('  Response Data:', JSON.stringify(error.response?.data || {}, null, 2));
      console.error('  Response Headers:', JSON.stringify(error.response?.headers || {}, null, 2));
      console.error('  Error Message:', error.message);
      console.error('  Request URL:', `${this.apiUrl}/epayment/initiate/`);
      console.error('  Request Payload:', JSON.stringify(payload, null, 2));
      
      // Extract detailed error information from Khalti response
      const errorData = error.response?.data || {};
      
      // Khalti API error structure can vary, check multiple possible fields
      const errorDetail = errorData.detail || 
                         errorData.error_message || 
                         errorData.message || 
                         errorData.error ||
                         (typeof errorData === 'string' ? errorData : null);
      const errorKey = errorData.error_key || errorData.key;
      const validationErrors = errorData.errors || errorData.validation_errors || errorData.error;
      
      // Build comprehensive error message
      let errorMessage = 'Failed to initiate Khalti payment';
      
      // Try to extract the most specific error message
      if (errorDetail) {
        if (typeof errorDetail === 'string') {
          errorMessage = `Khalti Error: ${errorDetail}`;
        } else if (typeof errorDetail === 'object') {
          errorMessage = `Khalti Error: ${JSON.stringify(errorDetail)}`;
        }
      } else if (errorKey) {
        errorMessage = `Khalti Error (${errorKey}): ${errorData.message || 'Unknown error'}`;
      } else if (validationErrors) {
        const validationMsg = typeof validationErrors === 'string' 
          ? validationErrors 
          : JSON.stringify(validationErrors);
        errorMessage = `Khalti validation error: ${validationMsg}`;
      } else if (error.response?.status === 400) {
        errorMessage = 'Khalti validation error: Invalid request parameters. Check logs for details.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Khalti authentication error: Invalid secret key';
      } else if (error.response?.status === 403) {
        errorMessage = 'Khalti authorization error: Access denied';
      } else if (error.message) {
        errorMessage = `Khalti Error: ${error.message}`;
      }
      
      // Add request details for debugging
      if (error.response?.status === 400) {
        errorMessage += `\nRequest details: return_url=${request.return_url}, website_url=${request.website_url}, amount=${request.amount} paisa`;
      }
      
      throw new BadRequestError(errorMessage);
    }
  }

  /**
   * Verify payment status using pidx
   */
  async verifyPayment(pidx: string): Promise<VerifyPaymentResponse> {
    if (!this.secretKey) {
      throw new BadRequestError('Khalti secret key is not configured');
    }

    try {
      const response = await axios.post<VerifyPaymentResponse>(
        `${this.apiUrl}/epayment/lookup/`,
        {
          pidx: pidx,
        },
        {
          headers: {
            'Authorization': `Key ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('❌ Khalti VerifyPayment Error:', error.response?.data || error.message);
      throw new BadRequestError(
        error.response?.data?.detail || 
        error.response?.data?.error_key || 
        'Failed to verify Khalti payment'
      );
    }
  }

  /**
   * Convert NPR amount to paisa (Khalti uses paisa)
   */
  nprToPaisa(amountNpr: number): number {
    return Math.round(amountNpr * 100);
  }

  /**
   * Convert paisa to NPR
   */
  paisaToNpr(amountPaisa: number): number {
    return amountPaisa / 100;
  }
}
