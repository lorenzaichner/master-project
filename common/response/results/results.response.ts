import { SuccessResponse } from '../basic.response';

export type Results = {
  regression: number | null,
  stratification: number | null,
  matching: number | null,
  weighting: number | null,
  iv: number | null,
  regDiscont: number | null,
  nde: number | null,
  nie: number | null,
  doubleMl: number | null
};

export type GetResultsResponse = SuccessResponse & (Results | { available: false });
