import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionLogType {
  CREATE_ORDER_REQUEST = 'CREATE_ORDER_REQUEST',
  CREATE_ORDER_RESPONSE = 'CREATE_ORDER_RESPONSE',
  PAYMENT_XML = 'PAYMENT_XML',
  GET_ORDER_STATUS_REQUEST = 'GET_ORDER_STATUS_REQUEST',
  GET_ORDER_STATUS_RESPONSE = 'GET_ORDER_STATUS_RESPONSE',
  ERROR = 'ERROR',
}

export interface ITransactionLog extends Document {
  transactionId: string; // Unique transaction ID
  type: TransactionLogType;
  orderId?: string; // OrderID from bank
  sessionId?: string; // SessionID from bank
  xmlData?: string; // XML request or response
  metadata?: Record<string, any>; // Additional metadata
  errorMessage?: string; // Error message if type is ERROR
  httpCode?: number; // HTTP status code
  curlError?: string; // cURL error if any
  receivedAt: Date; // Timestamp when log was received
  createdAt: Date;
  updatedAt: Date;
}

const transactionLogSchema = new Schema<ITransactionLog>(
  {
    transactionId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionLogType),
      required: true,
      index: true,
    },
    orderId: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    xmlData: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    errorMessage: {
      type: String,
    },
    httpCode: {
      type: Number,
    },
    curlError: {
      type: String,
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

// Compound indexes for efficient queries
transactionLogSchema.index({ transactionId: 1, type: 1 });
transactionLogSchema.index({ orderId: 1, sessionId: 1 });
transactionLogSchema.index({ receivedAt: -1 });

export const TransactionLogModel = mongoose.model<ITransactionLog>(
  'TransactionLog',
  transactionLogSchema
);


