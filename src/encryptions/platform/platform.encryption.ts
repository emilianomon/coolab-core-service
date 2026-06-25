import { Encryption } from '@self/abstractions';
import { env } from '@self/consts';
import { z } from 'zod';

type AccessTokenContent = {
  email: string;
  id: string;
};

class PlatformEncryption extends Encryption {
  private accessTokenSchema = this.validator().object({
    email: this.validator().email(),
    id: this.validator().id(),
  }) satisfies z.ZodType<AccessTokenContent>;

  constructor() {
    super(env.AUTH_ENCRYPTION_PRIVATE_KEY);
  }

  public encryptAccessToken(content: AccessTokenContent) {
    return this.encrypt(content);
  }

  public decryptAccessToken(content: string) {
    const decrypted = this.decrypt(content);
    return this.createSchema(this.accessTokenSchema).parse(decrypted);
  }
}

const encryption = new PlatformEncryption();

export { encryption as PlatformEncryption };
