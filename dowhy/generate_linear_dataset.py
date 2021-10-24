"""
Example usage:
python3 generate_linear_dataset.py test.dat 10 5 10 0 0 1 0 true false 0 0 0 false
"""
import dowhy
import dowhy.datasets
import sys

argc = len(sys.argv)
if argc != 15:
    errMessage = """
    Wrong number of params
    """
    raise Exception(errMessage)

# extract params
file_path = sys.argv[1]
beta = int(sys.argv[2])
num_common_causes = int(sys.argv[3])
num_samples = int(sys.argv[4])
num_instruments = int(sys.argv[5])
num_effect_modifiers = int(sys.argv[6])
num_treatments = int(sys.argv[7])
num_frontdoor_variables = int(sys.argv[8])
treatment_is_binary = sys.argv[9].lower() == 'true'
outcome_is_binary = sys.argv[10].lower() == 'true'
num_discrete_common_causes = int(sys.argv[11])
num_discrete_instruments = int(sys.argv[12])
num_discrete_effect_modifiers = int(sys.argv[13])
one_hot_encode = sys.argv[14].lower() == 'true'

data = dowhy.datasets.linear_dataset(
    beta=beta,
    num_common_causes=num_common_causes,
    num_instruments=2,
    num_samples=num_samples,
    treatment_is_binary=True)

data['df'].to_csv(file_path, index=False)
