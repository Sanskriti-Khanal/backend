import mongoose from 'mongoose';
import { UserModel, IUser } from '@models/User.model';
import { UserRole } from '@types';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUser> {
    return UserModel.create(userData);
  }

  async findById(id: string): Promise<IUser | null> {
    return UserModel.findById(id);
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return UserModel.findOne({ phone });
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return UserModel.findOne({ username: username.toLowerCase() });
  }

  async findByPhoneWithOTP(phone: string): Promise<IUser | null> {
    return UserModel.findOne({ phone }).select('+otp +otpExpiry');
  }

  async updateOTP(phone: string, otp: string, otpExpiry: Date): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { phone },
      { otp, otpExpiry },
      { new: true }
    );
  }

  async verifyPhone(phone: string): Promise<IUser | null> {
    // Only mark phone verified; do NOT clear OTP here so forgot-password flow
    // can still call reset-password with the same OTP. OTP is cleared in updatePassword.
    return UserModel.findOneAndUpdate(
      { phone },
      { isPhoneVerified: true },
      { new: true }
    );
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async findByRole(role: UserRole): Promise<IUser[]> {
    return UserModel.find({ role, isActive: true });
  }

  async findByIdsWithAvailabilityStatus(
    ids: mongoose.Types.ObjectId[],
    availabilityStatus: 'active' | 'not_active' | 'busy'
  ): Promise<IUser[]> {
    if (ids.length === 0) return [];
    return UserModel.find({
      _id: { $in: ids },
      isActive: true,
      availabilityStatus,
    })
      .select('_id fullName avatarUrl availabilityStatus')
      .exec();
  }

  async findAll(): Promise<IUser[]> {
    return UserModel.find();
  }

  async delete(id: string): Promise<boolean> {
    const result = await UserModel.findByIdAndDelete(id);
    return !!result;
  }

  async updatePassword(phone: string, hashedPassword: string): Promise<IUser | null> {
    return UserModel.findOneAndUpdate(
      { phone },
      { 
        password: hashedPassword,
        $unset: { otp: 1, otpExpiry: 1 }
      },
      { new: true }
    );
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return UserModel.findById(id).select('+password');
  }

  async updatePasswordById(id: string, hashedPassword: string): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
  }
}








