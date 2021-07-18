import { Controller, Get } from "@nestjs/common";
import { SessionService } from "./session.service";
import { GetSessionResponse } from 'common/response/session/session.response';
import { NoSession } from "src/decorators/session.decorator";

@Controller('/session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @NoSession()
  @Get()
  public async getNewSession(): Promise<GetSessionResponse> {
    return {
      session: this.sessionService.getNewSession(),
      success: true,
    };
  }
}
