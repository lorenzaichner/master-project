import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { SessionService } from 'src/session/session.service';
import { Reflector } from '@nestjs/core';
import { NO_SESSION_KEY } from 'src/decorators/session.decorator';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private reflector: Reflector, private readonly sessionService: SessionService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const noSessionRequiredClass = this.reflector.get<boolean>(NO_SESSION_KEY, context.getClass());
    const noSessionRequiredHandler = this.reflector.get<boolean>(NO_SESSION_KEY, context.getHandler());
    if(noSessionRequiredClass === false || noSessionRequiredHandler === false) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const session = request.headers.session;
    if(session == null) {
      return false;
    }
    const validSession = this.sessionService.verifySession(session);
    if(!validSession[0]) {
      return false;
    }
    request.user = { session: validSession[1] };
    return true;
  }
}
