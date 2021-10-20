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
    beta: string;
    commonCausesNumber: string;
    samplesNumber: string;
    instrumentsNumber?: string;
    treatmentsNumber?: string;
    frontdoorVariablesNumber?: string;
    isTreatmentBinary?: boolean;
    isOutcomeBinary?: boolean;
    discreteCommonCausesNumber?: string;
    discreteInstrumentsNumber?: string;
    discreteEffectModifiersNumber?: string;
    isOneHotEncoded?:boolean;
}