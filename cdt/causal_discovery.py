# This is a sample Python script.
import csv
import sys

import cdt.independence.graph
# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.
# Algorithm for ugraph recovery.
from cdt.independence.graph import ARD
from cdt.independence.graph import DecisionTreeRegression
from cdt.independence.graph import FSGNN
from cdt.independence.graph import Glasso
from cdt.independence.graph import HSICLasso
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

from cdt.metrics import (precision_recall, SHD)
import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt


# Use a breakpoint in the code line below to debug your script.

def recoverSkeletton(data, graph_recovery):
    if (graph_recovery == "ARD"):
        return ARD().predict(data)
    elif (graph_recovery == "DecisionTreeRegression"):
        return DecisionTreeRegression().predict(data)
    elif (graph_recovery == "FSGNN"):  # FSGNN Takes very long to calculate skeleton if dataset is large
        return FSGNN(train_epochs=5, test_epochs=1).predict(data)
    elif (graph_recovery == "Glasso"):
        return cdt.utils.graph.remove_indirect_links(Glasso().predict(data), alg='aracne')
    elif (graph_recovery == "HSICLasso"):
        return HSICLasso().predict(data)  # Takes very long to calculate skeleton if dataset is large
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
    elif (alg == "GNN"):
        return GNN().orient_graph(data, nx.Graph(ugraph))
    elif (alg == "IGCI"):
        return IGCI().orient_graph(data, nx.Graph(ugraph))
    elif (alg == "Jarfo"):
        return Jarfo().orient_graph(data, nx.Graph(ugraph))  # TODO needs train set (to implement)
    elif (alg == "NCC"):
        return NCC().orient_graph(data, nx.Graph(ugraph))
    elif (alg == "RCC"):
        return RCC().orient_graph(data, nx.DiGraph(ugraph))
    elif (alg == "RECI"):
        return RECI().orient_graph(data, nx.Graph(ugraph))
    elif (alg == "GS"):
        return GS().predict(data, nx.Graph(ugraph))
    elif (alg == "IAMB"):
        return IAMB().predict(data, nx.Graph(ugraph))
    elif (alg == "Fast_IAMB"):
        return Fast_IAMB().predict(data, nx.Graph(ugraph))
    elif (alg == "Inter_IAMB"):
        return Inter_IAMB().predict(data, nx.Graph(ugraph))
    elif (alg == "MMPC"):
        return MMPC().predict(data, nx.Graph(ugraph))
    elif (alg == "CAM"):
        return CAM().predict(data)
    elif (alg == "CCDr"):
        return CCDr().predict(data)
    elif (alg == "CGNN"):
        return CGNN().predict(data, nx.Graph(ugraph))
    elif (alg == "GES"):
        return GES().predict(data, nx.Graph(ugraph))
    elif (alg == "GIES"):
        return GIES().predict(data, nx.Graph(ugraph))
    elif (alg == "LiNGAM"):
        return LiNGAM().predict(data)
    elif (alg == "PC"):
        return PC().predict(data, nx.Graph(ugraph))
    elif (alg == "SAM"):
        return SAM().predict(data, nx.Graph(ugraph))
    elif (alg == "SAMv1"):
        return SAMv1().predict(data, nx.Graph(ugraph))


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
        nx.draw_networkx(output, font_size=8)
        plt.title("Skeletton recovery:" + skelteon_recovery + "\nCausal Discovery:" + alg)
        plt.savefig("/home/lorenz/Documents/Bachelor/plots/" + skelteon_recovery + "____" + alg + ".jpg")
        plt.close()
    return graphs


def metric(graphs):
    metrics = {}
    for key_1 in graphs:
        for key_2 in graphs:
            if (key_1 == key_2):
                continue
            metrics[key_1 + " vs " + key_2] = [metric(graphs[key_1], graphs[key_2]) for metric in
                                               (precision_recall, SHD)]
    with open("/home/lorenz/Documents/Bachelor/plots/metrics.txt", 'w') as f:
        f.write(str(metrics))
    return


# Press the green button in the gutter to run the script.
if __name__ == '__main__':

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

