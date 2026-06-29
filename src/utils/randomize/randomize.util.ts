import crypto from 'node:crypto';

class RandomizeUtil {
  public static uuid() {
    return crypto.randomUUID();
  }
}

export { RandomizeUtil };
