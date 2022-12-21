import { type } from 'os';
import { SuccessResponse } from '../basic.response';

export type GeneratedGraph = {
    graph: Graph,
    error: Boolean,
    msg: String | null
  };
  
export type Graph = {
    recovery: String,
    discovery: String,
    edges: Array<[string, string]>
  }
export type CDResponse = SuccessResponse & (GeneratedGraph | { available: false });

