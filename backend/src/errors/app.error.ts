export type AppErrorName =
  'UNKNOWN_ERROR' |
  'DATA_FILE_EMPTY_COLUMN' |
  'DATA_FILE_INCONSISTENT_RECORD_LENGTH' |
  'DATA_FILE_SAVE_FAIL' |
  'GRAPH_FILE_SAVE_FAIL' |
  'GRAPH_DATA_INVALID'
;
type AppErrorsType = {
  [prop in AppErrorName]: {
    name: string,
    message: string,
    status?: number
  }
};
const AppErrors: AppErrorsType = {
  UNKNOWN_ERROR: {
    name: 'UNKNOWN_ERROR',
    message: 'an unknown error has occurred',
    status: 500,
  },
  DATA_FILE_EMPTY_COLUMN: {
    name: 'DATA_FILE_EMPTY_COLUMN',
    message: 'the provided data file contains rows with no values at certain columns',
  },
  DATA_FILE_INCONSISTENT_RECORD_LENGTH: {
    name: 'DATA_FILE_INCONSISTENT_RECORD_LENGTH',
    message: 'provided data has inconsistent record lengths (some lines have more/less values)',
  },
  DATA_FILE_SAVE_FAIL: {
    name: 'DATA_FILE_SAVE_FAIL',
    message: 'could not save the data file which was uploaded by the user',
    status: 500,
  },
  GRAPH_FILE_SAVE_FAIL: {
    name: 'GRAPH_FILE_SAVE_FAIL',
    message: 'could not save the graph file which was uploaded by the user',
    status: 500,
  },
  GRAPH_DATA_INVALID: {
    name: 'GRAPH_DATA_INVALID',
    message: 'graph-describing data is not valid (probably not a valid JSON string)',
    status: 400,
  },
}

export class AppError extends Error {
  public name: string;
  public message: string;
  public status: number;
  public innerErrors?: Error[];

  constructor(name: string, message: string, status = 400, innerErrors?: Error[]) {
    super();
    this.name = name;
    this.message = message;
    this.status = status;
    if(innerErrors != null && innerErrors.length != null && innerErrors.length > 0) {
      this.innerErrors = innerErrors.slice(0);
    }
  }

  public static fromName(name: AppErrorName, innerErrors?: Error[], messageOverride?: string,  statusOverride?: number): AppError {
    const errEntry = AppErrors[name];
    return new AppError(errEntry.name, messageOverride ?? errEntry.message, statusOverride ?? errEntry.status ?? 400, innerErrors);
  }
}
