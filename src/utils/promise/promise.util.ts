const sleep = async (timeoutMs: number) => {
  await new Promise(resolve => setTimeout(resolve, timeoutMs));
};

export const promise = () => ({
  sleep,
});
