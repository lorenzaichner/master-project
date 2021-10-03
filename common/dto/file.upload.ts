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
    delimiter: string;
    headerRowCount: string;
    features?: string[];
}

export interface IGenerateLinearDatasetDto {
    beta: number;
    commonCausesNumber: number;
    samplesNumber: number;
    instrumentsNumber?: number;
    treatmentsNumber?: number;
    frontdoorVariablesNumber?: number;
    isTreatmentBinary?: boolean;
    isOutcomeBinary?: boolean;
    discreteCommonCausesNumber?: number;
    discreteInstrumentsNumber?: number;
    discreteEffectModifiersNumber?: number;
    isOneHotEncoded?:boolean;
}