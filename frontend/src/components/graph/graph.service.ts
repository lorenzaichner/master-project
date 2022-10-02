import {SessionService} from '../session/session.service';
import {ApiService} from '../api.service';
import {GraphGenerationResponse} from 'common/response/graph/graph.response';
import {FileUploadedResponse} from 'common/response/upload/upload.response';
import {
  IFileUploadQueryDto,
  IGenerateLinearDatasetDto, IGenerateXYDatasetDto,
  IGraphUploadDto,
  IUrlFileUploadDto
} from 'common/dto/file.upload';
import {StringifiableRecord} from 'query-string';

export class GraphService {
    public async genereateGraph(algorithm: string){
        const headers = {session: await SessionService.ensureSession()};
        const formData = new FormData();
        formData.append('algorithm', algorithm);
        const result = await ApiService.get<GraphGenerationResponse>(
        '/CausalDiscovery/generate/' + algorithm,
        headers,
        );
        
        result.data;
        
       return
    }
}