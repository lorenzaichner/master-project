import {inject, observable} from 'aurelia-framework';
import {UploadService} from './upload.service'
import {UploadPageState} from './upload-page.state';
import {GlobalState} from '../global.state';
import {FileUploadedResponse} from 'common/response/upload/upload.response';
import {GraphState} from '../graph/graph.state';
import {StatusLine} from '../status/status.line';
import {IGenerateLinearDatasetDto, IGenerateXYDatasetDto} from "common/dto/file.upload";

export interface IUploadPage {
  uploadFiles?: FileList;
  status: string;
  selectedHeaderOptionId: string;
  delimiter: string;
  fileData: FileUploadedResponse['data'];
  storeData: string;
  identifier: string,
}

@inject(UploadService, UploadPageState, GlobalState)
export class UploadPage {
  uploadFiles: FileList;
  status = 'idle';
  @observable delimiter = ',';
  @observable store = "false";
  @observable uploadTypeId = 0;
  @observable urlPath = '';
  @observable identifier = '';

  @observable beta = '0';
  @observable samplesNumber = '10000';
  @observable commonCausesNumber = '5';
  @observable discreteCommonCausesNumber = '0';
  @observable discreteEffectModifiersNumber = '0';
  @observable discreteInstrumentsNumber = '0';
  @observable frontdoorVariablesNumber = '0';
  @observable instrumentsNumber = '2';
  @observable treatmentsNumber = '1';
  @observable effectModifiersNumber = '0';
  @observable isOneHotEncoded = false;
  @observable isOutcomeBinary = false;
  @observable isTreatmentBinary = true;

  @observable commonCausesNumberXY = '1';
  @observable isLinearXY = true;
  @observable samplesNumberXY = '10000';
  @observable effectXY = true;
  @observable standardDeviationErrorXY = '1';

  uploadStatus = '';
  statusLine: StatusLine;
  // when the file contains no header and the user need to specify the features
  featuresCSVString!: string | null;
  uploadOptions = [{
    id: 0,
    name: 'File upload'
  },
  {
    id: 1,
    name: 'Download from a link'
  },
  {
    id: 2,
    name: 'Generate linear dataset'
  },
  {
    id: 3,
    name: 'Generate XY dataset'
  },
  {
    id: 4,
    name: 'Load stored dataset'
  }
  ]

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

  @observable fileData = undefined;

  @observable showLoadMoreButton = false;

  constructor(private uploadService: UploadService, private uploadPageState: UploadPageState) {
  }

  attached() {
    this.loadFromState('status');

    if (this.uploadPageState.fileData != null) {
      const fileData = this.uploadPageState.fileData;
      this.showLoadMoreButton = this.uploadPageState.showLoadMoreButton;
      if (fileData !== undefined) {
        this.fileData = fileData;
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
    if (stateData !== undefined) {
      this[<any>data] = stateData;
    }
    if (data === 'status') {
      if (stateData === undefined) {
        stateData = 'idle';
      }
      this.statusLine.setStatus(<string>stateData);
    }
  }

  private async identifierChanged(): Promise<void>{
    this.uploadPageState.set('identifier', this.identifier);
  }

  private selectedHeaderOptionIdChanged(newVal: string, oldVal?: string): void {
    if (oldVal !== undefined) {
      this.uploadPageState.set('selectedHeaderOptionId', newVal);
    }
  }

  private delimiterChanged(newVal: string, oldVal?: string): void {
    if (oldVal !== undefined) {
      this.uploadPageState.set('delimiter', newVal);
    }
  }

  private async storeChanged(): Promise<void>{
    if(this.uploadPageState.get('storeData'))
    {
      this.uploadPageState.set('storeData', "true")
    } else {
      this.uploadPageState.set('storeData', "false")
    }    
  }

  private async startOperation(): Promise<void> {
    if (this.uploadTypeId === 0) {
      await this.uploadFile();
    } else if (this.uploadTypeId === 1) {
      await this.getTheFileFromUrl();
    } else if (this.uploadTypeId === 2) {
      await this.generateLinearDataset();
    } else if (this.uploadTypeId === 3) {
      await this.generateXYDataset();
    } else if (this.uploadTypeId === 4){
      await this.loadStoredFile();
    }
    else {
      this.setErrorStatus('The selected upload type is not supported.');
    }
  }

  private async loadStoredFile(): Promise<void> {  //check promise, because we get in return the number to regain data
    if (this.identifier == null || this.identifier[0] == null) {
      this.setErrorStatus('No identifier selected');
      return;
    }
    
    const identifier = this.identifier;

    let fileData;
    try {
      let features = undefined;
      if (this.selectedHeaderOptionId === 0) {
        features = this.extractFeatures();
        if (features === undefined) {
          this.setErrorStatus('Please input a valid value for the features');
          return;
        }
      }
      fileData = await this.uploadService.loadStoredFile(this.identifier); 
      GlobalState.dataFileUploaded = true;
      GraphState.data = null; // reset graph data, otherwise the old graph will be shown if you upload another file
    } catch (ex) {
      this.setErrorStatus(ex.message);
      return;
    }
    this.fileData = undefined;
    this.updatePageData(fileData, `Loaded '${fileData.identifier}'`, true);
  }


  private async getTheFileFromUrl(): Promise<void> {
    if (this.urlPath === '') {
      this.setErrorStatus('Please submit url.');
      return;
    }
    let fileData;
    try {
      let features = undefined;
      if (this.selectedHeaderOptionId === 0) {
        features = this.extractFeatures();
        if (features === undefined) {
          this.setErrorStatus('Please input a valid value for the features');
          return;
        }
      }
      fileData = await this.uploadService.submitLink(this.urlPath, this.delimiter, this.selectedHeaderOptionId, features);
      GlobalState.dataFileUploaded = true;
      GraphState.data = null; // reset graph data, otherwise the old graph will be shown if you upload another file
    } catch (ex) {
      this.setErrorStatus(ex.message);
      return;
    }
    this.updatePageData(fileData, `Uploaded from: '${this.urlPath}'`, true);
  }

  private async uploadFile(): Promise<void> {  //check promise, because we get in return the number to regain data
    if (this.uploadFiles == null || this.uploadFiles[0] == null) {
      this.setErrorStatus('no file selected. Please select a file to upload.');
      return;
    }
    const file = this.uploadFiles[0];

    const formData = new FormData();
    formData.append('file', file);

    let fileData;
    try {
      let features = undefined;
      if (this.selectedHeaderOptionId === 0) {
        features = this.extractFeatures();
        if (features === undefined) {
          this.setErrorStatus('Please input a valid value for the features');
          return;
        }
      }
      fileData = await this.uploadService.uploadFile(formData, this.delimiter, this.selectedHeaderOptionId, this.store, features); 
      GlobalState.dataFileUploaded = true;
      GraphState.data = null; // reset graph data, otherwise the old graph will be shown if you upload another file
    } catch (ex) {
      this.setErrorStatus(ex.message);
      return;
    }
    this.fileData = undefined;
    this.updatePageData(fileData, `Uploaded '${this.uploadFiles[0].name}'`, true);
  }

  private extractFeatures() {
    let features: string[] | undefined = undefined;
    // character, comma, character is the shortest possible option of features
    if (this.featuresCSVString == null || this.featuresCSVString.length < 3 || !this.featuresCSVString.includes(',')) {
      return features;
    }
    features = this.featuresCSVString.split(',');
    return features;
  }

  /**
   * Method which updates fileData attribute and global state objects
   * Mutating state
   * @param fileData
   * @param statusMessage
   * @param showLoadMoreButton
   * @private
   */
  private updatePageData(fileData, statusMessage: string, showLoadMoreButton: boolean) {
    console.log(fileData);
    this.fileData = fileData;
    this.showLoadMoreButton = showLoadMoreButton;
    const nodes = [];
    GlobalState.features = [];

    for (const f of fileData.features) {
      GlobalState.features.push(f);
      nodes.push({
        data: {id: f}
      });
    }

    this.uploadPageState.showLoadMoreButton = showLoadMoreButton;
    this.uploadPageState.fileData = {
      rowCount: fileData.rowCount,
      features: fileData.features.slice(0),
      head: fileData.head.slice(0)
    };

    this.setStatus(statusMessage);
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

  private async loadRest() {
    let fileData = await this.uploadService.getFullFile(this.delimiter, this.selectedHeaderOptionId, undefined);
    GlobalState.dataFileUploaded = true;
    GraphState.data = null; // reset graph data, otherwise the old graph will be shown if you upload another file
    this.fileData = undefined;
    this.updatePageData(fileData, `Loaded the rest of the data`, false);
  }

  private static checkIfInputIsInteger(inputString: string): boolean {
    return Number.isInteger(Number(inputString)) && inputString !== '';
  }

  private static checkIfInputIsNumber(inputString: string): boolean {
    return !Number.isNaN(Number(inputString)) && inputString !== '';
  }

  private async generateLinearDataset() {
    if (!UploadPage.checkIfInputIsInteger(this.beta)) {
      this.setErrorStatus('Beta must be an integer.');
      return;
    }
    if (!UploadPage.checkIfInputIsInteger(this.commonCausesNumber)) {
      this.setErrorStatus('Number of common causes must be an integer.');
      return;
    }
    if (!UploadPage.checkIfInputIsInteger(this.samplesNumber)) {
      this.setErrorStatus('Number of samples must be an integer.');
      return;
    }
    if (!UploadPage.checkIfInputIsInteger(this.instrumentsNumber)) {
      this.setStatus('Number of instruments must be an integer. Using default value - 0');
      this.instrumentsNumber = '0';
    }
    if (!UploadPage.checkIfInputIsInteger(this.effectModifiersNumber)) {
      this.setStatus('Number of effect modifiers must be an integer. Using default value - 0');
      this.effectModifiersNumber = '0';
    }
    if (!UploadPage.checkIfInputIsInteger(this.treatmentsNumber)) {
      this.setStatus('Number of treatments must be an integer. Using default value - 1');
      this.treatmentsNumber = '1';
    }
    if (!UploadPage.checkIfInputIsInteger(this.frontdoorVariablesNumber)) {
      this.setStatus('Number of treatments must be an integer. Using default value - 0');
      this.frontdoorVariablesNumber = '0';
    }
    if (!UploadPage.checkIfInputIsInteger(this.discreteCommonCausesNumber)) {
      this.setStatus('Number of discrete common causes must be an integer. Using default value - 0');
      this.discreteCommonCausesNumber = '0';
    }
    if (!UploadPage.checkIfInputIsInteger(this.discreteInstrumentsNumber)) {
      this.setStatus('Number of discrete instruments must be an integer. Using default value - 0');
      this.discreteInstrumentsNumber = '0';
    }
    if (!UploadPage.checkIfInputIsInteger(this.discreteEffectModifiersNumber)) {
      this.setStatus('Number of discrete modifiers must be an integer. Using default value - 0');
      this.discreteInstrumentsNumber = '0';
    }
    const linearDatasetDto: IGenerateLinearDatasetDto = {
      beta: this.beta,
      samplesNumber: this.samplesNumber,
      commonCausesNumber: this.commonCausesNumber,
      instrumentsNumber:this.instrumentsNumber,
      effectModifiersNumber: this.effectModifiersNumber,
      treatmentsNumber:this.treatmentsNumber,
      frontdoorVariablesNumber: this.frontdoorVariablesNumber,
      isTreatmentBinary: this.isTreatmentBinary.toString(),
      isOutcomeBinary: this.isOutcomeBinary.toString(),
      discreteCommonCausesNumber: this.discreteCommonCausesNumber,
      discreteInstrumentsNumber: this.discreteInstrumentsNumber,
      discreteEffectModifiersNumber: this.discreteEffectModifiersNumber,
      isOneHotEncoded: this.isOneHotEncoded.toString(),
      store: this.store.toString(),
    }
    let fileData = await this.uploadService.generateLinearDataset(linearDatasetDto);
    GlobalState.dataFileUploaded = true;
    GraphState.data = null; // reset graph data, otherwise the old graph will be shown if you upload another file
    this.fileData = undefined;
    this.updatePageData(fileData, `Generated linear dataset`, true);
  }

  private async generateXYDataset() {
    if (!UploadPage.checkIfInputIsInteger(this.samplesNumberXY)) {
      this.setErrorStatus('Samples number must be an integer.');
      return;
    }
    if (!UploadPage.checkIfInputIsInteger(this.commonCausesNumberXY)) {
      this.setStatus('Common causes number must be an integer. Using default value: 1');
      this.commonCausesNumberXY = '1';
    }
    if (!UploadPage.checkIfInputIsNumber(this.standardDeviationErrorXY)) {
      this.setStatus('Standard deviation must be a number. Using default value. Using default value: 1');
      this.standardDeviationErrorXY = '1';
    }
    const xyDatasetDto: IGenerateXYDatasetDto = {
      samplesNumber: this.samplesNumberXY,
      commonCausesNumber: this.commonCausesNumberXY,
      effect: this.effectXY.toString(),
      isLinear: this.isLinearXY.toString(),
      standardDeviationError: this.standardDeviationErrorXY,
      store: this.store.toString(),
    }
    let fileData = await this.uploadService.generateXYDataset(xyDatasetDto);
    GlobalState.dataFileUploaded = true;
    GraphState.data = null; // reset graph data, otherwise the old graph will be shown if you upload another file
    this.fileData = undefined;
    this.updatePageData(fileData, `Generated XY dataset`, true);
  }
}
