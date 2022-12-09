import cytoscape from 'cytoscape';
import {inject} from 'aurelia-framework';
import {GraphState} from './graph.state';
import {StatusLine} from '../status/status.line';
import {IGraphUploadDto, IExternalGraphFileUploadDto} from 'common/dto/file.upload';
import {UploadService} from '../upload-page/upload.service';
import {GlobalState} from '../global.state';
import {ResultsPage} from '../results-page/results-page';
import {ResultsPageState} from '../results-page/results.page.state';
import {GraphUtil} from 'common/util/GraphUtil';
import { GraphService } from './graph.service';
import { SessionService } from '../session/session.service';
import { SuccessResponse } from 'common/response/basic.response';
import {CDResponse, GeneratedGraph} from 'common/response/graph/graph.response';
import { initialize } from 'aurelia-pal-nodejs';

const CDT_GRAPH_REQUEST = 60;
const CDT_WAIT_MS_REQUEST = 5000;

export type SelectedMethods = {
  regression: boolean;
  stratification: boolean;
  matching: boolean;
  weighting: boolean;
  ivs: boolean;
  regDiscont: boolean;
  twoStageRegression: boolean;
  doubleMl: boolean;
};

export type SelectedCDAlgortihm = {
  algorithm: string;
}



export type ResultCDAlgorithm = {
  recovery:String;
  causal_discovery:String;
  status: number; //0 = loading, 1 = success, 2 = error
  graph?: String;
  score?: String ;
  msg?: String;
}

@inject(UploadService, GraphState, ResultsPage, GraphService)
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
  treatment: string | null = null;
  outcome: string | null = null;

  addCommonCauseCurrent: string | null;
  commonCauses: string[] = [];
  addIVCurrent: string | null;
  ivs: string[] = [];
  models = ["Lasso Regression", "Gradient Boosting Regression"];
  ivMethodInstrument: string | null = null;
  regDiscontVarName: string | null = null;
  modelY: string = this.models[0];
  modelT: string = this.models[0];
  modelFinal: string = this.models[0];
  selectPolynomialFeaturizer: boolean = false;
  polynomialDegree: string = "1";
  includeBias = false;

  causalDiscoveryAlgorithmsModels = ["ANM", "BivariateFit", "CDS", "IGCI", "RECI", "GES", "GIES", "LiNGAM"];
  skeletonRecoveryAlgoritms = ["ARD", "DecisionTreeRegression", "Glasso", "LinearSVRL2"];
  causalDiscovery: string;// = this.causalDiscoveryAlgorithmsModels[0];
  recovery: string;// = this.skeletonRecoveryAlgoritms[0];

  causalDiscoveryResults: ResultCDAlgorithm[] = [];
  causalDiscoveryEdgesId: String[] =[];
  initGraph: Boolean = false;



  /**
   * two last selected nodes, used to add an edge by clicking nodes intead of typing their names
   * from-to format
   */
  addEdgeSelectedNodes: [string, string | null] | null = null;

  // selected estimation methods
  selectedMethods: SelectedMethods = {
    regression: true,
    stratification: true,
    matching: true,
    weighting: true,
    ivs: true,
    regDiscont: true,
    twoStageRegression: true,
    doubleMl: true
  };

  // 0 - upload graph file
  // 1 - edit here (default)
  selectedGraphOption = 1;
  uploadFiles?: FileList;

  constructor(
    private uploadService: UploadService,
    private graphState: GraphState,
    private resultsPage: ResultsPage,
    private graphService: GraphService,
  ) {
    //
  }

 

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

  public downloadGraph() {
    if (Object.keys(this.graph).length == 0) {
      this.statusLine.setError('No graph is present');
      return;
    }
    const edges = [];
    const nodes = [];
    const data = this.graph.json();
    if (data.elements.nodes !== undefined) {
      for (const node of data.elements.nodes) {
        nodes.push({
          id: node.data.id
        });
      }
      if (data.elements.edges !== undefined) {
        for (const edge of data.elements.edges) {
          edges.push({
            source: edge.data.source,
            target: edge.data.target
          });
        }
      }
    }
    const graph = GraphUtil.graphFromNodesAndEdges(nodes, edges);
    const e = document.getElementById('graph-dl');
    let el;
    if (e == null) {
      el = document.createElement('a');
      el.id = 'graph-dl';
      el.target = '_blank';
      el.download = 'graph.gml';
    } else {
      el = e.getElementsByTagName('a')[0];
    }
    el.href = `data:text/csv;charset=utf-8,${encodeURI(graph)}`;
    el.click();
  }

  // TODO add new node, use existing node?
  public addCommonCause(): void {
    if (this.addCommonCauseCurrent != null && this.addCommonCauseCurrent.length > 0) {
      if (this.commonCauses.includes(this.addCommonCauseCurrent)) {
        this.statusLine.setError(`Common cause '${this.addCommonCauseCurrent}' already added`);
        return;
      }
      this.commonCauses.push(this.addCommonCauseCurrent);
    }
  }

  public removeCommonCause(name: string): void {
    const index = this.commonCauses.indexOf(name);
    this.commonCauses.splice(index, 1);
  }

  public setIVs(id: string) {
    this.graph.add({
      group: 'nodes',
      data: {id},
      position: {
        x: 0,
        y: 0
      }
    });
  }

  public addIV(): void {
    if (this.addIVCurrent != null && this.addIVCurrent.length > 0) {
      const node = this.graph.nodes(`[id = "${this.addIVCurrent}"]`);
      if (node.json() === undefined) {
        this.statusLine.setError(`Could not add IV '${this.addIVCurrent}', node is not in the graph`);
        return;
      }
      if (this.ivs.includes(this.addIVCurrent)) {
        this.statusLine.setError(`IV '${this.addIVCurrent}' already added`);
        return;
      }
      this.ivs.push(this.addIVCurrent);
    }
  }

  public removeIV(name: string): void {
    const index = this.ivs.indexOf(name);
    this.ivs.splice(index, 1);
  }

  public selectAllMethods() {
    this.selectedMethods = {
      regression: true,
      stratification: true,
      matching: true,
      weighting: true,
      ivs: true,
      regDiscont: true,
      twoStageRegression: true,
      doubleMl: true
    };
  }

  public deselectAllMethods() {
    this.selectedMethods = {
      regression: false,
      stratification: false,
      matching: false,
      weighting: false,
      ivs: false,
      regDiscont: false,
      twoStageRegression: false,
      doubleMl: false
    };
  }

  cdAlgorithmChanged(mathode: String){
    this.causalDiscovery;
  }
  recoveryAlgorithmChanges(){
    this.recovery;
  }

  private async processCausalDiscovery(){
    
    if(this.causalDiscovery == null || this.recovery == null )
    {
      this.statusLine.setError("Please choose both algorithms.")
      return;
    }
    
    if (this.graph == null) {
      this.statusLine.setError('No data found.');
      return;
    }

    
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


    await this.graphService.genereateGraph(this.causalDiscovery, this.recovery, GlobalState.dataFileDelimiter);

    for(let i = 0; i < CDT_GRAPH_REQUEST; i++) {
      var result = await this.graphService.checkCausalDiscoveryResults(this.causalDiscovery, this.recovery)  
      if (!((result as (SuccessResponse & { available: false })).available === false)) {
        break;
      }
      await this.waitMs(CDT_WAIT_MS_REQUEST);
    }

    if((result as (SuccessResponse & GeneratedGraph)).error) {
      //TODO ERROR MESSAGE.
      this.causalDiscoveryResults[entry].status = 1;
    }
    else {
      this.addGraph((result as (SuccessResponse & GeneratedGraph)).graph, entry);
    }
    //this.selectedGraphOption = 2
    return;
  }

  private async addGraph(graph: Buffer, entry: any) {
    
    var str_graph: String = graph.toString();
    console.log(str_graph);
    var temp:String = str_graph.split('\'')[1]
    var algorithm_used: String[] = temp.split('_');

    var lines = str_graph.split('__RESULT__\n')[1];

    this.causalDiscoveryResults[entry].graph = lines;
    this.causalDiscoveryResults[entry].status = 1;
    
  }

  private deleteEdgesInGraph(){
    
  }

  private loadGraph(cd_graph: String) {
      //TODO: make list whoch stores current edges in cd-graph. If this is not empty. Delete these edges: this.graph.edges(':selected').remove(); and add new ones.
      if(!this.initGraph){
        this.graph = cytoscape({
          container: this['graph'],
          elements: {
            nodes: GraphState.nodes,
            edges: GraphState.edges
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
        this.initGraph = true;
      }


    //this.graph.edges().remove()
    var edges:String[] = cd_graph.split('\n');
    for(var i = 0; i < this.causalDiscoveryEdgesId.length; i++){
      this.graph.edges(this.causalDiscoveryEdgesId[i]).remove();
    }
    this.causalDiscoveryEdgesId = [];

    for(var i:number = 0; i<edges.length; i++) {
      if(edges[i] == ""){
        continue;
      }
      var source:String = edges[i].split("->->->")[0];
      var target:String = edges[i].split("->->->")[1];
      this.causalDiscoveryEdgesId.push(source+"_"+target);
      this.graph.add({
        group: 'edges',
        data: {
          id: source+"_"+target,
          source: source,
          target: target,
          directed:true
        }
      });
    }

  }

  private async waitMs(ms: number): Promise<void> {
    await new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }


  private removeSelectedEdges() {
    this.graph.edges(':selected').remove();
  }

  private addEdge() {
    if (this.addEdgeSelectedNodes != null && this.addEdgeSelectedNodes[0] != null && this.addEdgeSelectedNodes[1] != null) {
      this.graph.add({
        group: 'edges',
        data: {
          id: `${this.addEdgeSelectedNodes[0]}_${this.addEdgeSelectedNodes[1]}`,
          source: this.addEdgeSelectedNodes[0],
          target: this.addEdgeSelectedNodes[1],
          directed: true
        }
      });
      return;
    }
    // no duplicate edges
    const existingEdge1 = this.graph.edges(`[source = "${this.addEdgeNodeIdFrom}"][target = "${this.addEdgeNodeIdTo}"]`)
    if (existingEdge1.json() !== undefined) {
      this.statusLine.setError('Edge already exists, cannot add a duplicate.');
      return;
    }
    const existingEdge2 = this.graph.edges(`[target = "${this.addEdgeNodeIdFrom}"][source = "${this.addEdgeNodeIdTo}"]`)
    if (existingEdge2.json() !== undefined) {
      this.statusLine.setError('Edge already exists, cannot add a duplicate.');
      return;
    }

    const nodeFrom = this.graph.nodes(`[id = "${this.addEdgeNodeIdFrom}"]`);
    if (nodeFrom.json() === undefined) {
      this.statusNodeNotFound(this.addEdgeNodeIdFrom);
      return;
    }
    const nodeTo = this.graph.nodes(`[id = "${this.addEdgeNodeIdTo}"]`);
    if (nodeTo.json() === undefined) {
      this.statusNodeNotFound(this.addEdgeNodeIdTo);
      return;
    }
    this.graph.add({
      group: 'edges',
      data: {
        id: `${this.addEdgeNodeIdFrom}_${this.addEdgeNodeIdTo}`,
        source: this.addEdgeNodeIdFrom,
        target: this.addEdgeNodeIdTo,
        directed: true
      }
    });
    this.statusLine.setStatus(`Added edge from '${this.addEdgeNodeIdFrom}' to '${this.addEdgeNodeIdTo}'`);
  }

  private linkCommonConfoundersToTreatmentAndOutcome() {
    if (this.treatment == null) {
      this.statusLine.setError('Treatment must be specified for this operation.');
      return;
    }
    if (this.outcome == null) {
      this.statusLine.setError('Outcome must be specified for this operation.');
      return;
    }
    for (const cc of this.commonCauses) {
      // confounder -> treatment
      this.graph.add({
        group: 'edges',
        data: {
          id: `${cc}_${this.treatment}`,
          source: cc,
          target: this.treatment,
          directed: true
        }
      });
      // confounder -> outcome
      this.graph.add({
        group: 'edges',
        data: {
          id: `${cc}_${this.outcome}`,
          source: cc,
          target: this.outcome,
          directed: true
        }
      });
    }
    this.statusLine.setStatus('idle');
  }

  private upload() {
    if (this.treatment == null) {
      this.statusLine.setError('You must specify the name of the treatment variable');
      return;
    }
    if (this.outcome == null) {
      this.statusLine.setError('You must specify the name of the outcome variable');
      return;
    }

    const selectedMethods: string[] = [];
    if (this.selectedMethods.regression) {
      selectedMethods.push('regression');
    }
    if (this.selectedMethods.stratification) {
      selectedMethods.push('stratification');
    }
    if (this.selectedMethods.matching) {
      selectedMethods.push('matching');
    }
    if (this.selectedMethods.weighting) {
      selectedMethods.push('weighting');
    }
    if (this.selectedMethods.ivs) {
      selectedMethods.push('instrumental variables');
    }
    if (this.selectedMethods.regDiscont) {
      selectedMethods.push('regression discontinuity');
    }
    if (this.selectedMethods.twoStageRegression) {
      selectedMethods.push('two stage regression');
    }

    if (this.selectedMethods.doubleMl) {
      selectedMethods.push('double ml');
    }

    ResultsPageState.clearResults();
    this.resultsPage.clearResults();
    ResultsPageState.shouldGetResults = true;
    // get needed data
    if (this.selectedGraphOption === 1) {
      const uploadData: IGraphUploadDto = {
        nodes: [],
        edges: [],
        variables: {
          treatment: this.treatment,
          outcome: this.outcome,
          commonCauses: this.commonCauses,
          ivs: this.ivs,
          ivMethodInstrument: this.ivMethodInstrument,
          regDiscontVarName: this.regDiscontVarName,
          modelY: this.modelY,
          modelT: this.modelT,
          modelFinal: this.modelFinal,
          selectPolynomialFeaturizer: this.selectPolynomialFeaturizer.toString(),
          includeBias: this.includeBias.toString(),
          polynomialDegree: this.polynomialDegree
        },
        selectedMethods: selectedMethods.join(','),
        delimiter: GlobalState.dataFileDelimiter,
      };
      const data = this.graph.json();
      if (data.elements.nodes !== undefined) {
        for (const node of data.elements.nodes) {
          uploadData.nodes.push({
            id: node.data.id
          });
        }
        if (data.elements.edges !== undefined) {
          for (const edge of data.elements.edges) {
            uploadData.edges.push({
              id: edge.data.id,
              source: edge.data.source,
              target: edge.data.target
            });
          }
        }
      }
      this.uploadService.uploadGraph(uploadData)
        .then(() => {
          this.statusLine.setStatus('Graph uploaded.');
        })
        .catch(err => {
          this.statusLine.setError(err);
        });
    } else {
      const uploadData: IExternalGraphFileUploadDto = {
        variables: {
          treatment: this.treatment,
          outcome: this.outcome,
          commonCauses: this.commonCauses,
          ivs: this.ivs,
          ivMethodInstrument: this.ivMethodInstrument,
          regDiscontVarName: this.regDiscontVarName,
          modelY: this.modelY,
          modelT: this.modelT,
          modelFinal: this.modelFinal,
          selectPolynomialFeaturizer: this.selectPolynomialFeaturizer.toString(),
          includeBias: this.includeBias.toString(),
          polynomialDegree: this.polynomialDegree
        },
        selectedMethods: selectedMethods.join(','),
        delimiter: GlobalState.dataFileDelimiter,
      };
      const file = this.uploadFiles[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('graphData', JSON.stringify(uploadData));
      this.uploadService.uploadGraphFile(formData)
        .then(() => {
          this.statusLine.setStatus('Graph uploaded.');
        })
        .catch(err => {
          this.statusLine.setError(err);
        });
    }
  }

  private statusNodeNotFound(node: string | null): void {
    if (node != null) {
      this.statusLine.setError(`Could not find node '${this.addEdgeNodeIdFrom}'`);
    } else {
      this.statusLine.setError('You must input a node name.');
    }
  }

  attached() {
    if (GlobalState.dataFileUploaded) {
      if (GraphState.data == null) {
        this.graph = cytoscape({
          container: this['graph'],
          elements: {
            nodes: GraphState.nodes,
            edges: GraphState.edges
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
      this.graph.on('select', e => {
        if (e.target[0].group() === 'nodes') {
          const id = e.target[0].data().id;
          if (this.addEdgeSelectedNodes == null) {
            this.addEdgeSelectedNodes = [id, null];
          } else if (this.addEdgeSelectedNodes[1] == null) {
            this.addEdgeSelectedNodes[1] = id;
          } else {
            this.addEdgeSelectedNodes[0] = this.addEdgeSelectedNodes[1];
            this.addEdgeSelectedNodes[1] = id;
          }
        }
      });
    }
    Object.assign(this.selectedMethods, GraphState.selectedMethods);
    // model data
    if (GraphState.modelData.treatment != null) {
      this.treatment = GraphState.modelData.treatment;
    }
    if (GraphState.modelData.outcome != null) {
      this.outcome = GraphState.modelData.outcome;
    }
    if (GraphState.modelData.commonCauses != null) {
      this.commonCauses = GraphState.modelData.commonCauses.slice(0);
    }
    if (GraphState.modelData.ivs != null) {
      this.ivs = GraphState.modelData.ivs.slice(0);
    }
  }


  detached() {
    if (Object.keys(this.graph).length > 0) {
      GraphState.data = this.graph.json();
    }
    Object.assign(GraphState.selectedMethods, this.selectedMethods);
    // model data
    GraphState.modelData.treatment = this.treatment;
    GraphState.modelData.outcome = this.outcome;
    GraphState.modelData.commonCauses = this.commonCauses.slice(0);
    GraphState.modelData.ivs = this.ivs.slice(0);
  }
}
