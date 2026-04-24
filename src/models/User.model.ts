import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@types';

/** Birth data used for personalized Rashifal / notifications (separate from generic account fields). */
export interface IAstroDetails {
  dateOfBirth?: Date;
  timeOfBirth?: string;
  placeOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

export interface IUser extends Document {
  phone: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  isPhoneVerified: boolean;
  otp?: string;
  otpExpiry?: Date;
  
  // User-specific fields (only for role: 'user')
  dob?: Date;
  birthTime?: string;
  birthPlace?: string;
  kundaliCompleted?: boolean;

  /** Nested birth chart inputs for Rashifal personalization. */
  astroDetails?: IAstroDetails;
  /** True when astroDetails has required fields for personalized daily Rashifal. */
  profileCompleted?: boolean;
  
  // Jyotish/Vaastu expert availability: active | not_active | busy
  availabilityStatus?: 'active' | 'not_active' | 'busy';
  // Jyotish-specific fields (only for role: 'jyotish')
  specialtyTitle?: string;
  bio?: string;
  isOnline?: boolean;
  avatarUrl?: string;
  callPrice?: number; // Price per hour for call
  chatPrice?: number; // Price per sector for chat
  /** Vaastu / site consultation: remote vs in-person (optional; falls back to chat/call in clients). */
  onlinePrice?: number;
  offlinePrice?: number;
  experienceYears?: number; // Years of experience
  
  // Common fields
  isActive: boolean;
  /** Incremented on password change to invalidate access JWTs (`tv` claim) and refresh rows. */
  tokenVersion?: number;
  createdAt: Date;
  updatedAt: Date;

  /** Last Vedika AI query (UTC); one question per Asia/Kathmandu calendar day */
  vedikaLastQueryAt?: Date;
}

const astroDetailsSchema = new Schema(
  {
    dateOfBirth: { type: Date },
    timeOfBirth: { type: String, trim: true },
    placeOfBirth: { type: String, trim: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.USER,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    // User-specific
    dob: Date,
    birthTime: String,
    birthPlace: String,
    kundaliCompleted: {
      type: Boolean,
      default: false,
    },
    astroDetails: {
      type: astroDetailsSchema,
      default: undefined,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Jyotish/Vaastu expert availability
    availabilityStatus: {
      type: String,
      enum: ['active', 'not_active', 'busy'],
      default: 'not_active',
    },
    // Jyotish-specific
    specialtyTitle: String,
    bio: String,
    isOnline: {
      type: Boolean,
      default: false,
    },
    avatarUrl: String,
    callPrice: {
      type: Number,
      min: 0,
    },
    chatPrice: {
      type: Number,
      min: 0,
    },
    onlinePrice: {
      type: Number,
      min: 0,
    },
    offlinePrice: {
      type: Number,
      min: 0,
    },
    experienceYears: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    vedikaLastQueryAt: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });

export const UserModel = mongoose.model<IUser>('User', userSchema);










