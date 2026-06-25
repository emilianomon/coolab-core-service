import crypto from 'node:crypto';

const uuid = () => crypto.randomUUID();

export const randomize = () => ({
  uuid,
});
