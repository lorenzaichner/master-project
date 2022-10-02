import {Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, UploadedFile, UseInterceptors} from '@nestjs/common';
import {GraphGenerationResponse} from 'common/response/graph/graph.response';
import {Session} from 'src/decorators/session.decorator';
import { CausalDiscoveryService } from './causaldiscovery.service';

@Controller('/CausalDiscovery')
export class CausalDiscoveryController{
    constructor(private readonly causalDiscoverySercive: CausalDiscoveryService){}

    @Get('/generate/:algorithm')
    public async generateGraph(
        @Param('algorithm') algorithm: string,
        @Session() session: string
        ){
            console.log(algorithm);
            return{
                data: this.causalDiscoverySercive.generateGraph(session, algorithm)
            }
        }
    }


