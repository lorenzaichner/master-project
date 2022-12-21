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
            this.causalDiscoverySercive.generateGraph(session, body.cd_algorithm, body.recovery_algorithm, body.delimiter);
            return {success: true};
        }


    @Get('check/:cd_algorithm/:recovery_algorithm/:identifier')
    public async checkForGraph( 
        @Param("cd_algorithm") cd_algorithm: String,
        @Param("recovery_algorithm") recovery_algorithm: String,
        @Param("identifier") identifier:string,
        @Session("") session: string):Promise<CDResponse> {   
        const res = await this.causalDiscoverySercive.getGraph(session, cd_algorithm, recovery_algorithm, identifier);

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
}
