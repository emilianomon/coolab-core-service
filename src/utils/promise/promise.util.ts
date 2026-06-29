class PromiseUtil {
  public static async sleep(timeoutMs: number) {
    await new Promise(resolve => setTimeout(resolve, timeoutMs));
  }
}

export { PromiseUtil };
