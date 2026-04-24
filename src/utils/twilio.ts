import twilio from 'twilio';
import env from '@config/env';
import { BadRequestError, TooManyRequestsError } from '@errors/AppError';
import { toE164Plus } from '@utils/otp.util';

const accountSid = env.TWILIO_ACCOUNT_SID;
const authToken = env.TWILIO_AUTH_TOKEN;
const apiKey = env.TWILIO_API_KEY || env.TWILIO_API_KEY_SID;
const apiSecret = env.TWILIO_API_SECRET || env.TWILIO_API_KEY_SECRET;
const verifyServiceSid = env.TWILIO_VERIFY_SERVICE_SID;

function hasApiKeyPair(): boolean {
  return Boolean(apiKey && apiSecret);
}

function assertTwilioVerifyConfigured(): void {
  if (!accountSid || !verifyServiceSid) {
    throw new BadRequestError(
      'Twilio Verify is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_VERIFY_SERVICE_SID, plus either TWILIO_AUTH_TOKEN or (TWILIO_API_KEY + TWILIO_API_SECRET).'
    );
  }
  if (!authToken && !hasApiKeyPair()) {
    throw new BadRequestError(
      'Twilio credentials missing. Set TWILIO_AUTH_TOKEN or (TWILIO_API_KEY + TWILIO_API_SECRET) with TWILIO_ACCOUNT_SID.'
    );
  }

  if (!/^AC[a-zA-Z0-9]{32}$/.test(accountSid.trim())) {
    throw new BadRequestError('Invalid TWILIO_ACCOUNT_SID format. Expected AC followed by 32 characters.');
  }
  if (hasApiKeyPair() && (!/^SK[a-zA-Z0-9]{32}$/.test(apiKey!.trim()))) {
    throw new BadRequestError('Invalid TWILIO_API_KEY format. Expected SK followed by 32 characters.');
  }
  if (!/^VA[a-zA-Z0-9]{32}$/.test(verifyServiceSid.trim())) {
    throw new BadRequestError('Invalid TWILIO_VERIFY_SERVICE_SID format. Expected VA followed by 32 characters.');
  }
}

function ensureE164(phoneNumber: string): string {
  try {
    return toE164Plus(phoneNumber);
  } catch (e) {
    if (e instanceof BadRequestError) throw e;
    throw new BadRequestError('Invalid phone number');
  }
}

function createTwilioClient() {
  assertTwilioVerifyConfigured();
  if (authToken) {
    return twilio(accountSid, authToken);
  }
  return twilio(apiKey!, apiSecret!, { accountSid: accountSid! });
}

export async function sendOTP(phoneNumber: string): Promise<void> {
  const to = ensureE164(phoneNumber);
  const client = createTwilioClient();
  try {
    await client.verify.v2.services(verifyServiceSid!.trim()).verifications.create({
      to,
      channel: 'sms',
    });
  } catch (error: any) {
    if (error?.code === 20003 || error?.status === 401) {
      throw new BadRequestError(
        'Twilio authentication failed (20003). If using TWILIO_AUTH_TOKEN, confirm it is current. If using API keys, they must match the same Account SID.'
      );
    }
    // Twilio Verify Fraud Guard: destination/prefix temporarily blocked on SMS channel.
    // This is a temporary anti-fraud block (typically auto-lifts after some time).
    if (error?.code === 60410 || error?.code === '60410') {
      throw new TooManyRequestsError(
        'OTP delivery is temporarily blocked by Twilio Fraud Guard for this number/prefix. Please try again later or use another verification channel.'
      );
    }
    throw error;
  }
}

export async function verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
  const to = ensureE164(phoneNumber);
  const trimmedCode = (code || '').trim();
  if (!trimmedCode) {
    throw new BadRequestError('OTP code is required');
  }

  const client = createTwilioClient();
  try {
    const result = await client.verify.v2.services(verifyServiceSid!.trim()).verificationChecks.create({
      to,
      code: trimmedCode,
    });
    return result.status === 'approved';
  } catch (error: any) {
    if (error?.code === 20003 || error?.status === 401) {
      throw new BadRequestError(
        'Twilio authentication failed (20003). If using TWILIO_AUTH_TOKEN, confirm it is current. If using API keys, they must match the same Account SID.'
      );
    }
    // Twilio returns 404 / 20404 when there is no open verification for this To+Service:
    // code expired (~10m), max check attempts, already approved (e.g. double submit), or
    // no prior verifications.create for this number+service. Message text is confusingly "VerificationCheck was not found".
    const twilioCode = error?.code;
    if (twilioCode === 20404 || twilioCode === '20404' || (error?.status === 404 && /VerificationCheck/i.test(String(error?.message || '')))) {
      throw new BadRequestError(
        'This verification is no longer active. The code may have expired, or it was already used. Please request a new OTP.'
      );
    }
    throw error;
  }
}

