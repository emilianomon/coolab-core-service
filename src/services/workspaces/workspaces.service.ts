import { FlyTigrisSource, FlyTigrisSourcePath } from '@self/sources';
import { RandomizeUtil } from '@self/utils';

const picturePrefix = 'data:image/png;base64,';

class WorkspacesService {
  public async uploadPicture(buffer: Buffer) {
    const path: FlyTigrisSourcePath = `workspace-pictures/${RandomizeUtil.uuid()}.png`;
    await FlyTigrisSource.upload(buffer, path);

    return path;
  }

  public uploadPictureBase64(base64: string) {
    const buffer = Buffer.from(base64.replace(picturePrefix, ''), 'base64');
    return this.uploadPicture(buffer);
  }

  public deletePicture(path: string) {
    return FlyTigrisSource.delete(path);
  }

  public async ensurePictureUrl<T extends { picture: string | null }>(workspace: T) {
    const mapped = {
      ...workspace,
      picture: workspace.picture
        ? await FlyTigrisSource.getSignedUrl(workspace.picture)
        : null,
    };

    return mapped;
  }
}

const service = new WorkspacesService();

export { service as WorkspacesService };
