import { Readable } from 'node:stream';

import {
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@self/consts';
import { BadRequestException } from '@self/exceptions';

type Folder = 'user-pictures' | 'workspace-pictures';
type Extension = 'png';
type UUID = string;

export type Path = `${Folder}/${UUID}.${Extension}`;

const signedUrlExpiresIn = 60 * 60 * 24 * 7;

class FlyTigrisSource {
  public client: S3Client;

  private readonly bucket = env.BUCKET_NAME;

  constructor() {
    this.client = new S3Client();
  }

  public async upload(buffer: Buffer, path: Path, acl?: 'public-read') {
    const fileStream = Readable.from(buffer);

    try {
      const upload = new Upload({
        client: this.client,
        params: {
          ACL: acl,
          Body: fileStream,
          Bucket: this.bucket,
          ContentType: 'image/png',
          Key: path,
        },
      });

      return upload.done();
    } catch (error) {
      fileStream.destroy();
      throw error;
    }
  }

  public async delete(path: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.client.send(command);
  }

  public async getSignedUrl(path: string) {
    if(path.startsWith('https://')) {
      throw new BadRequestException({
        feedback: {
          enUs: 'Path must not be a URL.',
          esEs: 'La ruta no debe ser una URL.',
          ptBr: 'O caminho não deve ser uma URL.',
        },
        message: 'Path must not be a URL.',
      });
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: signedUrlExpiresIn,
    });
  }
}

const source = new FlyTigrisSource();

export { source as FlyTigrisSource };
