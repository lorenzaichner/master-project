import { SuccessResponse } from '../basic.response';

export type GetSessionResponse = SuccessResponse & { session: string };
