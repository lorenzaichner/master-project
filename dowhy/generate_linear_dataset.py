import dowhy
import dowhy.datasets
import sys
import warnings
import logging


argc = len(sys.argv)
if argc != 5:
    errMessage = """
    Invalid arguments, following are needed
    - path to the data file
    - data file separator
    - path to the graph file
    - JSON string, should contain the following keys:
        treatment; should be self-explanatory, this is the name of the treatment variable
        outcome; name of the outcome variable
        commonCauses (optional); a list containing names of all variables which represent common causes
        instrumentalVariables (optional); a list containing names of all variables which represent instrumental variables
        ivMethodInstrument (optional); name of the instrument variable to use, if the IV method is enabled
        regDiscontVarName (optional); similar as for IV, but it is meant for the regression discontinuity method
    - a comma separated string containing the selected estimation methods, following estimation methods are currently supported:
        - regression
        - stratification
        - matching
        - weighting
        - instrumental variables
        - regression discontiunity
        - two stage regression
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
