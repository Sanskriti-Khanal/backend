import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  booking: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId; // user or jyotish
  receiver: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'JyotishBooking',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

chatMessageSchema.index({ booking: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });
chatMessageSchema.index({ receiver: 1 });
chatMessageSchema.index({ read: 1 });

export const ChatMessageModel = mongoose.model<IChatMessage>(
  'ChatMessage',
  chatMessageSchema
);












