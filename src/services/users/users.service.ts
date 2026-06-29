import { MemoizationMemory } from '@self/memories';
import { FlyTigrisSource, FlyTigrisSourcePath } from '@self/sources';
import { RandomizeUtil } from '@self/utils';

class UsersService {
  public async uploadPicture(buffer: Buffer) {
    const path: FlyTigrisSourcePath = `user-pictures/${RandomizeUtil.uuid()}.png`;
    await FlyTigrisSource.upload(buffer, path);

    return path;
  }

  public deletePicture(path: string) {
    return FlyTigrisSource.delete(path);
  }

  public async ensurePictureUrl<T extends { picture: string | null }>(user: T) {
    const mapped = {
      ...user,
      picture: user.picture
        ? await FlyTigrisSource.getSignedUrl(user.picture)
        : null,
    };

    return mapped;
  }

  public async purgeUserMemo(id: string) {
    const result = await MemoizationMemory.purge(`memo:user-in-platform-context:${id}`);
    return result;
  }
}

const service = new UsersService();

export { service as UsersService };
