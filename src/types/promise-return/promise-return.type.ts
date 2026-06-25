export type PromiseReturn<T extends (...args: Array<never>) => Promise<unknown>> =
  Awaited<ReturnType<T>>;
