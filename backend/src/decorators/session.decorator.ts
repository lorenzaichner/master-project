import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

export const NO_SESSION_KEY = 'session_required';
export const NoSession = () => SetMetadata(NO_SESSION_KEY, false)

export const Session = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.session;
  },
);
