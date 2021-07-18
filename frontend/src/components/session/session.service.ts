import { ApiService } from '../api.service';
import { GetSessionResponse } from 'common/response/session/session.response';
import { GlobalState } from '../global.state';

export class SessionService {
  /**
   * ensure that the global state has a session stored and return that session
   */
  public static async ensureSession(): Promise<string> {
    if(GlobalState.session == null) {
      const data = await ApiService.get<GetSessionResponse>('/session');
      GlobalState.session = data.session;
    }
    return GlobalState.session;
  }
}
