# export_model.py - Eshika
# training the final model on ALL 24 people n saving it for the server
# running it from the ml folder:  python export_model.py
# so this will gen the file activity_model.pkl
# and then storing the model in backend/models/ folder from where we will be using this model to predict movements
 
'''
so what is happening here is that:
- evaluate.py was only for testing (24 rounds, each without 1 person).. it doesnt keep any model
- now that random forest won, i will train it 1 last time on everyone, bcoz more people measn better for new players
- same settings as in evaluate.py so the score we report belongs to this model!!!
- saving the model along with the details the server would need like class names, feature names (plusss order matters!!!),
window size n the sklearn version. if the server has a diff sklearn version it can break
sooo everyone needs to scikit-learn==1.9.1 from req txt file
- joblib compress=3 makes the file much smaller (but still getting almost 2 MB) so it can live in github n go to az
ref1: https://scikit-learn.org/stable/model_persistence.html
ref2: https://joblib.readthedocs.io/en/stable/generated/joblib.dump.html
'''
 
import os
 
import joblib
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
 
from features import FEATURE_NAMES, WINDOW_SIZE
 
table = pd.read_csv(os.path.join('data', 'windows.csv'))
X = table[FEATURE_NAMES].values
y = table['label'].values
 
# same settings as in evaluate.py, but now training on all 24 people
model = RandomForestClassifier(n_estimators=100, min_samples_leaf=5, random_state=0, n_jobs=-1)
model.fit(X, y)
 
# creating 1 dict with the model and everything the server would need to use it correctly
model_info = {
    'model': model,
    'classes': list(model.classes_),
    'feature_names': FEATURE_NAMES,
    'window_size': WINDOW_SIZE,
    'trained_on': 'MotionSense, 24 people, phone in front pocket, 50 Hz',
    # the server must alsooo use the same version!!!
    'sklearn_version': sklearn.__version__,
}
 
os.makedirs(os.path.join('..', 'backend', 'models'), exist_ok=True)
path = os.path.join('..', 'backend', 'models', 'activity_model.pkl')
joblib.dump(model_info, path, compress=3)
 
size_mb = os.path.getsize(path) / 1_000_000
print('Classes:', model_info['classes'])
print('Saved', path, '-', round(size_mb, 1), 'MB')


# after running this file, i am storing the file to the necessary loc which is backend/models/ 
# so that we can furhter use it for predicting movements from there on..