import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { BufferedFile, LoadedFileMetaData, LoadedGraph, LoadedGraphMetadata } from './file.model';
import * as crypto from 'crypto';
import { GeneratedGraph } from 'common/response/graph/graph.response';
import { CDGraph} from 'common/response/minio/miniograph.response';
import * as Minio from 'minio'


const HEADER_ROW_COUNT_GEN_LINEAR = 1;

@Injectable()
export class MinioClientService {
  private minioClient: Minio.Client
  constructor(private readonly configService: ConfigService) {
    this.logger = new Logger('MinioService');
    try{
      this.minioClient = new Minio.Client({
        endPoint: this.configService.get('MINIO_ENDPOINT'),
        port: Number(this.configService.get('MINIO_PORT')),
        useSSL: this.configService.get('MINIO_USE_SSL') === 'true',
        accessKey: this.configService.get('MINIO_ACCESS_KEY'),
        secretKey: this.configService.get('MINIO_SECRET_KEY')
      })
      this.logger.log("info", "Succesful connected to minio.");
    } catch (e) {
      this.logger.error('error', `Connecting to Minio: ` + e);
    }

  }

  private readonly logger: Logger;

public async uploadGenerated(file: Buffer, headerRowCount?: string ){
  const timestamp = Date.now().toString();
  
  const metaData = {
    'Delemiter' : ',',
    'HeaderRowCount' : HEADER_ROW_COUNT_GEN_LINEAR,
    'Filetype': "Generated linear Dataset",
    'Filename': "data",
  };


  var buffered:BufferedFile = {
    fieldname: '',
    originalname: 'data',
    encoding: 'utf8',
    mimetype: 'text/csv',
    size: file.length,
    buffer: file
  }

  // We need to append the extension at the end otherwise Minio will save it as a generic file
  try{
    return this.store(buffered, metaData);
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
    this.logger.log('info', `Start Upload To Minio'`);
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
      this.logger.log('Error', `Error uploading to Minio'`);
    }
   
  }

  private async store(file: BufferedFile, metaData: any, filename:string = "data"):Promise<string>
  {
    try{
      let checkIdentifierExists: Boolean = true;
      let identifier: string;
      while(checkIdentifierExists) {
        identifier = Math.random().toString(36).slice(2);
        try{
          checkIdentifierExists = await this.minioClient.bucketExists(identifier); 
        }catch (e) {
          this.logger.log('Error', "Error checking identifier:"+ e);
          throw e;
        }
      }
      
      await this.minioClient.makeBucket(identifier, "eu-central-1");
      await this.minioClient.putObject(identifier, filename, file.buffer, metaData); 
      return identifier;
    }catch(e){
      this.logger.log('Error', `Error Occured while storing file:` + e);
      throw e;
      }
  }

  public async getData(identifier: string, path: string): Promise<LoadedFileMetaData>{
    return new Promise(async(resolve, reject) => {
      try{
        var meta  = await this.minioClient.statObject(identifier, "data");
        this.logger.log("Get Object with metadata: " + meta.metaData);
        const metaData: LoadedFileMetaData = {
          delemiter: meta.metaData.delemiter,
          filename: meta.metaData.filename,
          filetype: meta.metaData.filetype,
          path: path,
          headerRowCount: meta.metaData.headerrowcount,
        };
        const fs = require("fs");
        const fileStream = fs.createWriteStream(metaData.path);
        const object = await this.minioClient.getObject(identifier, "data");
        object.on("data", (chunk) => fileStream.write(chunk));
        object.on("end", () =>{
          this.logger.log("Finished downloading Data.");
          resolve(metaData);
        });   
        object.on("error", (err) => {
          this.logger.log("Error downloading Data.");
          reject(err);
        });      
        return metaData;  
      }catch(e){
        this.logger.log("Error downloading Data.")
        throw e;
      }
  })
  }

  public async getGraphs(identifier: string): Promise<Array<CDGraph>> {
    const graphs:Array<CDGraph> = new Array<CDGraph>;
    const listObject:any = await this.getListObjects(identifier);   
    for(var i in listObject) {
      if(listObject[i].name == "data") continue;
      graphs.push(await this.prepareGraph(identifier, listObject[i].name));
    }
    return graphs;
  }

  private async getListObjects(identifier: string){
    return new Promise( (resolve, reject) => {
      var data = [];
      var stream = this.minioClient.listObjects(identifier,'', true);
      stream.on('data', function(obj) {data.push(obj)})
      stream.on("end", function () {resolve(data)})
      stream.on('error', function(err) {
        this.logger.log("Finished downloading Data.");
        throw err})  
    })
  }

  private async prepareGraph(identifier: string, name: string): Promise<CDGraph>{
    return new Promise(async(resolve, reject) => {
        var meta  = await this.minioClient.statObject(identifier, name);
        const object = await this.minioClient.getObject(identifier, name);
        let buffer:string = "";

        object.on("data", (chunk:string) => {
          buffer = buffer +  chunk;
        });
        object.on("end", () =>{    
          var json:LoadedGraph = JSON.parse(buffer);     
          
          this.logger.log("info", json);  
          var graph: CDGraph = {
            recovery: meta.metaData.recovery,
            discovery: meta.metaData.discovery,
            edges: json.graph.edges,
          }
          console.log("Graph added");
          resolve(graph);
          });
        object.on("error", (error) => {
          return reject(error); //TODO
        });
    })
  }
  
  public async storeCausalDiscoveryResults(identifier: String, graph:GeneratedGraph, cd_algorithm:String, skeletton_recovery:String):Promise<Boolean>{
    
    var buffer:Buffer = Buffer.from(JSON.stringify(graph), "utf-8");
    
    const timestamp = Date.now().toString();
    const hashedFileName = crypto
      .createHash('md5')
      .update(timestamp)
      .digest('hex');

    const metaData = {
      'Filetype': "txt",
      'Filename': skeletton_recovery +"_"+cd_algorithm,
      'recovery': skeletton_recovery,
      'discovery': cd_algorithm,
    };


    try{
      await this.minioClient.putObject(identifier as string, skeletton_recovery +"_"+cd_algorithm, buffer, metaData);
    }catch(e){
      console.log("Error: "+e);
    }
    return;
  }

  public deleteResult(cd_algorithm:String, skeletton_recovery:String, identifier: String){
    console.log("Delete: "+ skeletton_recovery +"_"+cd_algorithm)
    this.minioClient.removeObject(identifier as string, skeletton_recovery +"_"+cd_algorithm);
  }
}