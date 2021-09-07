export interface IFileUploadQueryDto {
  delimiter: string;
  headerRowCount: string;
  features?: string[];
}

export interface IGraphUploadDto {
  /** backend needs the data file delimiter again */
  delimiter: string;
  nodes: { id: string }[];
  edges: { id: string, source: string, target: string }[];
  variables: {
    treatment: string,
    outcome: string,
    commonCauses: string[],
    ivs: string[],
    ivMethodInstrument?: string,
    regDiscontVarName?: string,
  };
  selectedMethods: string;
}

export interface IExternalGraphFileUploadDto {
  delimiter: string;
  variables: {
    treatment: string,
    outcome: string,
    commonCauses: string[],
    ivs: string[],
    ivMethodInstrument?: string,
    regDiscontVarName?: string,
  };
  selectedMethods: string;
}

export interface IUrlFileUploadDto {
  url: string;
}
