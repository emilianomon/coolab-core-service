import { z } from 'zod';

export type InferFromValidation<T extends z.ZodType> = z.infer<T>;
