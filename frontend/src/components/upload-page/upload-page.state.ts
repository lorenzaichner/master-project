import { FileUploadedResponse } from "common/response/upload/upload.response";
import { IUploadPage } from "./upload-page";

export class UploadPageState {
  private data: Map<keyof IUploadPage, IUploadPage[keyof IUploadPage]>;
  public showLoadMoreButton: boolean;

  public fileData: FileUploadedResponse['data'] | null;

  constructor() {
    this.data = new Map<keyof IUploadPage, IUploadPage[keyof IUploadPage]>();
  }

  public get(key: keyof IUploadPage): IUploadPage[keyof IUploadPage] | undefined {
    return <IUploadPage[keyof IUploadPage]>this.data.get(key);
  }

  public set(key: keyof IUploadPage, value: IUploadPage[keyof IUploadPage]): void {
   this.data.set(key, value);
  }
}
