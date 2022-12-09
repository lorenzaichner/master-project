import { SuccessResponse } from '../basic.response';

export type GeneratedGraph = {
    graph: Buffer,
    error: Boolean,
    msg: String | null
  };
  
export type CDResponse = SuccessResponse & (GeneratedGraph | { available: false });

