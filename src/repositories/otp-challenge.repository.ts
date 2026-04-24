import { OtpChallengeModel, IOtpChallenge, OtpPurpose } from '@models/OtpChallenge.model';

export class OtpChallengeRepository {
  async findByPhoneAndPurpose(phoneE164: string, purpose: OtpPurpose): Promise<IOtpChallenge | null> {
    return OtpChallengeModel.findOne({ phoneE164, purpose });
  }

  async upsertChallenge(
    phoneE164: string,
    purpose: OtpPurpose,
    payload: Partial<IOtpChallenge>
  ): Promise<IOtpChallenge> {
    const doc = await OtpChallengeModel.findOneAndUpdate(
      { phoneE164, purpose },
      { $set: payload, $setOnInsert: { phoneE164, purpose } },
      { new: true, upsert: true }
    );
    return doc!;
  }

  async deleteChallenge(phoneE164: string, purpose: OtpPurpose): Promise<void> {
    await OtpChallengeModel.deleteOne({ phoneE164, purpose });
  }
}

