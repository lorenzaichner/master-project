# This is a sample Python script.

import csv
import sys
print("TestONE")
import pandas as pd
print("TestTwo")
import networkx as nx
print("TestThree")
import cdt
print("TestFour")
# Algorithm for ugraph recovery.
from cdt.independence.graph import ARD
from cdt.independence.graph import DecisionTreeRegression
from cdt.independence.graph import Glasso
from cdt.independence.graph import LinearSVRL2

# Pairwise Causality algorithm
from cdt.causality.pairwise import ANM
from cdt.causality.pairwise import BivariateFit
from cdt.causality.pairwise import CDS
from cdt.causality.pairwise import GNN
from cdt.causality.pairwise import IGCI
from cdt.causality.pairwise import Jarfo
from cdt.causality.pairwise import NCC
from cdt.causality.pairwise import RCC
from cdt.causality.pairwise import RECI

# Graph based Causality Algorithms (bnleanr)
from cdt.causality.graph import GS
from cdt.causality.graph import IAMB
from cdt.causality.graph import Fast_IAMB
from cdt.causality.graph import Inter_IAMB
from cdt.causality.graph import MMPC

# Graph based Causality Algorithms
from cdt.causality.graph import CAM
from cdt.causality.graph import CCDr
from cdt.causality.graph import CGNN
from cdt.causality.graph import GES
from cdt.causality.graph import GIES
from cdt.causality.graph import LiNGAM
from cdt.causality.graph import PC
from cdt.causality.graph import SAM
from cdt.causality.graph import SAMv1
print("Everything succesful imported.")

# cdt logging setup

def recoverSkeletton(data, graph_recovery):
    if (graph_recovery == "ARD"):
        return ARD().predict(data)
    elif (graph_recovery == "DecisionTreeRegression"):
        return DecisionTreeRegression().predict(data)
    elif (graph_recovery == "Glasso"):
        return cdt.utils.graph.remove_indirect_links(Glasso().predict(data), alg='aracne')
    elif (graph_recovery == "LinearSVRL2"):
        return LinearSVRL2().predict(data)
    else:
        return "Error: Skeletton Recovery Algorithm failed."


def processCausalDiscovery(data, ugraph, alg):
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
        return GES().predict(data, nx.Graph(ugraph))
    elif (alg == "GIES"):
        return GIES().predict(data, nx.Graph(ugraph))
    elif (alg == "LiNGAM"):
        return LiNGAM().predict(data)
    elif (alg == "PC"):
        return PC().predict(data, nx.Graph(ugraph))
        

def testSkeletonRecovery(data, graph_recovery, causal_discovery):
    graphs = {}
    for alg in graph_recovery:
        ugraph = recoverSkeletton(data, alg)
        ugraph = cdt.utils.graph.remove_indirect_links(ugraph, alg='aracne')
        graphs = testCausalDiscovery(data, ugraph, causal_discovery, alg, graphs)
    return graphs


def testCausalDiscovery(data, ugraph, causal_discovery, skelteon_recovery, graphs):
    for alg in causal_discovery:
        output = processCausalDiscovery(data, ugraph, alg)
        graphs[skelteon_recovery + "_" + alg] = output
    return graphs

if __name__ == '__main__':
    print("Test")
    #causal_discovery_logfile = open('logs/estimation_fails.log', 'w')
    #causal_discovery_logfile.write('---- Discovery method info (' + "Start" + ') ---\n\n\n')
    #causal_discovery_logfile.close()
    
    path = sys.argv[3]
    delimiter = sys.argv[4]

    # Currently implemented: "ARD", "DecisionTreeRegression", "Glasso", "LinearSVRL2"
    # Missing: "FSGNN", "HSICLasso"
    graph_recovery = [sys.argv[1]]

    # Currently implemented: "ANM", "BivariateFit", "CDS", "IGCI", "RECI", "GES", "GIES", "LiNGAM"
    # Missing:
    # Outsorted because takes too long: "GNN", "CGNN"
    # Outsorted beacause train set: "Jarfo", "NCC", "RCC",
    # Outsorted because of R error: "GS","IAMB", "Fast_IAMB", "Inter_IAMB","MMPC", "CAM","CCDr", "PC"
    # other error: "SAM", "SAMv1"
    causal_discovery = [sys.argv[2]]
    data = pd.read_csv(path, sep=delimiter)
    graphs = testSkeletonRecovery(data, graph_recovery, causal_discovery)
    print(graphs)
    ##pares Result
    result = "__RESULT__\n"
    for entry in graphs:
        node_id = 0
        for edge in graphs[entry].edges():
            result = result + str(edge[0]) + "->->->" + str(edge[1]) + "\n"
    print(result)

# See PyCharm help at https://www.jetbrains.com/help/pycharm/

