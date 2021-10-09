import { SuccessResponse } from '../basic.response';

export type FileUploadedResponse = SuccessResponse
  & {
    data: {
      rowCount: number,
      features: string[]
      head?: string[][]
    }
  };
