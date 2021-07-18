import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { Results, GetResultsResponse } from 'common/response/results/results.response';
import { Logger } from 'src/log/logger';
import { IGraphUploadDto } from 'common/dto/file.upload';
import { RedisService } from 'src/redis/redis.service';
import * as config from 'config';

const RESULTS_REDIS_EXPIRE = config.get<number>('Results.RedisExpireSeconds');
const loggerInstance = Logger.getInstance();

@Injectable()
export class ResultsService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * run DoWhy on the given data and return results or an error
   */
  public async startAndProcessResults(session: string, dataFilePath: string, dataFileSeparator: string, graphFilePath: string, options: { variables: string, selectedMethods: string }): Promise<void> {
    // clear previous results
    await this.redisService.del(`results:${session}`);
    loggerInstance.log('info', `starting estimation for ${dataFilePath}`);
    const cwd = process.cwd();
    const proc = spawn('python3', [`${cwd}/../dowhy/process_and_return.py`, dataFilePath, dataFileSeparator, graphFilePath, options.variables, options.selectedMethods, session]);
    proc.stderr.on('data', d => {
      const dstring = d.toString();
      loggerInstance.log('error', `estimation script: ${dstring}`);
    });
    proc.stdout.on('data', d => {
      const dstring = d.toString();
      if(dstring.includes('RESULT_')) {
        const results = dstring.replace('\n', '').split('RESULT_')[1];
        this.redisService.set(`results:${session}`, results, RESULTS_REDIS_EXPIRE).catch(ex => {
          loggerInstance.log('error', `storing the results in redis failed with ${ex}`);
        });
      }
    });
    proc.on('exit', code => {
      if(code === 0) {
        loggerInstance.log('info', `estimation completed successfully for '${dataFilePath}'`);
      } else {
        loggerInstance.log('error', `estimation failed for '${dataFilePath}' (exited with ${code})`);
      }
    });
  }

  /**
   * returns results if they are available, false otherwise
   */
  public async getResults(session: string): Promise<Results | false> {
    const results = await this.redisService.get(`results:${session}`);
    if(results == null) {
      return false;
    }
    return JSON.parse(results as string);
  }
}
