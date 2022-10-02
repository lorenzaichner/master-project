import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { BufferedFile, LoadedFileMetaData } from './file.model';
import * as crypto from 'crypto';
import { dirSync } from 'tmp';


const FILE_DIR = "/home/lorenz/Documents/Bachelor/master-project/"; //config.get<string>('Upload.StorageDir');
//const FILE_DIR = config.get<string>('Upload.StorageDir');
// both at the same dir, at least for now

const HEADER_ROW_COUNT_GEN_LINEAR = 1;

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

public async uploadGenerated(file: Buffer, headerRowCount?: string ,bucketName: string = this.bucketName){
  const timestamp = Date.now().toString();
  const identifier = Math.random().toString(36).slice(2);
  
  const metaData = {
    'Delemiter' : ',',
    'HeaderRowCount' : HEADER_ROW_COUNT_GEN_LINEAR,
    'Filetype': "Generated linear Dataset",
    'Filename': "Generated linear Dataset",
  };

  // We need to append the extension at the end otherwise Minio will save it as a generic file
  const fileName = identifier;

  this.client.putObject(
    bucketName,
    fileName,
    file,    
    metaData
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

  public async uploadFile(
    file: BufferedFile,
    delemiter?: string, 
    headerRowCount?: string,
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
      'Filetype': file.mimetype,
      'Filename': file.originalname,
      'Delemiter' : delemiter,
      'HeaderRowCount' : headerRowCount,
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

  async get(identifier: string, path: string, bucketName: string = this.bucketName): Promise<LoadedFileMetaData>{
    
    var meta  = await this.client.statObject(bucketName, identifier);
    const metaData: LoadedFileMetaData = {
      delemiter: meta.metaData.delemiter,
      filename: meta.metaData.filename,
      filetype: meta.metaData.filetype,
      path: path,
      headerRowCount: meta.metaData.headerrowcount,
    };
      
    const fs = require("fs");
    
    // read object in chunks and store it as a file
    const fileStream = fs.createWriteStream(metaData.path);

    const object = await this.client.getObject(bucketName, identifier);
    object.on("data", (chunk) => fileStream.write(chunk));
    
    object.on("end", () => console.log("Finished writing"));        
    return metaData;
    

  }

  async delete(objetName: string, bucketName: string = this.bucketName) {
  }
}