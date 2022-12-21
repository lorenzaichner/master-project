import {SessionService} from '../session/session.service';
import {ApiService} from '../api.service';
import {CDResponse} from 'common/response/graph/graph.response';
import {IStartCausalDiscovery} from 'common/dto/graph.generatecd';
import {StringifiableRecord} from 'query-string';
import { SuccessResponse } from 'common/response/basic.response';
import { GlobalState } from '../global.state';
export class GraphService {
  
    public async genereateGraph(cd_algorithm: string, recovery_algorithm: string, delimiter?: string){
        const headers = {session: await SessionService.ensureSession()};
        const requestBody: IStartCausalDiscovery = {delimiter, cd_algorithm, recovery_algorithm};
                
        const result = await ApiService.post<SuccessResponse>(
        '/CausalDiscovery/generate',
        JSON.stringify(requestBody),
        undefined,
         {
          "Content-Type": "application/json",
           session: await SessionService.ensureSession()
         },
        );

        return result.success;
    }

    public async checkCausalDiscoveryResults(cd_algorithm: string, recovery_algorithm: string): Promise<CDResponse>{
      const headers = {session: await SessionService.ensureSession()};
      const result = await ApiService.get<CDResponse>(
        '/CausalDiscovery/check/'+cd_algorithm+"/"+recovery_algorithm+"/"+GlobalState.identifier,
        headers);

      return result as SuccessResponse & CDResponse;
    }
}