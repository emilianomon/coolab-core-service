import { z } from 'zod';

import { language } from '../language';

export const exception = () => z.object({
  code: z.string().optional(),
  cta: z.object({
    type: z.literal('support-contact'),
    url: z.string(),
  }).optional(),
  feedback: z.record(language(), z.string()),
  message: z.string(),
  name: z.string(),
});
