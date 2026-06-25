import { z } from 'zod';

export const empty = () => z.object({
  message: z.string(),
});
