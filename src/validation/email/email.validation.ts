import { z } from 'zod';

export const email = () => z.email().toLowerCase();
