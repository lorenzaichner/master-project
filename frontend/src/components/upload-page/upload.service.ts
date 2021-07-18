import { ApiService } from 'components/api.service';
import { FileUploadedResponse } from 'common/response/upload/upload.response';
import { IFileUploadQueryDto, IGraphUploadDto } from 'common/dto/file.upload';
import { StringifiableRecord } from 'query-string';
import { SessionService } from '../session/session.service';

export class UploadService {

  /**
   * \param headerOption:
   *   0 - NO_HEADER
   *   1 - SINGLE_HEADER
   *   2 - DOUBLE_HEADER
   * features specified only if the file contains no header, user specifies the features manually
   */
  public async uploadFile(data: FormData, delimiter: string, headerRowCount: number, features?: string[]): Promise<FileUploadedResponse['data'] | { errorMessage: string }> {
    const headers = { session: await SessionService.ensureSession() };
    const query: IFileUploadQueryDto = { delimiter, headerRowCount: headerRowCount.toString(), features };
    const result = await ApiService.post<FileUploadedResponse>(
      '/upload/data',
      data,
      <StringifiableRecord><any>query,
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
    const headers = { session: await SessionService.ensureSession() };
    await ApiService.post<FileUploadedResponse>(
      '/upload/graph-file',
      data,
      undefined,
      headers,
    );
  }
}
