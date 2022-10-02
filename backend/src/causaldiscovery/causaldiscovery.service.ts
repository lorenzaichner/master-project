import {Injectable} from '@nestjs/common';
import {spawn} from 'child_process';
import {Results} from 'common/response/results/results.response';
import {Logger} from 'src/log/logger';
import {RedisService} from 'src/redis/redis.service';
import * as config from 'config';
import {UploadService} from 'src/upload/upload.service'

const RESULTS_REDIS_EXPIRE = config.get<number>('Results.RedisExpireSeconds');
const loggerInstance = Logger.getInstance();

@Injectable()
export class CausalDiscoveryService {
    constructor(private uploadService: UploadService) {
    }

    public async generateGraph(session: string, algorithm:string)
    {
        const dataFilePath = this.uploadService.getDataFilePath(session)
        const cwd = process.cwd();
        const pythonProcess = spawn('/usr/bin/python3', [`${cwd}/../cdt/causal_discovery.py`, algorithm, dataFilePath])
        pythonProcess.stdout.on('data', (data) => {
            console.log(new TextDecoder().decode(data));
        })

        pythonProcess.stderr.on('data', (data) => {
            console.log(new TextDecoder().decode(data));
        })

        pythonProcess.on('exit', code => {
            if (code === 0) {
                loggerInstance.log('info', `Graph successfully generated for '${dataFilePath}'`);
            } else {
                loggerInstance.log('error', `Graph generation failed for '${dataFilePath}' (exited with ${code})`);
            }
        });
    }
}
