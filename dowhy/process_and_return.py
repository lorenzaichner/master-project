"""
This file processes the given data file and graph, returning the results - using the DoWhy library.
( see: Amit Sharma, Emre Kiciman, et al. DoWhy: A Python package for causal inference. 2019. https://github.com/microsoft/dowhy )
If an error occurs before reaching the results, it's message will be printed/returned at the end

To use this file, the following arguments need to be specified (in the given order)
 - path to the data file
 - data file separator
 - path to the graph file
 - JSON string, should contain the following keys:
    treatment; should be self-explanatory, this is the name of the treatment variable
    outcome; name of the outcome variable
    commonCauses (optional); a list containing names of all variables which represent common causes
    instrumentalVariables (optional); a list containing names of all variables which represent instrumental variables
 - a comma separated string containing the selected estimation methods, following estimation methods are currently supported:
    - regression
    - stratification
    - matching
    - weighting
    - instrumental variables
    - regression discontiunity
    - two stage regression
If any arguments are missing, or the "treatment"/"outcome" keys are not present, the program will exit and return an error.

NOTE/TODO: would probably be better if the last argument was a path to the file which would contain the mentioned data
"""

import numpy as np
import pandas as pd
import sys
import traceback
import json
import warnings
import logging
import dowhy
from math import isnan, isinf
from dowhy import CausalModel
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import LassoCV
from sklearn.ensemble import GradientBoostingRegressor

# dowhy logging setup
warnings.filterwarnings('ignore')
# disabled for now, causes problems because of the encoding
logging.basicConfig(filename='./logs/dowhy.log')
logging.getLogger("dowhy").setLevel(logging.ERROR)

def errorExit(message):
    raise Exception(message)

# TODO better err handling? (down below too)
argc = len(sys.argv)
if argc != 7:
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
    errorExit(errMessage)

# write exceptions with the traceback to a file
logfile = open('logs/py_script_exception.log', 'w')
estimation_method_fails_logfile = open('logs/estimation_fails.log', 'w')
# TODO probably ready for cleanup, logged by backend by reading stderr
# def except_hook(type, value, tback):
#     logfile.write('exception type: ' + str(type) + '\n')
#     logfile.write('exception value: ' + str(value) + '\n')
#     logfile.write('exception:\n')
#     traceback.print_tb(tback, None, logfile)
#     logfile.close()
#     sys.exit(3)
# sys.excepthook = except_hook


# estimation methods fails logged to separate file for now (sending exceptions to stderr will fill up the logs backend-side, won't be very readable)
def log_estimation_method_fail(method, e):
        estimation_method_fails_logfile.write('---- Estimation method fail (' + method + ') ---\n')
        traceback.print_exc(None, estimation_method_fails_logfile)
        estimation_method_fails_logfile.write('\n\n')

data_file_path = sys.argv[1]
data_file_separator = sys.argv[2]
graph_file_path = sys.argv[3]
model_data = sys.argv[4]
selected_methods_csv = sys.argv[5]
selected_methods_list = selected_methods_csv.split(',')

selected_methods_regression = 'regression' in selected_methods_list
selected_methods_stratification = 'stratification' in selected_methods_list
selected_methods_matching = 'matching' in selected_methods_list
selected_methods_weighting = 'weighting' in selected_methods_list
selected_methods_ivs = 'instrumental variables' in selected_methods_list
selected_methods_reg_discont = 'regression discontinuity' in selected_methods_list
selected_methods_two_stage_regression = 'two stage regression' in selected_methods_list
selected_methods_double_ml = 'double ml' in selected_methods_list

treatment = None
outcome = None
common_causes = []
ivs = []

model_data = json.loads(model_data)
treatment = model_data.get('treatment')
outcome = model_data.get('outcome')
common_causes = model_data.get('commonCauses', [])
ivs = model_data.get('ivs', [])
ivMethodInstrument = model_data.get('ivMethodInstrument')
regDiscontVarName = model_data.get('regDiscontVarName')
model_y = model_data.get('modelY')
model_t = model_data.get('modelT')
model_final = model_data.get('modelFinal')
use_polynomial_features = model_data.get('selectPolynomialFeaturizer')
polynomial_degree = int(model_data.get('polynomialDegree'))
include_bias = model_data.get('includeBias').lower() == 'true' if model_data.get('featurizer_bias') is not None else False


def getModel(model_str):
    if model_str == 'Lasso Regression':
        return LassoCV()
    else:
        return GradientBoostingRegressor()

if treatment == None or outcome == None:
    errorExit('"treatment" or "outcome" are not in the JSON file')

dataframe = pd.read_csv(data_file_path, sep=data_file_separator)
model = CausalModel(
    data=dataframe,
    treatment=treatment,
    outcome=outcome,
    graph=graph_file_path,
    common_causes=common_causes,
    instruments=ivs
)

identified_estimand = model.identify_effect(proceed_when_unidentifiable=True)

# for ATE Try the 6 estimation methods described at 'https://microsoft.github.io/dowhy/example_notebooks/dowhy_estimation_methods.html' and save/return the results
r_regression = None
r_stratification = None
r_matching = None
r_weighting = None
r_iv = None
r_reg_discont = None
# two stage regression will be used for NDE & NIE
r_nde = None
r_nie = None
r_double_ml = None

# contains estimation results
est_results = {}

# ============== 1) Regression =====================================
if selected_methods_regression == True:
    try:
        causal_estimate_regression = model.estimate_effect(identified_estimand,
                method_name="backdoor.linear_regression",
                test_significance=True)
        r_regression = causal_estimate_regression.value
    except Exception as e:
        print('[FAIL] REGRESSION')
        log_estimation_method_fail('REGRESSION', e)

# ============== 2) Stratification =================================
if selected_methods_stratification == True:
    try:
        causal_estimate_strat = model.estimate_effect(identified_estimand,
                                                    method_name="backdoor.propensity_score_stratification",
                                                    target_units="att")
        r_stratification = causal_estimate_strat.value
    except Exception as e:
        print('[FAIL] STRATIFICATION')
        log_estimation_method_fail('STRATIFICATION', e)



# ============== 3) Matching =======================================
if selected_methods_matching == True:
    try:
        causal_estimate_match = model.estimate_effect(identified_estimand,
                                                    method_name="backdoor.propensity_score_matching",
                                                    target_units="atc")
        r_matching = causal_estimate_match.value
    except Exception as e:
        print('[FAIL] MATCHING')
        log_estimation_method_fail('MATCHING', e)


# ============== 4) Weighting ======================================
if selected_methods_weighting == True:
    try:
        causal_estimate_ipw = model.estimate_effect(identified_estimand,
                                                    method_name="backdoor.propensity_score_weighting",
                                                    target_units = "ate",
                                                    method_params={"weighting_scheme":"ips_weight"})
        r_weighting = causal_estimate_ipw.value
    except Exception as e:
        print('[FAIL] WEIGHTING')
        log_estimation_method_fail('WEIGHTING', e)


# ============== 5) Instrumental variable ==========================
# TODO 'iv_instrument_name' is hardcoded - fix this
if selected_methods_ivs == True:
    try:
        causal_estimate_iv = model.estimate_effect(identified_estimand,
                method_name="iv.instrumental_variable", method_params = {'iv_instrument_name': ivMethodInstrument})
        r_iv = causal_estimate_iv.value
    except Exception as e:
        print('[FAIL] IV')
        log_estimation_method_fail('IV', e)


# ============== 6) Regression Discontinuity =======================
# TODO 'rd_variable_name' is hardcoded - fix this
if selected_methods_reg_discont == True:
    try:
        causal_estimate_regdist = model.estimate_effect(identified_estimand,
                method_name="iv.regression_discontinuity",
                method_params={'rd_variable_name':regDiscontVarName,
                            'rd_threshold_value':0.5,
                            'rd_bandwidth': 0.1})
        r_reg_discont = causal_estimate_regdist.value
    except Exception as e:
        print('[FAIL] REGRESSION DISCONTINUITY')
        log_estimation_method_fail('REGRESSION DISCONTINUITY', e)

# NDE & NIE
if selected_methods_two_stage_regression == True:
    # try NDE, then NIE
    try:
        identified_estimand = model.identify_effect(proceed_when_unidentifiable=True, estimand_type='nonparametric-nde')
        causal_estimate_two_stage_regression = model.estimate_effect(
            identified_estimand,
            method_name='mediation.two_stage_regression',
            confidence_intervals=False,
            test_significance=False,
            method_params = {
                'first_stage_model': dowhy.causal_estimators.linear_regression_estimator.LinearRegressionEstimator,
                'second_stage_model': dowhy.causal_estimators.linear_regression_estimator.LinearRegressionEstimator
            }
        )
        r_nde = causal_estimate_two_stage_regression.value
    except Exception as e:
        print('[FAIL] Two stage regression (NDE)')
        log_estimation_method_fail('Two stage regression (NDE)', e)

    try:
        identified_estimand = model.identify_effect(proceed_when_unidentifiable=True, estimand_type='nonparametric-nie')
        causal_estimate_two_stage_regression = model.estimate_effect(
            identified_estimand,
            method_name='mediation.two_stage_regression',
            confidence_intervals=False,
            test_significance=False,
            method_params = {
                'first_stage_model': dowhy.causal_estimators.linear_regression_estimator.LinearRegressionEstimator,
                'second_stage_model': dowhy.causal_estimators.linear_regression_estimator.LinearRegressionEstimator
            }
        )
        r_nie = causal_estimate_two_stage_regression.value
    except Exception as e:
        print('[FAIL] Two stage regression (NIE)')
        log_estimation_method_fail('Two stage regression (NIE)', e)

if selected_methods_double_ml == True:
    try:
        feature_transformer = None
        if use_polynomial_features == True:
            feature_transformer = PolynomialFeatures(degree=polynomial_degree, include_bias=include_bias)
        method_params_obj = {"init_params":{'model_y':getModel(model_y),
                                                                      'model_t': getModel(model_t),
                                                                      "model_final":getModel(model_final),
                                                                      'featurizer':feature_transformer},
                                                       "fit_params":{}}
        casual_estimate_double_ml = model.estimate_effect(identified_estimand, method_name="backdoor.econml.dml.DML",
                                     control_value = 0,
                                     treatment_value = 1,
                                 confidence_intervals=False,
                                method_params=method_params_obj)
        r_double_ml = casual_estimate_double_ml.value
    except Exception as e:
        print('[FAIL] DOUBLE ML')
        log_estimation_method_fail('DOUBLE ML', e)

def getCleanResult(value):
    if value != None and not isnan(value) and not isinf(value):
        return value
    return None

est_results['regression'] = getCleanResult(r_regression)
est_results['stratification'] = getCleanResult(r_stratification)
est_results['matching'] = getCleanResult(r_matching)
est_results['weighting'] = getCleanResult(r_weighting)
est_results['iv'] = getCleanResult(r_iv)
est_results['regDiscont'] = getCleanResult(r_reg_discont)
est_results['nde'] = getCleanResult(r_nde)
est_results['nie'] = getCleanResult(r_nie)
est_results['doubleMl'] = getCleanResult(r_double_ml)
print('RESULT_' + json.dumps(est_results))
logfile.close()
estimation_method_fails_logfile.close()
