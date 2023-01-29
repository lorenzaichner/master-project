import { type } from 'os';
import { SuccessResponse } from '../basic.response';

export type GeneratedGraph = {
    graph: CDGraph,
    error: Boolean,
    msg: String | null
  };
  
export type CDGraph = {
    recovery: String,
    discovery: String,
    edges: Array<[string, string]>
  }
export type LoadGraphResponse =SuccessResponse & {data:Array<CDGraph>}

export type FileUploadedResponse = SuccessResponse
  & {
    data: {
      rowCount: number,
      features: string[]
      head: string[][]
      identifier?: string,
    }
  };