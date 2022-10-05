# This is a sample Python script.
import csv
import sys

import cdt.independence.graph
# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.
from cdt.causality.pairwise import ANM

from sklearn.datasets import load_boston
import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt
from cdt.independence.graph import ARD
from cdt.data import load_dataset


# Use a breakpoint in the code line below to debug your script.

def CausalDiscovery(path,causal_discovery,graph_recovery,skeleton, directed_sceleton):
    CDAlgorithm = getPairwiseCausalityAlgorithm(causal_discovery)
    data, graph = load_data_and_skeletton(path, graph_recovery, skeleton, directed_sceleton)
    output = CDAlgorithm.orient_graph(data, nx.DiGraph(graph))
    nx.draw_networkx(output, font_size=8)
    plt.show()

def CausalDiscoveryJustPredict(path, cd_algorithm):
    CDAlgorithm = ANM()
    data = pd.read_csv(path, sep=";")
    #data, graph = cdt.data.load_dataset('sachs')
    print(data)
    output = CDAlgorithm.predict(data)
    nx.draw_networkx(output, font_size=8)
    plt.show()

def getPairwiseCausalityAlgorithm(cd_algorithm):
    if(cd_algorithm == "ANM"):
        return cdt.causality.pairwise.ANM
    return "error"

def load_data_and_skeletton(path, graph_recovery, skeleton, directed_skeleton):
    data_ = pd.read_csv(path, sep=',')
    #boston = load_boston()
    #data_ = pd.DataFrame(boston['data'])
    graph: list
    if(skeleton):
        graph = recoverSkeletton(data_, directed_skeleton)
    print(graph)
    print("Graph Created")
    recoery_algorithm = getGraphCausalityAlgorithm(graph_recovery)
    output = recoery_algorithm.predict(data_,graph)
    nx.draw_networkx(output, font_size=8)
    plt.show()
    return (data_, skeleton)

def recoverSkeletton(data,directedSceleton):
    if(directedSceleton):
        return ""
    else:
        graph = ARD().predict(data)
        return graph


def getGraphCausalityAlgorithm(graph_recovery):
    if(graph_recovery == "FSGNN"):
        return cdt.independence.graph.FSGNN()
    elif(graph_recovery == "Glasso"):
        return cdt.independence.graph.Glasso()
    elif(graph_recovery == "CGNN"):
        return cdt.causality.graph.CGNN()
    return "Error"

def ANMAlgoTheirData():
    data, graph = cdt.data.load_dataset('sachs')
    print(data.head())
    glasso = cdt.independence.graph.Glasso()
    skeleton = glasso.predict(data)
    print(skeleton)
    new_skeleton = cdt.utils.graph.remove_indirect_links(skeleton, alg='aracne')
    model = cdt.causality.graph.GES()
    output_graph = model.predict(data, new_skeleton)
    print(nx.adjacency_matrix(output_graph).todense())




# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    path = "/home/lorenz/Documents/Bachelor/master-project/Datasets/sachs.csv"
    graph_recovery = "CGNN"
    causal_discovery = "ANM"

    skeleton = 1
    directed_sceleton = 0
    CausalDiscovery(path,causal_discovery,graph_recovery,skeleton, directed_sceleton)

# See PyCharm help at https://www.jetbrains.com/help/pycharm/
