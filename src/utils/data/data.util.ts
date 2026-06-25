import { serializeError } from 'serialize-error';

const stringifyError = (error: unknown) => {
  return JSON.stringify(serializeError(error));
};

export const data = () => ({
  stringifyError,
});
