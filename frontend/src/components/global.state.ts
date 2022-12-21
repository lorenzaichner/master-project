import { FileUploadedResponse } from 'common/response/upload/upload.response';

export class GlobalState {
  public static fileData: FileUploadedResponse['data'] | null = null;
  public static dataFileUploaded = false;
  public static session: string | null;
  public static dataFileDelimiter = ',';
  public static features: string[] =  [];
  public static identifier:String;
}
