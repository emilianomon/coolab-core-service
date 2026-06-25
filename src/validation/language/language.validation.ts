import { z } from 'zod';

export const language = () => z.enum([
  'enUs',
  'esEs',
  'ptBr',
]);
