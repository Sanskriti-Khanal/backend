import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyForecast extends Document {
  date: Date;
  zodiacSign: string; // Aries, Taurus, etc.
  forecast: {
    general: string;
    love: string;
    career: string;
    health: string;
    finance: string;
  };
  luckyNumber?: number;
  luckyColor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const dailyForecastSchema = new Schema<IDailyForecast>(
  {
    date: {
      type: Date,
      required: true,
    },
    zodiacSign: {
      type: String,
      required: true,
    },
    forecast: {
      general: {
        type: String,
        required: true,
      },
      love: {
        type: String,
        required: true,
      },
      career: {
        type: String,
        required: true,
      },
      health: {
        type: String,
        required: true,
      },
      finance: {
        type: String,
        required: true,
      },
    },
    luckyNumber: {
      type: Number,
      min: 1,
      max: 100,
    },
    luckyColor: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

dailyForecastSchema.index({ date: 1 });
dailyForecastSchema.index({ zodiacSign: 1 });
dailyForecastSchema.index({ date: 1, zodiacSign: 1 }, { unique: true });

export const DailyForecastModel = mongoose.model<IDailyForecast>(
  'DailyForecast',
  dailyForecastSchema
);












