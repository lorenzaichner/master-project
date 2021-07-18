import { SelectedMethods } from './graph';

export class GraphState {
  public static nodes: any[] = [];
  public static edges: any[]  [];

  public static readonly layout = {
    spacingFactor: 1.5,
    name: 'grid',
    rows: 1,
  };

  public static selectedMethods: SelectedMethods = {
    regression: true,
    stratification: true,
    matching: true,
    weighting: true,
    ivs: true,
    regDiscont: true,
    twoStageRegression: true,
  };

  public static data: any | null = null;

  public static modelData: {
    treatment: string | null,
    outcome: string | null,
    commonCauses: string[],
    ivs: string[],
  } = {
    treatment: null,
    outcome: null,
    commonCauses: [],
    ivs: [],
  };
}
