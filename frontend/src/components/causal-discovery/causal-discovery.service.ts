import {SessionService} from '../session/session.service';
import {ApiService} from '../api.service';
import {CDResponse} from 'common/response/graph/graph.response';
import {IDeleteCausalDiscovery, IStartCausalDiscovery} from 'common/dto/graph.generatecd';
import {ICheckCausalDiscovery} from 'common/dto/graph.generatecd';
import { SuccessResponse } from 'common/response/basic.response';
import { GlobalState } from '../global.state';
export class GraphService {
  
    public async genereateGraph(cd_algorithm: string, recovery_algorithm: string, delimiter?: string, dataType?: string, useGraph?: boolean){
        const headers = {session: await SessionService.ensureSession()};
        const requestBody: IStartCausalDiscovery = {delimiter, cd_algorithm, recovery_algorithm, dataType, useGraph};
        console.log(requestBody);
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
      var requestBody: ICheckCausalDiscovery;
      var identifier: String = GlobalState.identifier;
      if(identifier == null){
        requestBody = {cd_algorithm, recovery_algorithm};
      } else {
        requestBody = {cd_algorithm, recovery_algorithm, identifier};
      }  
      try{
        const result = await ApiService.post<CDResponse>(
          '/CausalDiscovery/check',
          JSON.stringify(requestBody),
          undefined,{"Content-Type": "application/json",session: await SessionService.ensureSession()},);
        return result as SuccessResponse & CDResponse;   
      } catch (e) {
        throw e;
      }



    }
    
  //Use Post, beacouse send data in body
    public async deleteResult(cd_algorithm: String, recovery_algorithm: String): Promise<void>{
      var requestBody: IDeleteCausalDiscovery;
      var identifier: String = GlobalState.identifier;
      requestBody = {cd_algorithm, recovery_algorithm, identifier};
      console.log(requestBody);
      await ApiService.post<SuccessResponse>(
        '/CausalDiscovery/delete',
        JSON.stringify(requestBody),
        undefined,
        {
          "Content-Type": "application/json",
           session: await SessionService.ensureSession()
         },);
    }
 }
