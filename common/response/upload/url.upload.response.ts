import { SuccessResponse } from '../basic.response';

export type UrlUploadResponse = SuccessResponse
    & {
    data: {
        rowCount: number,
        features: string[]
    }
};
