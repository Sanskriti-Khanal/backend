import mongoose, { Schema, Document } from 'mongoose';

export enum NabilCallbackStatus {
  APPROVED = 'APPROVED',
  CANCELED = 'CANCELED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED',
}

export enum NabilLogType {
  CREATE_ORDER_REQUEST = 'CREATE_ORDER_REQUEST',
  CREATE_ORDER_RESPONSE = 'CREATE_ORDER_RESPONSE',
  PAYMENT_XML = 'PAYMENT_XML',
  GET_ORDER_STATUS_REQUEST = 'GET_ORDER_STATUS_REQUEST',
  GET_ORDER_STATUS_RESPONSE = 'GET_ORDER_STATUS_RESPONSE',
}

export interface INabilCallback extends Document {
  logType: NabilLogType; // Type of log (CREATE_ORDER_REQUEST, CREATE_ORDER_RESPONSE, etc.)
  transactionId?: string; // Transaction ID to link all logs together
  orderId?: string; // OrderID from bank (optional for CREATE_ORDER_REQUEST)
  encryptedOrderId?: string; // OrderIDEncrypted from bank
  sessionId?: string; // SessionId from bank (optional for CREATE_ORDER_REQUEST)
  amount?: number; // PurchaseAmount / TotalAmount (optional for non-payment logs)
  currency?: string; // Currency code (524 for NPR) (optional for non-payment logs)
  currencyISO?: string; // CurrencyISOAlpha (NPR) (optional for non-payment logs)
  status?: NabilCallbackStatus; // OrderStatus (optional for non-payment logs)
  statusDescription?: string; // OrderStatusScr (optional for non-payment logs)
  transactionType?: string; // TransactionType (optional for non-payment logs)
  orderDescription?: string; // OrderDescription (optional for non-payment logs)
  tranDateTime?: string; // TranDateTime (optional for non-payment logs)
  bankName?: string; // BankName (optional for non-payment logs)
  language?: string; // Language (optional for non-payment logs)
  version?: string; // Version (optional for non-payment logs)
  rawXml: string; // Full XML string received
  receivedAt: Date; // Timestamp when callback was received
  createdAt: Date;
  updatedAt: Date;
}

const nabilCallbackSchema = new Schema<INabilCallback>(
  {
    logType: {
      type: String,
      enum: Object.values(NabilLogType),
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      index: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    encryptedOrderId: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    amount: {
      type: Number,
    },
    currency: {
      type: String,
    },
    currencyISO: {
      type: String,
      default: 'NPR',
    },
    status: {
      type: String,
      enum: Object.values(NabilCallbackStatus),
      index: true,
    },
    statusDescription: {
      type: String,
    },
    transactionType: {
      type: String,
      default: 'Purchase',
    },
    orderDescription: {
      type: String,
    },
    tranDateTime: {
      type: String,
    },
    bankName: {
      type: String,
      default: 'PSP NABIL',
    },
    language: {
      type: String,
      default: 'EN',
    },
    version: {
      type: String,
      default: '1.0',
    },
    rawXml: {
      type: String,
      required: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
nabilCallbackSchema.index({ transactionId: 1, logType: 1 });
nabilCallbackSchema.index({ orderId: 1, sessionId: 1 });
nabilCallbackSchema.index({ receivedAt: -1 });
nabilCallbackSchema.index({ logType: 1, receivedAt: -1 });

export const NabilCallbackModel = mongoose.model<INabilCallback>(
  'NabilCallback',
  nabilCallbackSchema
);








