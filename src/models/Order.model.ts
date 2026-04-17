import mongoose, { Schema, Document } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  PACKING = 'packing',
  SHIPPING = 'shipping',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum OrderSessionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

export enum OrderType {
  PRODUCT = 'product',
  HEALING = 'healing',
  PUJA = 'puja',
  HEALING_PACKAGE = 'healing_package',
  PUJA_PACKAGE = 'puja_package',
  JYOTISH_SERVICE = 'jyotish_service',
}

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  serviceProvider?: mongoose.Types.ObjectId; // For jyotish_service orders - the expert who receives payment
  orderType: OrderType;
  items: Array<{
    itemId: mongoose.Types.ObjectId;
    itemType: string; // 'product', 'healing_listing', 'puja_listing', 'jyotish_expert', etc.
    serviceType?: string; // For jyotish_service: 'chat' or 'call'
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  totalAmount: number;
  status: OrderStatus;
  payment?: mongoose.Types.ObjectId;
  shippingAddress?: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  notes?: string;
  fulfillmentLocation?: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    source?: 'gps' | 'manual' | 'search';
    capturedAt?: Date;
  };
  sessionProgress?: Array<{
    sessionNumber: number;
    status: OrderSessionStatus;
    listingId?: mongoose.Types.ObjectId;
    completedAt?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceProvider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    orderType: {
      type: String,
      enum: Object.values(OrderType),
      required: true,
    },
    items: [
      {
        itemId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        itemType: {
          type: String,
          required: true,
        },
        serviceType: {
          type: String, // 'chat' or 'call' for jyotish_service
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
    },
    notes: {
      type: String,
    },
    fulfillmentLocation: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      formattedAddress: {
        type: String,
      },
      source: {
        type: String,
        enum: ['gps', 'manual', 'search'],
      },
      capturedAt: {
        type: Date,
      },
    },
    sessionProgress: [
      {
        sessionNumber: {
          type: Number,
          required: true,
          min: 1,
        },
        status: {
          type: String,
          enum: Object.values(OrderSessionStatus),
          default: OrderSessionStatus.PENDING,
        },
        listingId: {
          type: Schema.Types.ObjectId,
          ref: 'HealingListing',
        },
        completedAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ user: 1 });
orderSchema.index({ serviceProvider: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, status: 1, createdAt: -1 });
orderSchema.index({ serviceProvider: 1, status: 1, createdAt: -1 });
orderSchema.index({ orderType: 1, status: 1 });

export const OrderModel = mongoose.model<IOrder>('Order', orderSchema);












