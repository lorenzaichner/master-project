import { inject } from 'aurelia-framework';
import { ApiService } from '../api.service';
import { GetResultsResponse, Results } from 'common/response/results/results.response';
import { SuccessResponse } from 'common/response/basic.response';
import { SessionService } from '../session/session.service';
import { StatusLine } from '../status/status.line';
import { ResultsPageState } from './results.page.state';
import { GraphState } from '../graph/graph.state';

const GET_RESULTS_MAX_RETRIES = 60;
const GET_RESULTS_PERIOD_MS = 2000;

export class ResultsPage {
  private regression: number | null = null;
  private stratification: number | null = null;
  private matching: number | null = null;
  private weighting: number | null = null;
  private iv: number | null = null;
  private regDiscont: number | null = null;
  private nde: number | null = null;
  private nie: number | null = null;
  private statusLine: StatusLine;

  constructor() {
    if(ResultsPageState.shouldGetResults) {
      this.pollResults()
        .catch(err => {
          this.statusLine.setError(`Polling for results failed with ${err}`);
        })
        .then(() => {
          ResultsPageState.shouldGetResults = false;
        });
    }
  }

  public clearResults(): void {
    this.regression = null;
    this.stratification = null;
    this.matching = null;
    this.weighting = null;
    this.iv = null;
    this.regDiscont = null;
    this.nde = null;
    this.nie = null;
  }

  private async pollResults(): Promise<void> {
    for(let i = 0; i < GET_RESULTS_MAX_RETRIES; i++) {
      const data = await ApiService.get<GetResultsResponse>('/results', { session: await SessionService.ensureSession() });
      if((data as (SuccessResponse & { available: false })).available === false) {
        this.statusLine.setStatus(`waiting for the results... (${i}/${GET_RESULTS_MAX_RETRIES})`);
        await this.waitMs(GET_RESULTS_PERIOD_MS);
      } else {
        const dataWithResults = data as SuccessResponse & Results;

        this.regression = GraphState.selectedMethods.regression ? dataWithResults.regression : null;
        this.stratification = GraphState.selectedMethods.stratification ? dataWithResults.stratification : null;
        this.matching = GraphState.selectedMethods.matching ? dataWithResults.matching : null;
        this.weighting = GraphState.selectedMethods.weighting ? dataWithResults.weighting : null;
        this.iv = GraphState.selectedMethods.ivs ? dataWithResults.iv : null;
        this.regDiscont = GraphState.selectedMethods.regDiscont ? dataWithResults.regDiscont : null;

        if(GraphState.selectedMethods.twoStageRegression == true) {
          this.nde = dataWithResults.nde;
          this.nie = dataWithResults.nie;
        } else {
          this.nde = null;
          this.nie = null;
        }

        ResultsPageState.regression = this.regression;
        ResultsPageState.stratification = this.stratification;
        ResultsPageState.matching = this.matching;
        ResultsPageState.weighting = this.weighting;
        ResultsPageState.iv = this.iv;
        ResultsPageState.regDiscont = this.regDiscont;
        ResultsPageState.nde = this.nde;
        ResultsPageState.nie = this.nie;

        this.statusLine.setStatus('results received');
        break;
      }
    }
  }

  private async waitMs(ms: number): Promise<void> {
    await new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  attached() {
    this.regression = GraphState.selectedMethods.regression ? ResultsPageState.regression : null;
    this.stratification = GraphState.selectedMethods.stratification ? ResultsPageState.stratification : null;
    this.matching = GraphState.selectedMethods.matching ? ResultsPageState.matching : null;
    this.weighting = GraphState.selectedMethods.weighting ? ResultsPageState.weighting : null;
    this.iv = GraphState.selectedMethods.ivs ? ResultsPageState.iv : null;
    this.regDiscont = GraphState.selectedMethods.regDiscont ? ResultsPageState.regDiscont : null;

    if(GraphState.selectedMethods.twoStageRegression == true) {
      this.nde = ResultsPageState.nde;
      this.nie = ResultsPageState.nie;
    } else {
      this.nde = null;
      this.nie = null;
    }
  }

}
