import {
    IExternalGraphFileUploadDto,
    IFileUploadQueryDto,
    IGenerateLinearDatasetDto,
    IGenerateXYDatasetDto,
    IGraphUploadDto,
    IUrlFileUploadDto
} from 'common/dto/file.upload';
import {IsBoolean, IsBooleanString, IsNumberString, IsOptional, IsString} from 'class-validator';

export class FileUploadQueryDto implements IFileUploadQueryDto {
    
    @IsString()
    delimiter!: string;

    @IsNumberString()
    headerRowCount!: string;

    @IsOptional()
    @IsString({each: true})
    features?: string[];
    
    @IsOptional()
    @IsString()
    store: string;    
}

// TODO validation
// tslint:disable-next-line:max-classes-per-file
export class GraphUploadDto implements IGraphUploadDto {
    delimiter!: string;
    nodes!: Array<{ id: string }>;
    // id can probably be deleted, not used
    edges!: Array<{ id: string, source: string, target: string }>;
    variables: {
        treatment: string,
        outcome: string,
        commonCauses: string[],
        ivs: string[],
    };
    /* CSV string, see the python script for accepted methods */
    selectedMethods: string;
}

// tslint:disable-next-line:max-classes-per-file
export class ExternalGraphFileUploadDto implements IExternalGraphFileUploadDto {
    delimiter!: string;
    variables!: {
        treatment: string,
        outcome: string,
        commonCauses: string[],
        ivs: string[],
        ivMethodInstrument?: string,
        regDiscontVarName?: string,
    };
    selectedMethods!: string;
}

// tslint:disable-next-line:max-classes-per-file
export class UrlFileUploadDto implements IUrlFileUploadDto {
    @IsString()
    url!: string;

    @IsString()
    delimiter!: string;

    @IsBoolean()
    store!: string;

    @IsNumberString()
    headerRowCount!: string;

    @IsOptional()
    @IsString({each: true})
    features?: string[];
}

// tslint:disable-next-line:max-classes-per-file
export class GenerateLinearDatasetDto implements IGenerateLinearDatasetDto {
    @IsNumberString()
    beta: string;

    @IsNumberString()
    samplesNumber: string;

    @IsNumberString()
    commonCausesNumber: string;

    @IsBoolean()
    store!: string;

    @IsNumberString()
    @IsOptional()
    discreteCommonCausesNumber: string;

    @IsNumberString()
    @IsOptional()
    discreteEffectModifiersNumber: string;

    @IsNumberString()
    @IsOptional()
    discreteInstrumentsNumber: string;

    @IsNumberString()
    @IsOptional()
    frontdoorVariablesNumber: string;

    @IsNumberString()
    @IsOptional()
    instrumentsNumber: string;

    @IsNumberString()
    @IsOptional()
    treatmentsNumber: string;

    @IsNumberString()
    @IsOptional()
    effectModifiersNumber: string;

    @IsBooleanString()
    @IsOptional()
    isOneHotEncoded: string;

    @IsBooleanString()
    @IsOptional()
    isOutcomeBinary: string;

    @IsBooleanString()
    @IsOptional()
    isTreatmentBinary: string;

}

// tslint:disable-next-line:max-classes-per-file
export class GenerateXYDatasetDto implements IGenerateXYDatasetDto {
    commonCausesNumber: string;
    @IsBooleanString()
    effect: string;
    @IsBooleanString()
    isLinear: string;
    samplesNumber: string;
    standardDeviationError: string;
}

