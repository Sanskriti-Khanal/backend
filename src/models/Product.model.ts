import mongoose, { Schema, Document } from 'mongoose';

export enum ProductAvailability {
  IN_STOCK = 'InStock',
  OUT_OF_STOCK = 'OutOfStock',
  PRE_ORDER = 'PreOrder',
}

/** Size variant for rudraksha (e.g. Regular, Medium, Collector, Super Collector) with optional price. */
export interface IProductSizeVariant {
  name: string;
  price?: number;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  type?: string; // Product type/variant (e.g., "1 mukhi beads", "1 mukhi savar")
  rulingDeity?: string;
  beejMantra?: string;
  price: number;
  originalPrice?: number;
  startingPrice?: number; // Starting price for enquiry-based products
  images: string[];
  category: string;
  rudrakshaCategory?: mongoose.Types.ObjectId; // Reference to RudrakshaCategory
  gemCategory?: mongoose.Types.ObjectId; // Reference to GemCategory
  productType?: 'BEADS' | 'MALA'; // Product type for filtering
  /** Size variants (e.g. Regular, Medium, Collector, Super Collector) with price per size. */
  sizes?: IProductSizeVariant[];
  stock: number;
  availability: ProductAvailability; // Product availability status
  sku: string;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    rulingDeity: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    beejMantra: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    startingPrice: {
      type: Number,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      required: true,
      trim: true,
    },
    rudrakshaCategory: {
      type: Schema.Types.ObjectId,
      ref: 'RudrakshaCategory',
    },
    gemCategory: {
      type: Schema.Types.ObjectId,
      ref: 'GemCategory',
    },
    productType: {
      type: String,
      enum: ['BEADS', 'MALA'],
      trim: true,
    },
    sizes: [
      {
        name: { type: String, required: true, trim: true },
        price: { type: Number, min: 0 },
      },
    ],
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    availability: {
      type: String,
      enum: Object.values(ProductAvailability),
      default: ProductAvailability.IN_STOCK,
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ rudrakshaCategory: 1 });
productSchema.index({ gemCategory: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ isActive: 1 });

export const ProductModel = mongoose.model<IProduct>('Product', productSchema);











