import { IDeleteCausalDiscovery } from 'common/dto/graph.generatecd';
import { ICheckCausalDiscovery } from 'common/dto/graph.generatecd';
import {Body, Controller, Get, HttpException, HttpStatus, Header, Post, Query, Req, UploadedFile, UseInterceptors, Param} from '@nestjs/common';
import { SuccessResponse } from 'common/response/basic.response';
import {CDResponse} from 'common/response/graph/graph.response';
import {Session} from 'src/decorators/session.decorator';
import { CausalDiscoveryService } from './causaldiscovery.service';
import {IStartCausalDiscovery} from 'common/dto/graph.generatecd';

@Controller('/CausalDiscovery')
export class CausalDiscoveryController{
    constructor(private readonly causalDiscoverySercive: CausalDiscoveryService){}

    @Post('/generate')
    public async generateGraph(
        @Body() body:IStartCausalDiscovery,
        @Session() session: string,
        ):Promise<SuccessResponse>{
            console.log(body);
            console.log(session);
            try{
                this.causalDiscoverySercive.generateGraph(session, body.cd_algorithm, body.recovery_algorithm, body.delimiter);
            }catch(e){
                return {success: false};
            }
            
            return {success: true};
        }


    @Post('/check')
    public async checkForGraph( 
        @Body() body:ICheckCausalDiscovery,
        @Session() session: string):Promise<CDResponse> {   
        const res = await this.causalDiscoverySercive.getGraph(session, body.cd_algorithm, body.recovery_algorithm, body.identifier);

        if(res === false) {
            return {
             success: true,
             available: false   
            }
        }
        return {
            success: true,
            ...res,
        };    
    }

    @Post('/delete')
    public deleteResult( 
        @Body() body:IDeleteCausalDiscovery,
        @Session() session: string):Promise<SuccessResponse>{   
        const res = this.causalDiscoverySercive.getGraph(session, body.cd_algorithm, body.recovery_algorithm, body.identifier);
        return;
        
    }
}
