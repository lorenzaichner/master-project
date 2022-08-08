import {ApiService} from '../api.service';
import {FileUploadedResponse} from 'common/response/upload/upload.response';
import {
  IFileUploadQueryDto,
  IGenerateLinearDatasetDto, IGenerateXYDatasetDto,
  IGraphUploadDto,
  IUrlFileUploadDto
} from 'common/dto/file.upload';
import {StringifiableRecord} from 'query-string';
import {SessionService} from '../session/session.service';

export class UploadService {

  /**
   * \param headerOption:
   *   0 - NO_HEADER
   *   1 - SINGLE_HEADER
   *   2 - DOUBLE_HEADER
   * features specified only if the file contains no header, user specifies the features manually
   */
  public async uploadFile(data: FormData, delimiter: string, headerRowCount: number, store: string, features?: string[]): Promise<FileUploadedResponse['data'] | { errorMessage: string }> {
    const headers = {session: await SessionService.ensureSession()};
    const query: IFileUploadQueryDto = {delimiter, headerRowCount: headerRowCount.toString(), store, features};
    const result = await ApiService.post<FileUploadedResponse>(
      '/upload/data',
      data,
      <StringifiableRecord><any>query,
      headers,
    );
    return result.data;
  }

  public async loadStoredFile(identifier: string){
    const headers = {session: await SessionService.ensureSession()};
    const formData = new FormData();
    formData.append('identifier', identifier);
    const result = await ApiService.get<FileUploadedResponse>(
      '/upload/file/' + identifier,
      headers,
    );
    return result.data;
  }

  public async uploadGraph(query: IGraphUploadDto): Promise<void> {
    await ApiService.post<FileUploadedResponse>(
      '/upload/graph',
      JSON.stringify(query),
      undefined,
      {
        'Content-Type': 'application/json',
        session: await SessionService.ensureSession(),
      },
    );
  }

  public async uploadGraphFile(data: FormData): Promise<void> {
    const headers = {session: await SessionService.ensureSession()};
    await ApiService.post<FileUploadedResponse>(
      '/upload/graph-file',
      data,
      undefined,
      headers,
    );
  }

  public async submitLink(url: string, delimiter: string, headerRowCount: number, features?: string[]): Promise<FileUploadedResponse['data'] | { errorMessage: string }> {
    const headers = {
      'Content-Type': 'application/json',
      session: await SessionService.ensureSession(),
    }
    const requestBody: IUrlFileUploadDto = {url, delimiter, headerRowCount: headerRowCount.toString(), features};
    const result = await ApiService.post<FileUploadedResponse>(
      '/upload/url',
      JSON.stringify(requestBody),
      undefined,
      headers
    )
    return result.data;
  }

  public async getFullFile(delimiter: string, headerRowCount: number, features?: string[]): Promise<FileUploadedResponse['data'] | { errorMessage: string }> {
    const headers = {'Content-Type': 'application/json', session: await SessionService.ensureSession()};
    const requestBody: IFileUploadQueryDto = {delimiter, headerRowCount: headerRowCount.toString(), features};
    const result = await ApiService.post<FileUploadedResponse>(
      '/upload/full-file',
      JSON.stringify(requestBody),
      undefined,
      headers,
    );
    return result.data;
  }

  public async generateLinearDataset(linearDatasetDto: IGenerateLinearDatasetDto) {
    console.log(JSON.stringify(linearDatasetDto))
    const headers = {'Content-Type': 'application/json', session: await SessionService.ensureSession()};
    const result = await ApiService.post<FileUploadedResponse>(
      '/upload/generate/linear',
      JSON.stringify(linearDatasetDto),
      undefined,
      headers,
    );

    return result.data;
  }

  public async generateXYDataset(xyDatasetDto: IGenerateXYDatasetDto) {
    console.log(JSON.stringify(xyDatasetDto))
    const headers = {'Content-Type': 'application/json', session: await SessionService.ensureSession()};
    const result = await ApiService.post<FileUploadedResponse>(
      '/upload/generate/xy',
      JSON.stringify(xyDatasetDto),
      undefined,
      headers,
    );
    return result.data;
  }
}
