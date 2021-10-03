import {
    IExternalGraphFileUploadDto,
    IFileUploadQueryDto, IGenerateLinearDatasetDto,
    IGraphUploadDto,
    IUrlFileUploadDto
} from 'common/dto/file.upload';
import {IsBoolean, IsNumberString, IsOptional, IsString} from 'class-validator';

export class FileUploadQueryDto implements IFileUploadQueryDto {
    @IsString()
    delimiter!: string;

    @IsNumberString()
    headerRowCount!: string;

    @IsOptional()
    @IsString({each: true})
    features?: string[];
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

    @IsNumberString()
    headerRowCount!: string;

    @IsOptional()
    @IsString({each: true})
    features?: string[];
}

// tslint:disable-next-line:max-classes-per-file
export class GenerateLinearDatasetDto implements IGenerateLinearDatasetDto {
    @IsNumberString()
    beta: number;

    @IsNumberString()
    samplesNumber: number;

    @IsNumberString()
    commonCausesNumber: number;

    @IsNumberString()
    @IsOptional()
    discreteCommonCausesNumber: number;

    @IsNumberString()
    @IsOptional()
    discreteEffectModifiersNumber: number;

    @IsNumberString()
    @IsOptional()
    discreteInstrumentsNumber: number;

    @IsNumberString()
    @IsOptional()
    frontdoorVariablesNumber: number;

    @IsNumberString()
    @IsOptional()
    instrumentsNumber: number;

    @IsNumberString()
    @IsOptional()
    treatmentsNumber: number;

    @IsBoolean()
    @IsOptional()
    isOneHotEncoded: boolean;

    @IsBoolean()
    @IsOptional()
    isOutcomeBinary: boolean;

    @IsBoolean()
    @IsOptional()
    isTreatmentBinary: boolean;
}
