import { Graph } from 'common/response/graph/graph.response';
export interface BufferedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: AppMimeType;
  size: number;
  buffer: Buffer | string;
}

export interface StoredFile extends HasFile, StoredFileMetadata {}

export interface HasFile {
  file: Buffer | string;
}

export interface StoredFileMetadata {
  id: string;
  name: string;
  encoding: string;
  mimetype: AppMimeType;
  size: number;
  updatedAt: Date;
  fileSrc?: string;
}

export interface LoadedFileMetaData {
  path: string;
  delemiter: string;
  filename: string;
  filetype: AppMimeType;
  headerRowCount: string;
}



//{"graph":{"recovery":"ARD","discovery":"IGCI","edges":[["A","B"],["C","D"],["G","F"],["I","J"]]},"error":false,"msg":null}
export interface LoadedGraph {
  graph: {  recovery: string,
    discovery: string,
    edges: Array<[string, string]>,
    error: Boolean,
    msg: string}
}

export interface LoadedGraphMetadata {
  recovery: String,
  discovery: String,
  filename: string;
  filetype: AppMimeType;
  headerRowCount: string;
}


export type AppMimeType = 'text/csv';