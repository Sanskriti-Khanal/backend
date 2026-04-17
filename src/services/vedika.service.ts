import axios from 'axios';
import env from '@config/env';
import { AppError } from '@errors/AppError';

const VEDIKA_URL = 'https://api.vedika.io/api/v1/astrology/query';

export interface VedikaBirthDetails {
  datetime: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/**
 * Forwards an astrology question to Vedika. Prepends an English-only instruction.
 */
export async function queryVedika(
  question: string,
  birthDetails: VedikaBirthDetails
): Promise<unknown> {
  if (!env.VEDIKA_API_KEY?.trim()) {
    throw new AppError('Vedika API is not configured', 503);
  }

  const fullQuestion = `${question.trim()}\n\nPlease answer in English only.`;

  try {
    const { data, status } = await axios.post(
      VEDIKA_URL,
      { question: fullQuestion, birthDetails },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.VEDIKA_API_KEY.trim(),
        },
        timeout: 120_000,
        validateStatus: () => true,
      }
    );

    if (status >= 200 && status < 300) {
      return data;
    }

    const msg =
      (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : null) ?? `Vedika request failed (${status})`;

    throw new AppError(msg, status >= 400 && status < 500 ? status : 502);
  } catch (e) {
    if (e instanceof AppError) throw e;
    if (axios.isAxiosError(e)) {
      const status = e.response?.status ?? 502;
      const body = e.response?.data;
      const msg =
        body &&
        typeof body === 'object' &&
        'message' in body &&
        typeof (body as { message: unknown }).message === 'string'
          ? (body as { message: string }).message
          : e.message;
      throw new AppError(msg, status >= 400 && status < 500 ? status : 502);
    }
    throw new AppError('Vedika request failed', 502);
  }
}
