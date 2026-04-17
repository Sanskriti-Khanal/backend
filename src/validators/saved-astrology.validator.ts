import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id');

export const savedAstrologyCreateSchema = z.object({
  body: z.object({
    kind: z.enum(['kundali', 'milan']),
    title: z.string().max(200).optional(),
    requestPayload: z.record(z.unknown()),
    resultSnapshot: z.record(z.unknown()),
  }),
});

export const savedAstrologyListSchema = z.object({
  query: z.object({
    kind: z.enum(['kundali', 'milan']).optional(),
  }),
});

export const savedAstrologyIdParamSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});
