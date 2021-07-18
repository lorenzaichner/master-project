import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as config from 'config';

const SESSION_LENGTH = config.get<number>('Session.Length');
const JWT_KEY = config.get<number>('Session.JWTKey');

export class SessionService {

  public getNewSession(): string {
    return jwt.sign({ session: this.generateRandomSession() }, JWT_KEY);
  }

  /**
   * returns a tuple, if the session is valid, the first value is true and the second contains the stored session
   * returns false and null if the session is not valid
   */
  public verifySession(s: string): [boolean, string | null] {
    let valid = true;
    let session = null;
    try {
      const tokenData = jwt.verify(s, JWT_KEY);
      session = tokenData.session;
    } catch (ex) {
      valid = false;
    }
    return [valid, session];
  }

  /**
   * generates a random session ID, this is then signed and returned by getNewSession(..)
   */
  private generateRandomSession(): string {
    return randomBytes(SESSION_LENGTH).toString('base64');
  }
}
