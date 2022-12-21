import {Injectable} from '@nestjs/common';
import {spawn} from 'child_process';
import {RedisService} from 'src/redis/redis.service';
import {Logger} from 'src/log/logger';
import * as config from 'config';
import {UploadService} from 'src/upload/upload.service'
import {GeneratedGraph, Graph} from 'common/response/graph/graph.response';
import { GraphUploadDto } from 'src/upload/upload.dto';
import { MinioClientService } from 'src/minio-client/minio-client.service';

const RESULTS_REDIS_EXPIRE = config.get<number>('Results.RedisExpireSeconds');
const loggerInstance = Logger.getInstance();


@Injectable()
export class CausalDiscoveryService {
    constructor(private uploadService: UploadService, private readonly redisService: RedisService, private minioClientService: MinioClientService) {
    }

    public async generateGraph(session: string, cd_algorithm:string, skeletton_recovery, delimiter:string)
    {   
      
        const dataFilePath = this.uploadService.getDataFilePath(session)
        const cwd = process.cwd();
        const pythonProcess = spawn('/usr/bin/python3', [`${cwd}/../cdt/causal_discovery.py`, skeletton_recovery, cd_algorithm, dataFilePath, delimiter])      

        pythonProcess.stdout.on('data', async (data) =>{
            //console.log(new TextDecoder().decode(data))
            const result = await this.parseGraph(data.toString(), session)
            console.log(result);
            if (result === false || result == null){
                return;
            }

            this.redisService.set(`causald_discovery_results_` + skeletton_recovery+`_`+cd_algorithm +`_:${session}`, result, RESULTS_REDIS_EXPIRE).catch(ex => {
                loggerInstance.log('error', `storing the graph in redis failed with ${ex}`);
            });            
        }) 

        pythonProcess.stderr.on('error', (data) => {
            loggerInstance.log('error', 'Error executing script with ${data}')
            
            this.redisService.set(`causald_discovery_error:${session}`, JSON.stringify(data), RESULTS_REDIS_EXPIRE).catch(ex => {
                loggerInstance.log('error', `storing the error in redis failed with ${ex}`);
            });
        })

        pythonProcess.on('exit', code => {
            if (code === 0) {
                loggerInstance.log('info', `Graph successfully generated for '${dataFilePath}'`);

            } else {
                loggerInstance.log('error', `Graph generation failed for '${dataFilePath}' (exited with ${code})`);
            }
        });
        
    }

    private async parseGraph(data: string, session: string): Promise<Buffer|false>{
        if(!data.includes("__RESULT__\n"))
        {
            return false;
        }
        
        return Buffer.from(data, "utf-8");
    }

    public async getGraph(session:String, cd_algorithm:String, skeletton_recovery:String, identifier?: string):Promise<GeneratedGraph|false>{
        const results = await this.redisService.get(`causald_discovery_results_` + skeletton_recovery+`_`+cd_algorithm +`_:${session}`); //TODO save in store function also cd algo + skeleton recovery algo
        if (results == null) {
            return false;
        }
        if(results == "Error"){
            //TODO create error responde
        }
        console.log(results);
        var buffer:Graph = await this.parseResponse(results as String);
        var res: GeneratedGraph = {
            graph: buffer,
            error: false,
            msg: null
        };
        
        if(identifier != null){
            await this.minioClientService.storeCausalDiscoveryResults(identifier, res, cd_algorithm, skeletton_recovery);
        }
        return res;
    }
    
    public async parseResponse(result: String):Promise<Graph>{
        
        var temp:String = result.split('\'')[1]
        var algorithm_used: String[] = temp.split('_');
        
        const recovery:String = algorithm_used[0];
        const discovery:String = algorithm_used[1];
        
        var edges = result.split('__RESULT__\n');
        edges = edges[1].split('\n');
        
        var buffer: Array<[string, string]> = []
        for(var i:number = 0; i<edges.length; i++) {
            if(edges[i] == ""){
              continue;
            }
            var source:string = edges[i].split("->->->")[0];
            var target:string = edges[i].split("->->->")[1];
            buffer.push([source, target]);

          }

        const graph:Graph = {
            recovery: recovery,
            discovery: discovery,
            edges: buffer
        }

        return graph;

    }
}
