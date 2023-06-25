# This is a sample Python script.

import csv
import sys
import pandas as pd
import networkx as nx
import cdt
import itertools
import numpy as np
from cdt.data import load_dataset

# Algorithm for ugraph recovery.
from cdt.independence.graph import ARD
from cdt.independence.graph import DecisionTreeRegression
from cdt.independence.graph import Glasso
from cdt.independence.graph import LinearSVRL2

#Skeleton recovery independence.stats
from cdt.independence.stats import KendallTau

# Pairwise Causality algorithm
from cdt.causality.pairwise import ANM
from cdt.causality.pairwise import BivariateFit
from cdt.causality.pairwise import CDS
from cdt.causality.pairwise import IGCI
from cdt.causality.pairwise import RECI

# Graph based Causality Algorithms
from cdt.causality.graph import GES
from cdt.causality.graph import GIES
from cdt.causality.graph import LiNGAM
from cdt.causality.graph import PC
from cdt.causality.graph import CGNN

# cdt logging setup

def recoverSkeletton(data, graph_recovery):
    if (graph_recovery == "ARD"):
        skeleton = ARD().predict(data)
    elif (graph_recovery == "DecisionTreeRegression"):
        skeleton = DecisionTreeRegression().predict(data)
    elif (graph_recovery == "Glasso"):
        skeleton = Glasso().predict(data)
    elif (graph_recovery == "LinearSVRL2"):
        skeleton = LinearSVRL2().predict(data,C=0.04)
    elif (graph_recovery == "KendallTau"):
        columns = data.columns
        filtered_graph = nx.Graph()
        for col1, col2 in itertools.combinations(columns, 2):
            a = data[col1].values
            b = data[col2].values
            distance = KendallTau().predict(a, b)
            if abs(distance) >= 0.1:
                filtered_graph.add_edge(col1, col2)
        return filtered_graph
    else:
        return "Error: Skeletton Recovery Algorithm failed."
    return skeleton

def processCausalDiscovery(skelteon_recovery, data, ugraph, alg, dataType, useGraph):
    if (alg == "ANM"):
        return ANM().orient_graph(data, nx.DiGraph(ugraph))
    elif (alg == "BivariateFit"):
        return BivariateFit().orient_graph(data, nx.Graph(ugraph))
    elif (alg == "CDS"):
        return CDS().orient_graph(data, nx.Graph(ugraph))
    elif (alg == "IGCI"):
        return IGCI().orient_graph(data, nx.Graph(ugraph))
    elif (alg == "RECI"):
        return RECI().orient_graph(data, nx.Graph(ugraph))
    elif (alg == "GES"):
        if (dataType == 'Continious'):
            ges_algorithm = GES(score='obs')
            return ges_algorithm.predict(data, nx.Graph(ugraph))
        if (dataType == 'Categorical'):
            ges_algorithm = GES(score='int')
            return ges_algorithm.predict(data, nx.Graph(ugraph))
    elif (alg == "GIES"):
        if (dataType == 'Continious'):
            gies_algorithm = GIES(score='obs')
            return gies_algorithm.predict(data, nx.Graph(ugraph))
        if (dataType == 'Categorical'):
            gies_algorithm = GIES(score='int')
            return gies_algorithm.predict(data, nx.Graph(ugraph))
    elif (alg == "LiNGAM"):
        return LiNGAM().predict(data)
    elif (alg == "PC"):
        if (useGraph):
            print("Use Graph of PC")
            return PC().predict(data)
        else:
            print("Use generated graph")
            return PC().predict(data, nx.Graph(ugraph))

def skeletonRecovery(data, graph_recovery, causal_discovery, dataType, useGraph):
    graphs = {}
    for alg in graph_recovery:
        ugraph = ""
        if not useGraph:
            ugraph = recoverSkeletton(data, alg)
            print(ugraph.edges())
            #ugraph = cdt.utils.graph.remove_indirect_links(ugraph, alg='aracne')
            graphs = {}
        graphs = causalDiscovery(data, ugraph, causal_discovery, alg, graphs, dataType, useGraph)
    return graphs


def causalDiscovery(data, ugraph, causal_discovery, skelteon_recovery, graphs, dataType, useGraph):
    for alg in causal_discovery:
        output = processCausalDiscovery(skelteon_recovery, data, ugraph, alg, dataType, useGraph)
        print(output.number_of_edges())
        graphs[skelteon_recovery + "_" + alg] = output
    return graphs

def apply_threshold(data, skeleton):
    threshold = 0.5
    filtered_graph = nx.Graph()
    filtered_graph.add_nodes_from(skeleton.nodes())
    
    for edge in skeleton.edges():
        var1, var2 = edge
        correlation = np.corrcoef(data[var1], data[var2])[0, 1]
        if abs(correlation) >= threshold:
            filtered_graph.add_edge(var1, var2)
            print(filtered_graph.edges())
    return filtered_graph
    
    
if __name__ == '__main__':
    print(f"{cdt.SETTINGS.GPU} with number jobs: {cdt.SETTINGS.NJOBS}")
    path = sys.argv[3]
    delimiter = sys.argv[4]
    graph_recovery = [sys.argv[1]]
    causal_discovery = [sys.argv[2]]
    dataType = ""
    useGraph = False
    if causal_discovery[0] == 'PC':
        if(sys.argv[6] == "true"):
            useGraph = True
        elif(sys.argv[6] == "flase"):
            useGraph = False
        
    if causal_discovery[0] == 'GES' or causal_discovery[0] == 'GIES':
        dataType = sys.argv[5]

    data = pd.read_csv(path, sep=delimiter)
    graphs = skeletonRecovery(data, graph_recovery, causal_discovery, dataType, useGraph)

##pares Result
    result = "__RESULT__\n"
    for entry in graphs:
        node_id = 0
        for edge in graphs[entry].edges():
            result = result + str(edge[0]) + "->->->" + str(edge[1]) + "\n"
    print(result)

# See PyCharm help at https://www.jetbrains.com/help/pycharm/

