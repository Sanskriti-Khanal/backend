import env from '@config/env';
import twilio from 'twilio';
import axios from 'axios';
import { BadRequestError } from '@errors/AppError';
import { generateOTP, getOTPExpiry } from '@utils/otp.util';

/** phone is canonical E.164 digits (e.g. 9779812345678, 14155551234). Return +E.164 for Twilio. */
function toE164(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  return digits ? `+${digits}` : phone.startsWith('+') ? phone : `+${phone}`;
}

/** India (91) or Nepal (977) – use MSG91 for these. */
function isIndiaOrNepal(canonicalDigits: string): boolean {
  return canonicalDigits.startsWith('91') || canonicalDigits.startsWith('977');
}

/** Send via MSG91 (India/Nepal). phone = canonical digits (91xxxxxxxxxx or 977xxxxxxxxxx). */
async function sendViaMSG91(phone: string, otp: string): Promise<void> {
  const authkey = env.MSG91_AUTH_KEY!;
  const sender = (env.MSG91_SENDER || 'MEROSA').slice(0, 6);
  const digits = (phone || '').replace(/\D/g, '');
  const mobile = digits; // already with country code (91 or 977)
  const message = encodeURIComponent(`Your Mero Sathi OTP is: ${otp}. Valid for 10 minutes.`);
  const url = `https://api.msg91.com/api/sendhttp.php?authkey=${authkey}&mobiles=${mobile}&message=${message}&sender=${sender}&route=4`;
  const res = await axios.get(url, { timeout: 10000 });
  const body = String(res.data ?? '');
  if (body.toLowerCase().includes('invalid') || body.toLowerCase().includes('error')) {
    throw new Error(body || 'MSG91 error');
  }
}

export class OTPService {
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    const isProduction = env.NODE_ENV === 'production';
    const hasMSG91 = Boolean(env.MSG91_AUTH_KEY);
    const hasTwilio =
      Boolean(env.TWILIO_ACCOUNT_SID) &&
      Boolean(env.TWILIO_AUTH_TOKEN) &&
      Boolean(env.TWILIO_PHONE_NUMBER);
    const digits = (phone || '').replace(/\D/g, '');

    // India/Nepal: prefer MSG91 if configured
    if (hasMSG91 && isIndiaOrNepal(digits)) {
      try {
        await sendViaMSG91(phone, otp);
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'SMS failed';
        throw new BadRequestError(`Could not send OTP: ${msg}`);
      }
    }

    // Worldwide (USA, UAE, etc.) or fallback: use Twilio
    if (hasTwilio) {
      try {
        const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
        const to = toE164(phone);
        await client.messages.create({
          body: `Your Mero Sathi OTP is: ${otp}. Valid for 10 minutes.`,
          to,
          from: env.TWILIO_PHONE_NUMBER!,
        });
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'SMS failed';
        throw new BadRequestError(`Could not send OTP: ${msg}`);
      }
    }

    // India/Nepal but MSG91 not set, or other country and Twilio not set
    if (isProduction) {
      if (isIndiaOrNepal(digits)) {
        throw new BadRequestError('SMS not configured. Set MSG91 (MSG91_AUTH_KEY) or Twilio (TWILIO_*).');
      }
      throw new BadRequestError(
        'SMS not configured for this country. Set Twilio (TWILIO_*) for worldwide OTP (USA, UAE, etc.).'
      );
    }

    console.log(`\n📱 OTP for ${phone}: ${otp}\n   (Set Twilio for worldwide or MSG91 for IN/NP; or DEV_OTP_BYPASS=${otp})\n`);
    return true;
  }

  generateOTP(): string {
    return generateOTP();
  }

  getOTPExpiry(): Date {
    return getOTPExpiry();
  }
}

