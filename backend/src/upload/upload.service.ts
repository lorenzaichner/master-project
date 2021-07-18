import { Injectable } from '@nestjs/common';
import { promises as fs, writeFileSync } from 'fs';
import * as config from 'config';
import * as csv_parse from 'csv-parse/lib/sync';
import { GraphUploadDto } from './upload.dto';
import * as tmp from 'tmp';
import { AppError } from 'src/errors/app.error';
import { Logger } from 'src/log/logger';
import { GraphUtil } from 'common/util/GraphUtil';

const FILE_DIR = config.get<string>('Upload.StorageDir');
// both at the same dir, at least for now
const DATA_FILES_DIR = FILE_DIR;
const GRAPH_FILES_DIR = FILE_DIR;

@Injectable()
export class UploadService {
  constructor() {
    //
  }

  private removeLineFromFile(targetLine: number, buf: Buffer): Buffer {
    let targetLineStartOffset = 0;
    let targetLineEndOffset = 0;
    let currentLine = 1;
    let currentOffset = 0;
    for(const el of buf) {
      if(el === 0x0a) {
        if(currentLine === targetLine - 1) {
          targetLineStartOffset = currentOffset + 1;
        }
        if(currentLine === targetLine) {
          targetLineEndOffset = currentOffset + 1;
        }
        currentLine++;
      }
      currentOffset++;
    }
    const resultBuf = Buffer.concat([buf.slice(0, targetLineStartOffset), buf.slice(targetLineEndOffset, buf.length)]);
    return resultBuf;
  }

  public async saveFile(session: string, file: Buffer): Promise<void> {
    const dataFilePath = this.getDataFilePath(session);
    try {
      await fs.writeFile(dataFilePath, file);
    } catch(err) {
      const errMessage = `could not save the data file which was uploaded by the user (process.cwd is '${process.cwd()}', data file path is '${dataFilePath}')`;
      throw AppError.fromName('DATA_FILE_SAVE_FAIL', [err], errMessage);
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
   * @param features might be there if the user specifies them (file contains no header)
   */
  public async parseFileAndGetFeatures(session: string, fileBuffer: Buffer, delimiter: string, headerRowCount: number, features?: string[]): Promise<{ rowCount: number, features: string[] }> {
    try {
      let buf = fileBuffer;
      if(features != null) {
        buf = Buffer.concat([Buffer.from(`${features.join(delimiter)}\n`), fileBuffer]);
        await this.saveFile(session, buf);
      }
      // second header row has to be dropped for now, it crashes the estimation
      if(headerRowCount === 2) {
        await this.saveFile(session, this.removeLineFromFile(2, buf));
      }
      let rowIndex = 0;
      const res = csv_parse(buf, {
        delimiter: delimiter,
        on_record: rec => {
          const hasEmptyColumn = rec.find(v => v.length == 0) != null;
          if(hasEmptyColumn) {
            throw AppError.fromName('DATA_FILE_EMPTY_COLUMN', [], `the provided data file contains rows with no values at certain columns at row ${rowIndex}`);
          }
          rowIndex++;
          return rec;
        }
      });

      const rowCount = res.length - headerRowCount;
      if(features != undefined) {
        return { rowCount, features };
      }
      if(headerRowCount === 0) {
        const features = [];
        for(let i = 0; i < res[0].length; i++) {
          features.push(`Feature ${i}`);
        }
        return { rowCount, features };
      }
      return { rowCount, features: res[0] };
    } catch (ex) {
      const inconsistentRecordLength = ex.code == 'CSV_INCONSISTENT_RECORD_LENGTH';
      if(ex.name != 'DATA_FILE_EMPTY_COLUMN' && !inconsistentRecordLength) {
        throw AppError.fromName('UNKNOWN_ERROR', [ex]);
      }
      if(inconsistentRecordLength) {
        throw AppError.fromName('DATA_FILE_INCONSISTENT_RECORD_LENGTH');
      }
      throw ex;
    }
  }

  public async transformAndSaveGraph(session: string, graphDto: GraphUploadDto): Promise<void> {
    const data = GraphUtil.graphFromNodesAndEdges(graphDto.nodes, graphDto.edges);
    await fs.writeFile(this.getGraphFilePath(session), data);
  }
}
