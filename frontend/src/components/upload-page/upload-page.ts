import { inject, observable } from 'aurelia-framework';
import { UploadService } from './upload.service'
import $ from 'jquery';
import { UploadPageState } from './upload-page.state';
import { GlobalState } from '../global.state';
import { FileUploadedResponse } from 'common/response/upload/upload.response';
import { GraphState } from '../graph/graph.state';
import { StatusLine } from '../status/status.line';

export interface IUploadPage {
  uploadFiles?: FileList;
  status: string;
  selectedHeaderOptionId: string;
  delimiter: string;
  fileData: FileUploadedResponse['data'];
}

@inject(UploadService, UploadPageState, GlobalState)
export class UploadPage {
  uploadFiles: FileList;
  status = 'idle';
  @observable delimiter = ',';
  rowCount =  0;
  uploadStatus = '';
  statusLine: StatusLine;
  // when the file contains no header and the user need to specify the features
  featuresCSVString!: string | null;

  headerOptions = [
    {
      id: 0,
      description: 'The file contains no header data'
    },
    {
      id: 1,
      description: 'The file contains a single header row'
    },
    {
      id: 2,
      description: 'The file contains two header rows (e.g. one header for names and another one for units)'
    }
  ];

  @observable selectedHeaderOptionId = 1;

  constructor(private uploadService: UploadService, private uploadPageState: UploadPageState) {}

  attached() {
    this.loadFromState('status');

    if(this.uploadPageState.fileData != null) {
      const fileData = this.uploadPageState.fileData;
      if(fileData !== undefined) {
        this.rowCount = fileData.rowCount;
        $("#row-count").html(this.rowCount);
        $("#features").html(fileData.features.map(f => `<li>${f}</li>`));
      }
    }

    this.loadFromState('selectedHeaderOptionId');
    this.delimiter = GlobalState.dataFileDelimiter;
  }

  detached() {
    GlobalState.dataFileDelimiter = this.delimiter;
  }

  private loadFromState(data: keyof IUploadPage): void {
    let stateData = <IUploadPage[keyof IUploadPage]>this.uploadPageState.get(data);
    if(stateData !== undefined) {
      this[<any>data] = stateData;
    }
    if(data === 'status') {
      if(stateData === undefined) {
        stateData = 'idle';
      }
      this.statusLine.setStatus(<string>stateData);
    }
  }

  private selectedHeaderOptionIdChanged(newVal: string, oldVal?: string): void {
    if(oldVal !== undefined) {
      this.uploadPageState.set('selectedHeaderOptionId', newVal);
    }
  }

  private delimiterChanged(newVal: string, oldVal?: string): void {
    if(oldVal !== undefined) {
      this.uploadPageState.set('delimiter', newVal);
    }
  }

  private async uploadFile(): Promise<void> {
    if(this.uploadFiles == null || this.uploadFiles[0] == null) {
      this.setErrorStatus('no file selected. Please select a file to upload.');
      return;
    }
    const file = this.uploadFiles[0];

    const formData = new FormData();
    formData.append('file', file);

    let fileData;
    try {
      let features: string[] | undefined = undefined;
      if(this.selectedHeaderOptionId === 0) {
        // character, comma, character is the shortest possible option of features
        if(this.featuresCSVString == null || this.featuresCSVString.length < 3 || !this.featuresCSVString.includes(',')) {
          this.setErrorStatus('Please input a valid value for the features');
          return;
        }
        features = this.featuresCSVString.split(',');
      }
      fileData = await this.uploadService.uploadFile(formData, this.delimiter, this.selectedHeaderOptionId, features);
      GlobalState.dataFileUploaded = true;
      GraphState.data = null; // reset graph data, otherwise the old graph will be shown if you upload another file
    } catch (ex) {
      this.setErrorStatus(ex.message);
      return;
    }

    // this.fileHeaders = headers.map(header => `<li>${header}</li>`);
    $("#row-count").html(fileData.rowCount);
    const featuresList = [];
    const nodes = [];
    GlobalState.features = [];
    for(const f of fileData.features) {
      featuresList.push(`<li>${f}</li>`);
      GlobalState.features.push(f);
      nodes.push({
        data: { id: f }
      });
    }
    $("#features").html(featuresList);
    this.uploadPageState.fileData = {
      rowCount: fileData.rowCount,
      features: fileData.features.slice(0),
    };
    this.setStatus(`Uploaded '${this.uploadFiles[0].name}'`);
    GraphState.nodes = nodes.slice(0);
    GraphState.layout.rows = Math.sqrt(fileData.features.length);
    GraphState.modelData = {
      treatment: null,
      outcome: null,
      commonCauses: [],
      ivs: [],
    };
  }

  private setStatus(status: string): void {
    this.status = status;
    this.statusLine.setStatus(status);
    this.uploadPageState.set('status', status);
  }

  private setErrorStatus(error: string): void {
    const status = `<b>Error</b>: ${error}`;
    this.status = status;
    this.statusLine.setError(error);
    this.uploadPageState.set('status', status);
  }

}
