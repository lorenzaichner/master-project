import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { BufferedFile } from './file.model';
import * as crypto from 'crypto';

@Injectable()
export class MinioClientService {
  constructor(private readonly minio: MinioService) {
    this.logger = new Logger('MinioService');
  }

  private readonly logger: Logger;
  private readonly bucketName = process.env.MINIO_BUCKET_NAME;

  public get client() {
    return this.minio.client;
  }

  public async upload(
    file: BufferedFile,
    delemiter: string, 
    bucketName: string = this.bucketName,
  ) {
    if (!(file.mimetype.includes('csv'))) {
      throw new HttpException(
        'File type not supported',
        HttpStatus.BAD_REQUEST,
      );
    }
    const timestamp = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(timestamp)
      .digest('hex');
    const extension = file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length,
    );
    const identifier = Math.random().toString(36).slice(2);
    const metaData = {
      'Content-Type': file.mimetype,
      'Filename': file.fieldname,
      'Delemiter' : delemiter,
    };

    // We need to append the extension at the end otherwise Minio will save it as a generic file
    const fileName = identifier;

    this.client.putObject(
      bucketName,
      fileName,
      file.buffer,
      metaData,
      /*function (err, res) {
        if (err) {
          throw new HttpException(
            'Error uploading file',
            HttpStatus.BAD_REQUEST,
          );
        }
      },
      */
    );

    return identifier; 
  }

  async get(identifier: string, bucketName: string = this.bucketName) {
    const data = this.client.getObject(bucketName, identifier);
  }

  async delete(objetName: string, bucketName: string = this.bucketName) {
  }
}