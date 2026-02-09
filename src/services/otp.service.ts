import env from '@config/env';
import { generateOTP, getOTPExpiry } from '@utils/otp.util';

// TODO: Integrate with Twilio or SMS service
export class OTPService {
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    // For development: log OTP to console
    console.log(`\n📱 OTP for ${phone}: ${otp}\n`);
    
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER) {
      // TODO: Implement Twilio SMS sending
      // const client = require('twilio')(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      // await client.messages.create({
      //   body: `Your OTP is: ${otp}`,
      //   to: phone,
      //   from: env.TWILIO_PHONE_NUMBER,
      // });
    }
    
    return true;
  }

  generateOTP(): string {
    return generateOTP();
  }

  getOTPExpiry(): Date {
    return getOTPExpiry();
  }
}

