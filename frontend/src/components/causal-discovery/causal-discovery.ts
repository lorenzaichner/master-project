import { bootstrap } from 'aurelia-bootstrapper';
import cytoscape from 'cytoscape';
import {inject} from 'aurelia-framework';
import {StatusLine} from '../status/status.line';
import {UploadService} from '../upload-page/upload.service';
import {GlobalState} from '../global.state';
import {ResultsPage} from '../results-page/results-page';
import { GraphService } from './causal-discovery.service';
import { SuccessResponse } from 'common/response/basic.response';
import { GraphState } from '../graph/graph.state';
import { GeneratedGraph } from 'common/response/graph/graph.response';
import { CausalDiscoveryState } from './causal-discovery.state';


const CDT_GRAPH_REQUEST = 600000;
const CDT_WAIT_MS_REQUEST = 5000;


export type SelectedCDAlgortihm = {
  algorithm: string;
}

export type ResultCDAlgorithm = {
  recovery:String;
  causal_discovery:String;
  status: number;
  graph?: Array<[string, string]>;
  score?: String ;
  loaded?: boolean;
}

export type AlgorithmParameter = {
  continious?: boolean;
  descrete?:boolean;
  createUndirectGraph?:boolean;
}

@inject(UploadService, ResultsPage, GraphService)
export class Graph {
  graphStyle: Record<string, unknown> = {
    width: '100%',
    height: '100%',
    border: 'solid 1px gray'
  };
  nodes: any[] = [];
  graph: any;
  ctr = 101;
  addEdgeNodeIdFrom: string | null = null;
  addEdgeNodeIdTo: string | null = null;
  statusLine: StatusLine;

  features = GlobalState.features;
  // causal model data

  causalDiscoveryAlgorithmsModels = ["ANM", "BivariateFit", "CDS", "IGCI", "RECI", "GES", "GIES", "PC", "LiNGAM", "CGNN"];
  skeletonRecoveryAlgoritms = ["ARD", "DecisionTreeRegression", "Glasso", "LinearSVRL2"];

  skelettonRecoveryyDescription = new Map([
    ["ARD", "Automatic Relevance Determination (ARD) is a Bayesian regression technique that efficiently removes irrelevant features that leads to a sparse subset. The main idea behind ARD is to regularize the solution by using a parameterized, data-dependent prior distribution that removes redundant and superfluous features."],
    ["DecisionTreeRegression", "v1"],
    ["Glasso", "v1"],
    ["LinearSVRL2", "v2"]
    ]);


  causalDiscoveryDescription = new Map([
    ["ANM", "Approaches for pairwise causality. Only Works for continious datatypes."],
    ["BivariateFit", "The bivariate fit model is based onon a best-fit criterion relying on a Gaussian Process regressor. Used as weak baseline. Only Works for continious datatypes."],
    ["CDS", "Conditional Distribution Similarity measures the standart derivation for y in respect to x and vice versa. The lower the std. the more likely the pair to be x->y (resp. y->x). Works for Continuous and Discrete."],
    ["IGCI", "Information Geometric Causal Inference algorithm is a pairwise causal discovery approach for continuous data. It works best when the noise in the data is minimal and the functions that relate the variables are invertible."],
    ["RECI", "Regression Error based Causal Inference relies on a best-fit mse with monome regressor and [0,1] rescaling to infer causal direction. Only Works for continious datatypes."],
    ["GES", "Greedy Equivalence Search algorithm. A score-based Bayesian algorithm that searches heuristically the graph which minimizes a likelihood score on the data. Works for Continuous or Categorical."],
    ["GIES", "Greedy Interventional Equivalence Search algorithm. The main difference with GES is that it accepts interventional data for its inference. Works for Continuous or Categorical."],
    ["PC", "Based on conditional tests on variables and sets of variables, it proved itself to be really efficient. Consider graphs < 200 variables. Works for continuous and discrete datasets"],
    ["LiNGAM", "Linear Non-Gaussian Acyclic model. The underlying causal model is supposed to be composed of linear mechanisms and non-gaussian data. Works for Continuous data types."],
    ["CGNN", "Causal Generative Neural Networks. Score-method that evaluates candidate graph by generating data following the topological order of the graph using neural networks, and using MMD for evaluation. All the possible structures are tested, which leads to a super exponential complexity. It would be preferable to start from a graph skeleton for large graphs."]
    ]);
  
  datatypes = ["Continious", "Categorical"];

  datatype: string = "";

  useGraph: boolean = false;

  causalDiscovery: string;
  recovery: string;

  causalDiscoveryResults: ResultCDAlgorithm[] = [];
  causalDiscoveryEdgesId: String[] =[];
  initGraph: Boolean = false;
  loading: Boolean = false;


  // 0 - upload graph file
  // 1 - edit here (default)
  selectedGraphOption = 1;
  uploadFiles?: FileList;

  identifier: String;

  get selectedAlgorithmDescription() {
    return this.skelettonRecoveryyDescription.get(this.recovery);
  }

  get selectedCausalDiscoveryDescription() {
    return this.causalDiscoveryDescription.get(this.causalDiscovery);
  }

  constructor(
    private uploadService: UploadService,

    private resultsPage: ResultsPage,
    private graphService: GraphService,
  ) {}

  // TODO adjust / clean up?
  public addNode() {
    this.graph.add({
      group: 'nodes',
      data: {id: this.ctr++},
      position: {
        x: 0,
        y: 0
      }
    });
  }


  cdAlgorithmChanged(mathode: String){
    this.causalDiscovery;
  }
  recoveryAlgorithmChanges(){
    this.recovery;
  }

  private async processCausalDiscovery(){
    for(var i = 0; i < this.skeletonRecoveryAlgoritms.length; i++){
      for(var y = 0; y < this.causalDiscoveryAlgorithmsModels.length; y++) {
        if(this.causalDiscoveryAlgorithmsModels[y] == "GES" || this.causalDiscoveryAlgorithmsModels[y] == "GIES") this.datatype = this.datatypes[0];
        if(this.causalDiscoveryAlgorithmsModels[y] == "PC") this.useGraph = true;
        this.causalDiscovery = this.causalDiscoveryAlgorithmsModels[y];
        this.recovery = this.skeletonRecoveryAlgoritms[i];
        await this.test();
      }
    }
  }

  private async test(){

   console.log("DATATYPE: "+this.datatype);

   if(this.causalDiscovery == null || this.recovery == null && !this.useGraph) {
      this.statusLine.setError("Please choose both algorithms.")
      return;
    } 
    
    if (this.graph == null) {
      this.statusLine.setError('No data found.');
      return;
    }

    if (!GlobalState.dataFileUploaded) {
      this.statusLine.setError('No data found.');
      return;
    }

    if(this.useGraph && (this.causalDiscovery == 'PC' || this.causalDiscovery == 'CGNN')) this.recovery = "NONE";

    this.loading = true;    
    
    var dublicate:boolean = false; 
    var entry;

    for(var i = 0; i < this.causalDiscoveryResults.length; i++) {
      if(this.causalDiscoveryResults[i].recovery == this.recovery && this.causalDiscoveryResults[i].causal_discovery == this.causalDiscovery){
        entry = i;
        dublicate = true;
        this.causalDiscoveryResults[i].status = 0;
      }
    }


    if(!dublicate) {
      const data: ResultCDAlgorithm = {
        recovery: this.recovery,
        causal_discovery: this.causalDiscovery,
        status: 0,
      }   
      this.causalDiscoveryResults.push(data);
      entry = this.causalDiscoveryResults.length - 1;
    }


    this.graphService.genereateGraph(this.causalDiscovery, this.recovery, GlobalState.dataFileDelimiter, this.datatype, this.useGraph);

    for(let i = 0; i < CDT_GRAPH_REQUEST; i++) {
      try{
        var result = await this.graphService.checkCausalDiscoveryResults(this.causalDiscovery, this.recovery)  
      } catch (e) {
        this.statusLine.setError("Error while generating graph.");
        this.causalDiscoveryResults[entry].status = 2;
        this.loading = false;  
        return;
      }
      
      if (!((result as (SuccessResponse & { available: false })).available === false)) {
        break;
      }
      await this.waitMs(CDT_WAIT_MS_REQUEST);
    }

    this.addGraph((result as (SuccessResponse & GeneratedGraph)), entry);
    
    this.selectedGraphOption = 2
    this.loading = false;  
    return;
  }

  private async addGraph(graph: GeneratedGraph, entry: any) {
    console.log(graph);
    this.causalDiscoveryResults[entry].graph = graph.graph.edges;
    this.causalDiscoveryResults[entry].recovery = this.recovery;
    this.causalDiscoveryResults[entry].causal_discovery = this.causalDiscovery;
    this.causalDiscoveryResults[entry].status = 1;
    GraphState.causalDiscoveryResults = this.causalDiscoveryResults;
    CausalDiscoveryState.results = this.causalDiscoveryResults;

  }

  public addEdge(start: String, dest: String){
    this.graph.add({
      group: 'edges',
      data: {
        id: `${start}_${dest}`, 
        source: start,
        target: dest,
        directed: true
      }
    });
  }
  
  private deleteGraph(entry: ResultCDAlgorithm){ 
    console.log(entry);
    var index = this.causalDiscoveryResults.findIndex(res => res.causal_discovery === entry.causal_discovery && res.recovery == entry.recovery);
    if(this.causalDiscoveryResults[index].loaded) this.graph.edges(':simple').remove();
    console.log(index);
    this.causalDiscoveryResults.splice(index,1);
    this.graphService.deleteResult(entry.causal_discovery, entry.recovery);
  }

  private loadGraph(entry: ResultCDAlgorithm) {
    console.log(entry);
    this.graph.edges(':simple').remove();

    for(const edge of entry.graph) {
      this.addEdge(edge[0], edge[1]);
    }   
    
    for(var graph of this.causalDiscoveryResults){
      graph.loaded = false;
    }
    
    var index = this.causalDiscoveryResults.findIndex(res => res.causal_discovery === entry.causal_discovery && res.recovery == entry.recovery);
    this.causalDiscoveryResults[index].loaded = true;

    CausalDiscoveryState.results = this.causalDiscoveryResults;
    
    this.statusLine.setStatus("This Graph can be edited and processed under Graph.");
  }

  private async waitMs(ms: number): Promise<void> {
    await new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  attached() {
    if (GlobalState.dataFileUploaded) {
      if (GraphState.data == null) {
        this.graph = cytoscape({
          container: this['graph'],
          elements: {
            nodes: GraphState.nodes
          },
          layout: GraphState.layout,
          style: [
            {
              selector: 'node',
              style: {
                'label': 'data(id)',
              },
            },
            {
              selector: 'edge',
              style: {
                'width': (el) => el.selected() ? 5 : 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
              }
            }
          ]
        });
      } else {
        this.graph = cytoscape({
          ...GraphState.data,
          container: this['graph'],
          layout: GraphState.layout,
        });
      }
    }
    console.log(GlobalState.identifier);
    if(CausalDiscoveryState.results != null) this.causalDiscoveryResults = CausalDiscoveryState.results;
    if(GlobalState.identifier != null) this.identifier = GlobalState.identifier;
    //if(CausalDiscoveryState.causalDiscoveryEdgesId != null) this.causalDiscoveryEdgesId = CausalDiscoveryState.causalDiscoveryEdgesId;
  }
}
