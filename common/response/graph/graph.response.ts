import { SuccessResponse } from '../basic.response';

export type GraphGenerationResponse = SuccessResponse
& {
  data: {
    rowCount: number,
    features: string[]
    head: string[][]
    identifier?: string,
  }
};

