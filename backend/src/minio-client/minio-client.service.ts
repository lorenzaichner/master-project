import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MinioService } from 'nestjs-minio-client';
import { BufferedFile, LoadedFileMetaData, LoadedGraph, LoadedGraphMetadata } from './file.model';
import * as crypto from 'crypto';
import { GeneratedGraph } from 'common/response/graph/graph.response';
import { CDGraph} from 'common/response/minio/miniograph.response';


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

  public getClient() {
    return this.minio.client;
  }

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
      console.log(await this.getClient().putObject(identifier, filename, file.buffer, metaData)); 
      return identifier;
    }catch(e){
      throw e;
    }

  }

  public async getData(identifier: string, path: string): Promise<LoadedFileMetaData>{
    try{
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
      var stream = this.getClient().listObjects(identifier,'', true);
      stream.on('data', function(obj) {data.push(obj)})
      stream.on("end", function () {resolve(data)})
      stream.on('error', function(err) {console.log(err)})  
    })
  }

  private async prepareGraph(identifier: string, name: string): Promise<CDGraph>{
    return new Promise(async(resolve, reject) => {
        const object = await this.getClient().getObject(identifier, name);
        object
        let buffer:string = "";

        object.on("data", (chunk:string) => {
          buffer = buffer +  chunk;
        });
        object.on("end", () =>{    
          var json:LoadedGraph = JSON.parse(buffer);       
          var graph: CDGraph = {
            recovery: json.graph.recovery,
            discovery: json.graph.discovery,
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
      await this.getClient().putObject(identifier as string, skeletton_recovery +"_"+cd_algorithm, buffer, metaData);
    }catch(e){
      console.log("Error: "+e);
    }
    return;
  }

  public deleteResult(cd_algorithm:String, skeletton_recovery:String, identifier: String){
    console.log("Delete: "+ skeletton_recovery +"_"+cd_algorithm)
    this.getClient().removeObject(identifier as string, skeletton_recovery +"_"+cd_algorithm);
  }
}