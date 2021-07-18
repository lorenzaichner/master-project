const Nightmare = require('nightmare');
import { expect } from 'chai';

export type ResultsPageMethodsExpect = {
  regression?: [number, number],
  stratification?:  [number, number],
  matching?:  [number, number],
  weighting?:  [number, number],
  ivs?:  [number, number],
  regDiscont?:  [number, number],
  nde?: [number, number],
  nie?: [number, number],
};
export class TestUtil {
  private nightmare: any;

  constructor(nightmare) {
    this.nightmare = nightmare;
  }


  public async startup(): Promise<void> {
    await this.nightmare.goto('http://localhost:8080');
  }

  /**
   * navigates to the upload page, uploads the given file and expects the features to be printed
   * @param waitMs how long to wait for the response
   */
  public async runUploadPage(dataFile: string, expected: string[], waitMs = 1000, separator?: string, customHeaders?: string[]): Promise<void> {
    await this.nightmare.click('[href="#upload-page"]');
    await this.nightmare.upload('#file', `${process.cwd()}/test/data/${dataFile}`);
    if(separator != null) {
      // comma is there by default, so delete it and type the custom separator
      await this.nightmare.type('#csvSeparator', '\u0008');
      await this.nightmare.type('#csvSeparator', separator);
    }
    if(customHeaders != null) {
      await this.nightmare.click('#headerOption0'); // no headers in the data file, specified by user
      await this.nightmare.type('#featuresManually', customHeaders.join(','));
    }
    await this.nightmare.click('[type="submit"]');
    await this.nightmare.wait(waitMs);
    await this.expectStatus(`Uploaded '${dataFile}'`);
    const res = await this.nightmare.evaluate(t => {
      return document.querySelector(t).innerHTML;
    }, '#features');
    const split = res.split('</li>').map(r => r.replace('<li>', ''));
    expect(split.length).to.equal(expected.length + 1); // last one is empty string
    for(let i = 0; i < expected.length; i++) {
      expect(split[i]).to.equal(expected[i]);
    }
  }

  /**
   * navigates to the upload page, uploads the given file and expects an error to be printed
   * @param waitMs how long to wait for the response
   */
  public async expectUploadPageError(dataFile: string, error: string, waitMs = 1000): Promise<void> {
    await this.nightmare.click('[href="#upload-page"]');
    await this.nightmare.upload('#file', `${process.cwd()}/test/data/${dataFile}`);
    await this.nightmare.click('[type="submit"]');
    await this.nightmare.wait(waitMs);
    await this.expectStatus(error);
  }

  /**
   * navigates to the graph page, sets the given treatment, outcome and edges
   * edges should be in the from->to format (index 0 -> index 1)
   */
  public async runGraphPage(opts: {
    treatment: string,
    outcome: string,
    edges?: string[][],
    ivs?: string[],
    commonCauses?: string[],
    ivMethodInstrument?: string,
    regDiscontVarName?: string,
    waitMs?: number,
    disabledMethods?: ('regression' | 'stratification' | 'matching' | 'weighting' | 'ivs' | 'regDiscont' | 'twoStageReg')[],
    file?: string,
  }): Promise<void> {
    opts.waitMs = opts.waitMs ?? 100;
    await this.nightmare.click('[href="#graph"]');
    await this.nightmare.wait(100);
    if(opts.file != null) {
      await this.nightmare.click('#selectGraphFile');
      await this.nightmare.upload('#file', `${process.cwd()}/test/data/${opts.file}`);
    }
    if(opts.edges != null) {
      for(const edge of opts.edges) {
        await this.nightmare.select('#addEdgeNodeIdFrom', edge[0]);
        await this.nightmare.select('#addEdgeNodeIdTo', edge[1]);
        await this.nightmare.click('#addEdgeBtn');
      }
    }
    await this.nightmare.select('#treatment', opts.treatment);
    await this.nightmare.select('#outcome', opts.outcome);
    if(opts.ivs != null) {
      for(const iv of opts.ivs) {
        await this.nightmare.select('#ivs', iv);
        await this.nightmare.click('#addIV');
      }
    }
    if(opts.commonCauses != null) {
      for(const cc of opts.commonCauses) {
        await this.nightmare.select('#commonCauses', cc);
        await this.nightmare.click('#addCommonCause');
      }
    }
    if(opts.ivMethodInstrument != null) {
      await this.nightmare.select('#ivMethodInstrument', opts.ivMethodInstrument);
    }
    if(opts.regDiscontVarName != null) {
      await this.nightmare.select('#regDiscontVarName', opts.regDiscontVarName);
    }
    if(opts.disabledMethods != null) {
      if(opts.disabledMethods.includes('regression')) {
        await this.nightmare.uncheck('selectMethodRegression');
      }
      if(opts.disabledMethods.includes('stratification')) {
        await this.nightmare.uncheck('#selectMethodStratification');
      }
      if(opts.disabledMethods.includes('matching')) {
        await this.nightmare.uncheck('#selectMethodMatching');
      }
      if(opts.disabledMethods.includes('weighting')) {
        await this.nightmare.uncheck('#selectMethodWeighting');
      }
      if(opts.disabledMethods.includes('ivs')) {
        await this.nightmare.uncheck('#selectMethodIVs');
      }
      if(opts.disabledMethods.includes('regDiscont')) {
        await this.nightmare.uncheck('#selectMethodRegDiscont');
      }
      if(opts.disabledMethods.includes('twoStageReg')) {
        await this.nightmare.uncheck('#selectMethodTwoStageReg');
      }
    }
    await this.nightmare.click('#uploadBtn');
    await this.nightmare.wait(opts.waitMs);
    await this.expectStatus('Graph uploaded');
  }

  /**
   * navigate to the results page, wait the specified amount of time for the results, then expect the estimation
   * for now, only expects the 'Regression' method results (TODO other methods)
   * @param waitMs how long to wait for the results to appear after navigating to the results page (in ms)
   * @param methods which methods to expect (to have returned a result) - if expecting a method, provide a from-to (closed) interval within which the result should be
   */
  public async runResultsPage(
    methods: ResultsPageMethodsExpect,
    waitMs: number,
  ): Promise<void> {
    await this.nightmare.click('[href="#results-page"]');
    await this.nightmare.wait(waitMs);

    const methodResultSelectors = {
      regression: '#result-regression',
      stratification: '#result-stratification',
      matching: '#result-matching',
      weighting: '#result-weighting',
      ivs: '#result-iv',
      regDiscont: '#result-reg-discont',
      nde: '#result-nde',
      nie: '#result-nie',
    };
    for(const key in methods) {
      const evalRes = await this.nightmare.evaluate(t => {
        const queried = document.querySelector(t);
        return queried?.innerHTML ?? null;
      }, methodResultSelectors[key]);
      expect(evalRes != null).to.equal(true);
      const estimation = Number(evalRes);
      expect(
        estimation >= methods[key][0] && estimation <= methods[key][1],
        `expected ${estimation} to be within [${methods[key][0]}, ${methods[key][1]}] (method: '${key}')`,
      ).to.equal(true);
    }
  }

  /**
   * expect the status line to include the given string
   */
  public async expectStatus(includedString: string): Promise<void> {
    const evalRes = await this.nightmare.evaluate(t => {
      return document.querySelector(t).textContent;
    }, '#status-line-wrapper span');
    expect(evalRes.includes(includedString), `expected '${evalRes}' to include'${includedString}'`).to.equal(true);
  }

  /**
   * perform a full run, going through all three pages, based on the given options
   */
  public async fullRun(opts: {
    upload: {
      file: string,
      expectedFeatures: string[],
      separator?: string,
      waitMs?: number,
      customHeaders?: string[],
    },
    graph: {
      treatment: string,
      outcome: string,
      ivs?: string[],
      commonCauses?: string[],
      edges?: string[][],
      waitMs?: number,
      ivMethodInstrument?: string,
      regDiscontVarName?: string,
      disabledMethods?: ('regression' | 'stratification' | 'matching' | 'weighting' | 'ivs' | 'regDiscont' | 'twoStageReg')[],
      file?: string,
    },
    results: {
      waitMs: number,
      methods: ResultsPageMethodsExpect,
    },
  }): Promise<void> {
    await this.startup();
    await this.runUploadPage(opts.upload.file, opts.upload.expectedFeatures, opts.upload.waitMs ?? 1000, opts.upload.separator, opts.upload.customHeaders);
    await this.runGraphPage(opts.graph);
    await this.runResultsPage(opts.results.methods, opts.results.waitMs);
    await this.nightmare.end();
  }
}
