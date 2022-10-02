# This is a sample Python script.
import csv
import sys

import cdt.independence.graph
# Press Shift+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.
from cdt.causality.pairwise import ANM
from cdt.causality.pairwise import BivariateFit
from cdt.causality.pairwise import CDS
from cdt.causality import graph
from cdt.data import AcyclicGraphGenerator

import pandas as pd
import networkx as nx
import matplotlib.pyplot as plt
from cdt.data import load_dataset


# Use a breakpoint in the code line below to debug your script.

def CausalDiscovery(path, cd_algorithm, graph_recovery):
    CDAlgorithm = getCDAlgortihm(cd_algorithm)
    data, graph = load_data_and_skeletton(path, graph_recovery)
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

def getCDAlgortihm(cd_algorithm):
    if(cd_algorithm == "ANM"):
        return cdt.causality.pairwise.ANM
    return "error"

def load_data_and_skeletton(path, graph_recovery):
    data_ = pd.read_csv(path, sep=',')
    if(graph_recovery == "basic"):
        skeleton = cdt.causality.graph.bnlearn.BNlearnAlgorithm.create_graph_from_data(data= data_)
        return (data, skeleton)
    recoery_algorithm = getSkeletonRecoveryAlgorithm(graph_recovery)
    skeleton = recoery_algorithm.predict(pd.DataFrame(data_))
    return (data_, skeleton)

def getSkeletonRecoveryAlgorithm(graph_recovery):
    if(graph_recovery == "FSGNN"):
        return cdt.independence.graph.FSGNN()
    elif(graph_recovery == "Glasso"):
        return cdt.independence.graph.Glasso()
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
    graph_recovery = "basic"
    causal_discovery = "ANM"
    CausalDiscovery(path,causal_discovery,graph_recovery)
# See PyCharm help at https://www.jetbrains.com/help/pycharm/
