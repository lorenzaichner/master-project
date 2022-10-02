export interface IFileUploadQueryDto {
    delimiter: string;
    headerRowCount: string;
    features?: string[];
    store?: string;
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
        modelY?: string,
        modelT?: string,
        modelFinal?: string,
        selectPolynomialFeaturizer?: string,
        polynomialDegree?: string,
        includeBias?: string
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
        modelY?: string,
        modelT?: string,
        modelFinal?: string,
        selectPolynomialFeaturizer?: string,
        polynomialDegree?: string,
        includeBias?: string
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
    effectModifiersNumber?: string;
    treatmentsNumber?: string;
    frontdoorVariablesNumber?: string;
    isTreatmentBinary?: string;
    isOutcomeBinary?: string;
    discreteCommonCausesNumber?: string;
    discreteInstrumentsNumber?: string;
    discreteEffectModifiersNumber?: string;
    isOneHotEncoded?: string;
    store?: string;
    
}

export interface IGenerateXYDatasetDto {
    samplesNumber: string;
    commonCausesNumber: string;
    effect: string;
    isLinear: string;
    standardDeviationError: string;
    store?: string;
}
