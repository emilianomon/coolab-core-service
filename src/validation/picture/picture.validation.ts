import { z } from 'zod';

export const picture = () => z.any()
  .refine(value => {
    return value instanceof File;
  }, 'Picture must be a file.')
  .refine(value => {
    return value instanceof File && value.size > 0;
  }, 'Picture file must not be empty.')
  .refine(value => {
    return value instanceof File && value.type === 'image/png';
  }, 'Picture file must be a PNG image.')
  .transform(async value => {
    return Buffer.from(await (value as File).arrayBuffer());
  })
  .openapi({
    format: 'binary',
    type: 'string',
  });
