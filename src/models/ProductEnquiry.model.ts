import mongoose, { Schema, Document } from 'mongoose';

export enum EnquiryStatus {
  PENDING = 'pending',
  CONTACTED = 'contacted',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface IProductEnquiry extends Document {
  product: mongoose.Types.ObjectId; // Reference to Product
  mobile: string;
  email: string;
  message?: string;
  status: EnquiryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const productEnquirySchema = new Schema<IProductEnquiry>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(EnquiryStatus),
      default: EnquiryStatus.PENDING,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

productEnquirySchema.index({ product: 1 });
productEnquirySchema.index({ status: 1 });
productEnquirySchema.index({ createdAt: -1 });

export const ProductEnquiryModel = mongoose.model<IProductEnquiry>(
  'ProductEnquiry',
  productEnquirySchema
);
