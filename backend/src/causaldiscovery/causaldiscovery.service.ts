import {Injectable} from '@nestjs/common';
import {spawn} from 'child_process';
import {RedisService} from 'src/redis/redis.service';
import {Logger} from 'src/log/logger';
import * as config from 'config';
import {UploadService} from 'src/upload/upload.service'
import {GeneratedGraph} from 'common/response/graph/graph.response';

const RESULTS_REDIS_EXPIRE = config.get<number>('Results.RedisExpireSeconds');
const loggerInstance = Logger.getInstance();

@Injectable()
export class CausalDiscoveryService {
    constructor(private uploadService: UploadService, private readonly redisService: RedisService) {
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

    public async getGraph(session:String, cd_algorithm:String, skeletton_recovery:String):Promise<GeneratedGraph|false>{
        const results = await this.redisService.get(`causald_discovery_results_` + skeletton_recovery+`_`+cd_algorithm +`_:${session}`); //TODO save in store function also cd algo + skeleton recovery algo
        if (results == null) {
            return false;
        }
        console.log(results);
        var res: GeneratedGraph = {
            graph: results as Buffer,
            error: false,
            msg: null
        };
        
        return res;
    }
}
