"""
Example usage: 
python3 generate_xy_dataset.py test.csv 10 1 true false 1
"""
import dowhy
import dowhy.datasets
import sys


argc = len(sys.argv)
if argc != 7:
    errMessage = """
    Wrong number of params. Found : {}, expected: 7.
    """.format(argc)
    raise Exception(errMessage)

# extract params
file_path = sys.argv[1]
num_samples = int(sys.argv[2])
num_common_causes = int(sys.argv[3])
effect = sys.argv[4].lower() == 'true'
is_linear = sys.argv[5].lower() == 'true'
sd_error = float(sys.argv[6])


data = dowhy.datasets.xy_dataset(num_samples, effect,
        num_common_causes,
        is_linear,
        sd_error)
data['df'].to_csv(file_path, index=False)
