import axios from 'axios';
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

/** Only `name`, `email`, `phone` are valid on Khalti `customer_info`; extra app keys cause "name required" errors. */
export type KhaltiCustomerInfoPayload = { name: string; email?: string; phone?: string };

/**
 * Build Khalti-safe `customer_info`. When the client sends a non-empty object (e.g. `pujariId`,
 * `healingBooking`), Khalti still receives `customer_info` and requires `name` — use fallbacks from the payer.
 * When the client sends nothing, omit `customer_info` (same as call/chat flows).
 */
export function pickKhaltiCustomerInfo(
  raw: unknown,
  fallbacks: { name?: string; phone?: string }
): KhaltiCustomerInfoPayload | undefined {
  const hasRaw =
    raw !== null &&
    raw !== undefined &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    Object.keys(raw as Record<string, unknown>).length > 0;

  if (!hasRaw) return undefined;

  const o = raw as Record<string, unknown>;
  const trimStr = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  let name = trimStr(o.name);
  let phone = trimStr(o.phone);
  const emailRaw = trimStr(o.email);

  const fbName = typeof fallbacks.name === 'string' ? fallbacks.name.trim() : '';
  const fbPhone = typeof fallbacks.phone === 'string' ? fallbacks.phone.trim() : '';

  if (!name && fbName) name = fbName;
  if (!phone && fbPhone) phone = fbPhone;

  const email =
    emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : undefined;

  if (!name) return undefined;

  const out: KhaltiCustomerInfoPayload = { name };
  if (email) out.email = email;
  if (phone) out.phone = phone;
  return out;
}

/** Khalti validation_error bodies use field keys with string[] messages, not a top-level `message`. */
function extractKhaltiFieldValidationMessages(
  data: Record<string, unknown>,
  depth = 0
): string[] {
  if (!data || typeof data !== 'object' || depth > 4) return [];
  const skip = new Set(['error_key', 'key', 'status_code']);
  const out: string[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (skip.has(key)) continue;
    if (Array.isArray(val)) {
      const parts = val
        .map((item) =>
          typeof item === 'string'
            ? item
            : item !== null && typeof item === 'object'
              ? JSON.stringify(item)
              : String(item)
        )
        .filter(Boolean);
      if (parts.length) out.push(`${key}: ${parts.join('; ')}`);
    } else if (typeof val === 'string' && val.trim() !== '') {
      out.push(`${key}: ${val}`);
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const nested = extractKhaltiFieldValidationMessages(val as Record<string, unknown>, depth + 1);
      for (const n of nested) out.push(`${key}.${n}`);
    }
  }
  return out;
}

/** Axios may leave `data` as a string (non-JSON) or Buffer in edge cases. */
function normalizeKhaltiErrorPayload(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) {
    try {
      const parsed: unknown = JSON.parse(raw.toString('utf8'));
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { _khalti_raw_body: raw.toString('utf8').slice(0, 2000) };
    }
  }
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return { _khalti_raw_body: raw.slice(0, 2000) };
    }
    return {};
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return { _khalti_raw_body: String(raw).slice(0, 2000) };
}

export class KhaltiService {
  private readonly apiUrl: string;
  private readonly secretKey: string;
  private readonly publicKey: string;
  private static configLogged = false;

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

    if (!KhaltiService.configLogged) {
      console.log('🔧 Khalti Service Configuration:');
      console.log('  API URL:', this.apiUrl);
      console.log('  Environment:', this.apiUrl.includes('dev.') ? 'TEST/SANDBOX' : 'PRODUCTION');
      console.log('  Secret Key:', this.secretKey ? `${this.secretKey.substring(0, 8)}...` : 'Not set');
      console.log('  Public Key:', this.publicKey ? `${this.publicKey.substring(0, 8)}...` : 'Not set');
      KhaltiService.configLogged = true;
    }
  }

  /**
   * `website_url` sent to Khalti should match the merchant site configured in Khalti admin.
   * When BASE_URL is an API host (e.g. api.example.com), set KHALTI_WEBSITE_URL to the public site.
   */
  websiteUrlForInitiate(apiBaseUrl: string): string {
    const trimmedApi = apiBaseUrl.replace(/\/$/, '');
    const override = env.KHALTI_WEBSITE_URL?.replace(/\/$/, '');
    if (
      override &&
      override.startsWith('https://') &&
      !override.includes('localhost') &&
      !override.includes('127.0.0.1')
    ) {
      return override;
    }
    // Khalti often validates website_url against the merchant’s public site; api.* is frequently rejected.
    try {
      const u = new URL(trimmedApi);
      if (
        u.protocol === 'https:' &&
        u.hostname.startsWith('api.') &&
        u.hostname.length > 4
      ) {
        const rootHost = u.hostname.slice(4);
        if (rootHost.includes('.')) {
          return `https://${rootHost}`;
        }
      }
    } catch {
      /* ignore */
    }
    return trimmedApi;
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
      // Never JSON.stringify(error.response) — Axios wires req↔res cycles (ClientRequest/IncomingMessage).
      const safeSummary = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      };
      try {
        console.error('  Response summary:', JSON.stringify(safeSummary, null, 2));
      } catch {
        console.error('  Response summary (raw status/data):', safeSummary.status, safeSummary.data);
      }
      try {
        const headers = error.response?.headers;
        console.error(
          '  Response Headers:',
          headers && typeof headers === 'object'
            ? JSON.stringify({ ...headers })
            : String(headers)
        );
      } catch {
        console.error('  Response Headers: (could not serialize)');
      }
      console.error('  Error Message:', error.message);
      console.error('  Request URL:', `${this.apiUrl}/epayment/initiate/`);
      console.error('  Request Payload:', JSON.stringify(payload, null, 2));
      
      // Extract detailed error information from Khalti response
      const errorData = normalizeKhaltiErrorPayload(error.response?.data);
      
      const fieldValidation = extractKhaltiFieldValidationMessages(errorData);
      const detailVal = errorData.detail;
      const errorDetail =
        (typeof detailVal === 'string' ? detailVal : null) ||
        (Array.isArray(detailVal)
          ? detailVal.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('; ')
          : null) ||
        errorData.error_message ||
        errorData.message ||
        (typeof errorData.error === 'string' ? errorData.error : null);
      const errorKey = errorData.error_key || errorData.key;
      const validationErrors = errorData.errors || errorData.validation_errors;
      
      // Build comprehensive error message
      let errorMessage = 'Failed to initiate Khalti payment';
      
      // Field-scoped validation (most common for error_key: validation_error)
      if (fieldValidation.length > 0) {
        errorMessage = `Khalti: ${fieldValidation.join(' | ')}`;
      } else if (errorDetail) {
        if (typeof errorDetail === 'string') {
          errorMessage = `Khalti Error: ${errorDetail}`;
        } else if (typeof errorDetail === 'object') {
          errorMessage = `Khalti Error: ${JSON.stringify(errorDetail)}`;
        }
      } else if (validationErrors) {
        const validationMsg = typeof validationErrors === 'string' 
          ? validationErrors 
          : JSON.stringify(validationErrors);
        errorMessage = `Khalti validation error: ${validationMsg}`;
      } else if (errorKey) {
        const fallback =
          (typeof errorData.message === 'string' && errorData.message) ||
          (typeof errorData.detail === 'string' && errorData.detail) ||
          'See server logs for Khalti response body';
        errorMessage = `Khalti Error (${errorKey}): ${fallback}`;
      } else if (error.response?.status === 400) {
        errorMessage = 'Khalti validation error: Invalid request parameters. Check logs for details.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Khalti authentication error: Invalid secret key';
      } else if (error.response?.status === 403) {
        errorMessage = 'Khalti authorization error: Access denied';
      } else if (error.message) {
        errorMessage = `Khalti Error: ${error.message}`;
      }

      const weakMessage =
        errorMessage === 'Failed to initiate Khalti payment' ||
        (typeof errorKey === 'string' &&
          errorMessage.includes(`(${errorKey})`) &&
          errorMessage.includes('See server logs'));
      if (weakMessage || (fieldValidation.length === 0 && errorKey && !errorDetail)) {
        try {
          const snap = JSON.stringify(errorData);
          if (snap && snap !== '{}') {
            errorMessage += ` | Khalti response: ${snap}`;
          }
        } catch {
          /* ignore */
        }
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
