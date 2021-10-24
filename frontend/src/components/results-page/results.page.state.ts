export class ResultsPageState {
  /* set to true by the graph page, after uploading the graph
     set to false in the results page after the results are received for the current run */
  public static shouldGetResults: boolean = false;

  // results
  public static regression: number | null = null;
  public static stratification: number | null = null;
  public static matching: number | null = null;
  public static weighting: number | null = null;
  public static iv: number | null = null;
  public static regDiscont: number | null = null;
  public static nde: number | null = null;
  public static nie: number | null = null;
  public static doubleMl: number | null = null;

  public static clearResults(): void {
    this.regression = null;
    this.stratification = null;
    this.matching = null;
    this.weighting = null;
    this.iv = null;
    this.regDiscont = null;
    this.nde = null;
    this.nie = null;
    this.doubleMl = null;
  }
}
