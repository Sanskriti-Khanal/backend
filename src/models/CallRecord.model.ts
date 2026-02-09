import mongoose, { Schema, Document } from 'mongoose';

export interface ICallRecord extends Document {
  booking: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  jyotish: mongoose.Types.ObjectId;
  roomName?: string; // Jitsi room name for join link (e.g. meet.jit.si/{roomName})
  startedAt: Date;
  endedAt?: Date;
  duration: number; // in seconds
  callType: string; // 'audio' or 'video'
  recordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const callRecordSchema = new Schema<ICallRecord>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'JyotishBooking',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jyotish: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomName: {
      type: String,
      trim: true,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    callType: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio',
    },
    recordingUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

callRecordSchema.index({ booking: 1 });
callRecordSchema.index({ user: 1 });
callRecordSchema.index({ jyotish: 1 });

export const CallRecordModel = mongoose.model<ICallRecord>(
  'CallRecord',
  callRecordSchema
);












