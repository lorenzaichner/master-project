import dowhy
import dowhy.datasets
import sys
import warnings
import logging


argc = len(sys.argv)
if argc != 5:
    errMessage = """
    Wrong number of params
    """
    raise Exception(errMessage)

# extract params


file_path = sys.argv[1]
beta = int(sys.argv[2])
num_common_causes = int(sys.argv[3])
num_samples = int(sys.argv[4])

data = dowhy.datasets.linear_dataset(
    beta=beta,
    num_common_causes=num_common_causes,
    num_instruments=2,
    num_samples=num_samples,
    treatment_is_binary=True)

data['df'].to_csv(file_path, index=False)
