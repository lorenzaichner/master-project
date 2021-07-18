import { IFileUploadQueryDto, IGraphUploadDto, IExternalGraphFileUploadDto } from 'common/dto/file.upload';
import { IsEnum, IsBooleanString, IsInt, IsString, IsOptional, IsNumberString } from 'class-validator';
import { Transform } from 'class-transformer';

export class FileUploadQueryDto implements IFileUploadQueryDto {
  @IsString()
  delimiter!: string;

  @IsNumberString()
  headerRowCount!: string;

  @IsOptional()
  @IsString({ each: true })
  features?: string[];
}

// TODO validation
export class GraphUploadDto implements IGraphUploadDto {
  delimiter!: string;
  nodes!: { id: string }[];
  // id can probably be deleted, not used
  edges!: { id: string, source: string, target: string }[];
  variables: {
    treatment: string,
    outcome: string,
    commonCauses: string[],
    ivs: string[],
  };
  /* CSV string, see the python script for accepted methods */
  selectedMethods: string;
}

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
