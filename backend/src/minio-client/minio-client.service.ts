import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { BufferedFile, LoadedFileMetaData } from './file.model';
import * as crypto from 'crypto';
import { dirSync } from 'tmp';
import { runInThisContext } from 'vm';
import { Console } from 'console';
import { GeneratedGraph } from 'common/response/graph/graph.response';


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
  //private readonly bucketName = process.env.MINIO_BUCKET_NAME;

  public getClient() {
    return this.minio.client;
  }

public async uploadGenerated(file: Buffer, headerRowCount?: string ){
  const timestamp = Date.now().toString();
  const identifier = Math.random().toString(36).slice(2);
  
  const metaData = {
    'Delemiter' : ',',
    'HeaderRowCount' : HEADER_ROW_COUNT_GEN_LINEAR,
    'Filetype': "Generated linear Dataset",
    'Filename': "Generated linear Dataset",
  };

  // We need to append the extension at the end otherwise Minio will save it as a generic file
  try{
    return this.store(file as any as BufferedFile, metaData);
  }catch(e){
    console.log("Error: "+e);
  }
}

  public async uploadFile(
    file: BufferedFile,
    delemiter?: string, 
    headerRowCount?: string,
    //bucketName: string = this.bucketName,
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
    
    const metaData = {
      'Filetype': file.mimetype,
      'Filename': file.originalname,
      'Delemiter' : delemiter,
      'HeaderRowCount' : headerRowCount,
    };


    try{
      return this.store(file, metaData); 
    }catch(e){
      console.log("Error: "+e);
    }
   
  }

  private async store(file: BufferedFile, metaData: any, filename:string = "data"):Promise<string>
  {
    try{
      let checkIdentifierExists: Boolean = true;
      let identifier: string;
      
      while(checkIdentifierExists) {
        identifier = Math.random().toString(36).slice(2);
        checkIdentifierExists = await this.getClient().bucketExists(identifier);     
      }
      await this.getClient().makeBucket(identifier, "eu-central-1");
      await this.getClient().putObject(identifier, filename, file.buffer, metaData); 
      return identifier;
    }catch(e){
      throw e;
    }

  }

  public async get(identifier: string, path: string): Promise<LoadedFileMetaData>{
    try{
      var datav2 = await this.getClient().listObjectsV2(identifier);
      var datav1 = await this.getClient().listObjects(identifier);
      var meta  = await this.getClient().statObject(identifier, "data");
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
  
      const object = await this.getClient().getObject(identifier, "data");
      object.on("data", (chunk) => fileStream.write(chunk));
      
      object.on("end", () => console.log("Finished writing"));        
      return metaData;  
    }catch(e){
      console.log("Error loading file");
    }
  }

  public async storeCausalDiscoveryResults(identifier: string, graph:GeneratedGraph, cd_algorithm:String, skeletton_recovery:String):Promise<Boolean>{
    
    var buffer:Buffer = Buffer.from(JSON.stringify(graph), "utf-8");
    
    const timestamp = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(timestamp)
      .digest('hex');

    const metaData = {
      'Filetype': "txt",
      'Filename': skeletton_recovery +"_"+cd_algorithm,
    };


    try{
      await this.getClient().putObject(identifier, skeletton_recovery +"_"+cd_algorithm, buffer, metaData);
    }catch(e){
      console.log("Error: "+e);
    }


    return;
  }
}