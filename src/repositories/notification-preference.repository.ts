import {
  NotificationPreferenceModel,
  INotificationPreference,
} from '@models/NotificationPreference.model';

export class NotificationPreferenceRepository {
  async createPreference(
    preferenceData: Partial<INotificationPreference>
  ): Promise<INotificationPreference> {
    return NotificationPreferenceModel.create(preferenceData);
  }

  async findPreferenceByUser(
    userId: string
  ): Promise<INotificationPreference | null> {
    return NotificationPreferenceModel.findOne({ user: userId });
  }

  async findOrCreatePreference(
    userId: string
  ): Promise<INotificationPreference> {
    let preference = await this.findPreferenceByUser(userId);
    if (!preference) {
      preference = await this.createPreference({
        user: userId as any,
      });
    }
    return preference;
  }

  async updatePreference(
    userId: string,
    data: Partial<INotificationPreference>
  ): Promise<INotificationPreference | null> {
    return NotificationPreferenceModel.findOneAndUpdate(
      { user: userId },
      data,
      { new: true, upsert: true }
    );
  }

  async updatePreferenceField(
    userId: string,
    field: string,
    value: boolean | string
  ): Promise<INotificationPreference | null> {
    const updateData: any = {};
    if (field.startsWith('preferences.')) {
      updateData[field] = value;
    } else {
      updateData[field] = value;
    }

    return NotificationPreferenceModel.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true, upsert: true }
    );
  }

  async deletePreference(userId: string): Promise<boolean> {
    const result = await NotificationPreferenceModel.findOneAndDelete({
      user: userId,
    });
    return !!result;
  }
}












