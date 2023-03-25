import { SuccessResponse } from 'common/response/basic.response';
import { Results } from 'common/response/results/results.response';
import {Injectable} from '@nestjs/common';
import {promises as fs} from 'fs';
import * as config from 'config';
import * as csv_parse from 'csv-parse/lib/sync';
import {
    FileUploadQueryDto,
    GenerateLinearDatasetDto,
    GenerateXYDatasetDto,
    GraphUploadDto,
    UrlFileUploadDto
} from './upload.dto';
import {AppError} from 'src/errors/app.error';
import {GraphUtil} from 'common/util/GraphUtil';
import axios, {AxiosRequestConfig} from 'axios';
import {Logger} from '../log/logger';
import {ChildProcessWithoutNullStreams, spawn} from 'child_process';
import { MinioClientService } from 'src/minio-client/minio-client.service';
import { BufferedFile } from 'src/minio-client/file.model';
import {FileInterceptor} from '@nestjs/platform-express';
import { request } from 'http';
import { CDGraph, LoadGraphResponse } from 'common/response/minio/miniograph.response';
import { isBoolean } from 'class-validator';


//const FILE_DIR = "/home/lorenz/Documents/Bachelor/master-project/backend"; 
const FILE_DIR = config.get<string>('Upload.StorageDir');
// both at the same dir, at least for now
const DATA_FILES_DIR = FILE_DIR;
const GRAPH_FILES_DIR = FILE_DIR;

@Injectable()
export class UploadService {
    constructor(private minioClientService: MinioClientService) {
        
    }
    
    async storeFileInDatabase(file: File, delemiter?: string, headerRowCount?: string){
        const uploadedFile = await this.minioClientService.uploadFile(file as unknown as BufferedFile, delemiter, headerRowCount);
        return uploadedFile;
    }

    async storeGeneratedLinearInDatabase(file: Buffer, headerRowCount?: string){
        const uploadedFile = await this.minioClientService.uploadGenerated(file, headerRowCount);
        return uploadedFile;
    }
    
    private static removeLineFromFile(targetLine: number, buf: Buffer): Buffer {
        let targetLineStartOffset = 0;
        let targetLineEndOffset = 0;
        let currentLine = 1;
        let currentOffset = 0;
        for (const el of buf) {
            if (el === 0x0a) {
                if (currentLine === targetLine - 1) {
                    targetLineStartOffset = currentOffset + 1;
                }
                if (currentLine === targetLine) {
                    targetLineEndOffset = currentOffset + 1;
                }
                currentLine++;
            }
            currentOffset++;
        }
        return Buffer.concat([buf.slice(0, targetLineStartOffset), buf.slice(targetLineEndOffset, buf.length)]);
    }

    private async saveFile(session: string, file: Buffer): Promise<void> {
        const dataFilePath = this.getDataFilePath(session);
        console.log(dataFilePath)
        try {
            Logger.getInstance().log('info', `Storing file in path: ${dataFilePath}`);
            await fs.writeFile(dataFilePath, file);
        } catch (err) {
            const errMessage = `could not save the data file which was uploaded by the user (process.cwd is '${process.cwd()}', data file path is '${dataFilePath}')`;
            throw AppError.fromName('DATA_FILE_SAVE_FAIL', [err], errMessage + dataFilePath);
        }
    }

    public async saveGraphFile(session: string, file: Buffer): Promise<void> {
        const graphFilePath = this.getGraphFilePath(session);
        try {
            
            await fs.writeFile(graphFilePath, file);
        } catch (err) {
            throw AppError.fromName('GRAPH_FILE_SAVE_FAIL', [err]);
        }
    }

    public getDataFilePath(session: string): string {
        return `${DATA_FILES_DIR}${session.replace(/\//g, '_')}.dat`;
    }

    public getGraphFilePath(session: string): string {
        return `${GRAPH_FILES_DIR}${session.replace(/\//g, '_')}.gml`;
    }

    /**
     * get the CSV file header
     * \return number of read rows (without headers) and named features
     * @param session current session of user
     * @param fileBuffer buffer containing file data
     * @param delimiter  value delimiter
     * @param headerRowCount number of rows for header
     * @param getFullFile boolean indicating whether we need full table or just head
     * @param features might be there if the user specifies them (file contains no header)
     */
    private async parseFileAndGetFeatures(session: string, fileBuffer: Buffer, delimiter: string, headerRowCount: number, getFullFile: boolean,
                                          features?: string[], identifier?: string): Promise<{ rowCount: number, features: string[], head: string[][], identifier?: string}> {
        try {
            let buf = fileBuffer;
            if (features !== undefined) {
                buf = Buffer.concat([Buffer.from(`${features.join(delimiter)}\n`), fileBuffer]);
                await this.saveFile(session, buf);
            }
            // second header row has to be dropped for now, it crashes the estimation
            if (headerRowCount === 2) {
                await this.saveFile(session, UploadService.removeLineFromFile(2, buf));
            }
            let rowIndex = 0;
            const res = csv_parse(buf, {
                delimiter,
                on_record: rec => {
                    const hasEmptyColumn = rec.find(v => v.length === 0) != null;
                    if (hasEmptyColumn) {
                        throw AppError.fromName('DATA_FILE_EMPTY_COLUMN', [], `the provided data file contains rows with no values at certain columns at row ${rowIndex}`);
                    }
                    rowIndex++;
                    return rec;
                }
            });

            const rowCount = res.length - headerRowCount;
            let headSize = 5;
            if (rowCount < 5) {
                headSize = rowCount;
            }
            const tableHead = getFullFile ? res.slice(headerRowCount) : res.slice(headerRowCount, headerRowCount + headSize);
            if (features !== undefined) {
                return {rowCount, features, head: tableHead};
            }
            if (headerRowCount === 0) {
                const generatedFeatures = [];
                for (let i = 0; i < res[0].length; i++) {
                    generatedFeatures.push(`Feature ${i}`);
                }
                return {rowCount, features: generatedFeatures, head: tableHead};
            }
            return {rowCount, features: res[0], head: tableHead, identifier};
        } catch (ex) {
            const inconsistentRecordLength = ex.code === 'CSV_INCONSISTENT_RECORD_LENGTH';
            if (ex.name !== 'DATA_FILE_EMPTY_COLUMN' && !inconsistentRecordLength) {
                throw AppError.fromName('UNKNOWN_ERROR', [ex]);
            }
            if (inconsistentRecordLength) {
                throw AppError.fromName('DATA_FILE_INCONSISTENT_RECORD_LENGTH');
            }
            throw ex;
        }
    }

    public async transformAndSaveGraph(session: string, graphDto: GraphUploadDto): Promise<void> {
        const data = GraphUtil.graphFromNodesAndEdges(graphDto.nodes, graphDto.edges);
        await fs.writeFile(this.getGraphFilePath(session), data);
    }

    public async uploadFile(queryDto: FileUploadQueryDto, session: string, file: Express.Multer.File):
        Promise<{ rowCount: number, features: string[], head: string[][] }> {
        await this.saveFile(session, file.buffer);

        if(queryDto.store == "true")
            var identifier = await this.storeFileInDatabase(file as unknown as File, queryDto.delimiter, queryDto.headerRowCount);
        
        return this.parseFileAndGetFeatures(session, file.buffer, queryDto.delimiter,
            parseInt(queryDto.headerRowCount, 10), false, queryDto.features, identifier);
    }

    public async loadFile(identifier: string, session: string): Promise<{ rowCount: number, features: string[], head: string[][] }> {
        const object = await this.minioClientService.getData(identifier, this.getDataFilePath(session));
        console.log(object);


        let data = await fs.readFile(object.path);
        console.log(data);
        return  this.parseFileAndGetFeatures(session, data, object.delemiter,
        parseInt(object.headerRowCount, 10), false, undefined, object.filename);        
    }

    public async loadGraph(identifier: string): Promise<Array<CDGraph>> {
        var res:Array<CDGraph> =  await this.minioClientService.getGraphs(identifier);
        return res;          
    }

    public async getFileFromLink(urlFileUploadDto: UrlFileUploadDto, session: string):
        Promise<{ rowCount: number, features: string[], head: string[][] }> {
        const axiosConfig: AxiosRequestConfig = {
            responseType: 'arraybuffer'
        };
        try {
            const response = await axios.get(urlFileUploadDto.url, axiosConfig);
            const fileData: Buffer = response.data;
            await this.saveFile(session, fileData);
            return this.parseFileAndGetFeatures(session, fileData,
                urlFileUploadDto.delimiter, parseInt(urlFileUploadDto.headerRowCount, 10), false, urlFileUploadDto.features);
        } catch (error) {
            throw AppError.fromName('URL_FILE_UPLOAD_ERROR');
        }
    }

    public async generateLinearDataset(generateLinearDatasetDto: GenerateLinearDatasetDto,
                                       session: string): Promise<{ rowCount: number, features: string[], head: string[][], identifier?: string } | false> {
        const path = this.getDataFilePath(session);
        const cwd = process.cwd();
        const proc = spawn('python3',
            [`${cwd}/../dowhy/generate_linear_dataset.py`, path, generateLinearDatasetDto.beta,
                generateLinearDatasetDto.commonCausesNumber,
                generateLinearDatasetDto.samplesNumber, generateLinearDatasetDto.instrumentsNumber,
                generateLinearDatasetDto.effectModifiersNumber, generateLinearDatasetDto.treatmentsNumber,
                generateLinearDatasetDto.frontdoorVariablesNumber, generateLinearDatasetDto.isTreatmentBinary,
                generateLinearDatasetDto.isOutcomeBinary, generateLinearDatasetDto.discreteCommonCausesNumber,
                generateLinearDatasetDto.discreteInstrumentsNumber,
                generateLinearDatasetDto.discreteEffectModifiersNumber, generateLinearDatasetDto.isOneHotEncoded]);
        const result =  await this.finishGenerating(proc, path, session);
        if(generateLinearDatasetDto.store == "true" && result != false){
            let file = await fs.readFile(path);
            var identifier = await this.storeGeneratedLinearInDatabase(file, String(result.head.length));
            result.identifier = identifier;
        }
                                    
        return result;
    
    }

    private async finishGenerating(proc: ChildProcessWithoutNullStreams, path: string, session: string):
        Promise<{ rowCount: number, features: string[], head: string[][], identifier?: string} | false> {
        const exitCode = await new Promise((resolve) => {
            proc.on('exit', resolve);
        });
        if (exitCode === 0) {
            Logger.getInstance().log('info', `Successful generating`);
            const fileBuffer = await fs.readFile(path);
            return this.parseFileAndGetFeatures(session, fileBuffer, ',',
                1, false, undefined);
        } else {
            Logger.getInstance().log('error', `Generating of dataset failed`);
            return false;
        }
    }

    public async loadFullFile(session: string, queryDto: FileUploadQueryDto): Promise<{ rowCount: number, features: string[], head: string[][] }> {
        const path = this.getDataFilePath(session);
        const fileBuffer = await fs.readFile(path);
        return this.parseFileAndGetFeatures(session, fileBuffer, queryDto.delimiter,
            parseInt(queryDto.headerRowCount, 10), true, queryDto.features);
    }

    public async generateXYDataset(generateXYDatasetDto: GenerateXYDatasetDto, session: string):
        Promise<{ rowCount: number, features: string[], head: string[][], identifier?: string } | false> {
        const path = this.getDataFilePath(session);
        const cwd = process.cwd();
        const proc = spawn('python3',
            [`${cwd}/../dowhy/generate_xy_dataset.py`, path, generateXYDatasetDto.samplesNumber,
                generateXYDatasetDto.commonCausesNumber,
                generateXYDatasetDto.effect, generateXYDatasetDto.isLinear, generateXYDatasetDto.standardDeviationError
            ]);
        const result = await this.finishGenerating(proc, path, session);
        if(generateXYDatasetDto.store == "true" && result != false){
            let file = await fs.readFile(path);
            console.log(file);
            var identifier = await this.storeGeneratedLinearInDatabase(file, String(result.head.length));
            result.identifier = identifier;
        } 
        return result;
    }
}
