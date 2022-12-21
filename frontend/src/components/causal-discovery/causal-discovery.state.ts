import { ResultCDAlgorithm } from "./causal-discovery";


export class CausalDiscoveryState {

  public static results: ResultCDAlgorithm[];
  public static causalDiscoveryEdgesId: String[];

  public static readonly layout = {
    spacingFactor: 1.5,
    name: 'grid',
    rows: 1,
  };

  public static data: any | null = null;

}
