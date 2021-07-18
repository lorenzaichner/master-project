import { Controller, Get } from '@nestjs/common';
import { ResultsService } from './results.service';
import { GetResultsResponse } from 'common/response/results/results.response';
import { Session } from 'src/decorators/session.decorator';

@Controller('/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  public async getResults(@Session() session: string): Promise<GetResultsResponse> {
    const results = await this.resultsService.getResults(session);
    if(results === false) {
      return {
        success: true,
        available: false,
      };
    }
    return {
      success: true,
      ...results,
    };
  }
}
