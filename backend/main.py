# main.py - made by Alex 
# adding model loading and /predict -Eshika
# this is our MotionQuest server.. when the website sends 128 readings, this will send back which activity it is
# run it from the backend folder:  uvicorn main:app --reload
# the 9.81 and gravity notes are reused from my ind asnmt 1 task 4 stairs

'''
now how /predict will be working:
- the website (pocket mode) collects the last 2.56 sec = 128 readings n POSTs them here once a sec
- BUT the website's nos are not in the same units as MotionSense what the model learned from:
phone gives acc in m/s² but our model wants g which is divide by 9.81
(same 9.81 as in assignment 1 task 4: when standing still the magnitude just sits at gravity 9.81..
but here we use acc WITHOUT gravity, so a still phone gives nos close to 0, not 9.81)
- phone gives gyro in deg per sec but model wants rad per sec
n the browser's acc points the OTHER way vs MotionSense, so what i can do is that i flip it (SIGN = -1)
- and to double check this on a new phone use the flat test on the Sensors page
- then the SAME make_features as in ml/ (features.py which i simply copied here from ml) -> 40 nos -> model -> chances for each activity
- the most likely one = the answer, aannnddd its chance = how sure the model is (basically the confidence of model)
 
problems i thought about:
- loading the model on every request would be super slow (2 MB file) so it can be loaded only ONCE when the server starts
- if the model file is missing the server should still start (so /health works) but /predict says 503
- if the website sends the wrong no of readings then 400 with a clear msg instead of crashing
ref1: https://fastapi.tiangolo.com/tutorial/body/
ref2: https://fastapi.tiangolo.com/tutorial/handling-errors/
ref3: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html (predict_proba)
'''


import math
import os
 
import joblib
from pydantic import BaseModel
from features import WINDOW_SIZE, make_features

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title='MotionQuest API')
 
# CORS: the list of websites that are allowed to call this server from a browser

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'https://team12-motionquest.github.io'],
    allow_methods=['*'],
    allow_headers=['*'],
)
 
# loading the trained model onnlllyyyy ONCE when the server starts
# __file__ = this file, so the path works no matter which folder the server is started from (azure!!!)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'activity_model.pkl')
if os.path.exists(MODEL_PATH):
    model_info = joblib.load(MODEL_PATH)
else:
    model_info = None
 
# the website's acc points the opp way to MotionSense so flipping it
# checking this again with flat test o Sensors page if a new phone gives weird results
SIGN = -1
 
 
# what the website will send is 1 window of 128 readings but in the website's units
# pydantic will check the types for us.. if something is not a list of nos, fastapi says 422 by itself
# ref: https://docs.pydantic.dev/latest/concepts/models/
class Window(BaseModel):
    # accel without gravity in m/s²
    lx: list[float]
    ly: list[float]
    lz: list[float]
    # rotation speed in deg per sec
    gx: list[float]
    gy: list[float]
    gz: list[float]
 
 
@app.get('/')
def home():
    return {'message': 'MotionQuest server is running. Try /health or /docs'}

@app.get('/health')
def health():
    # a quick "are you alive?" check, plus whether the model loaded or not
    if model_info is None:
        return {'status': 'ok', 'model_loaded': False}
    return {'status': 'ok', 'model_loaded': True, 'classes': model_info['classes']}
 
 
@app.post('/predict')
def predict(window: Window):
    if model_info is None:
        raise HTTPException(status_code=503, detail='The model file is missing.')
 
    # every axis needs exactly 128 readings else the features would mean something diff
    for values in [window.lx, window.ly, window.lz, window.gx, window.gy, window.gz]:
        if len(values) != WINDOW_SIZE:
            raise HTTPException(status_code=400, detail='Send exactly 128 readings for every axis.')
 
    # changing the website's units into the units the model learned:
    # m/s² -> g (divide by 9.81) n flip, deg per sec to rad per sec
    acc = []
    gyro = []
    for i in range(WINDOW_SIZE):
        acc.append([SIGN * window.lx[i] / 9.81, SIGN * window.ly[i] / 9.81, SIGN * window.lz[i] / 9.81])
        gyro.append([math.radians(window.gx[i]), math.radians(window.gy[i]), math.radians(window.gz[i])])

    features = make_features(acc, gyro)
 
    # asking the model how likely each activity is, then picking the most likely one
    model = model_info['model']
    # predict_proba wants a LIST of windows, so [features].. n [0] = the answer for our only window
    chances = model.predict_proba([features])[0]
    best = chances.argmax()
 
    return {
        # str() n float() bcoz numpy types cant be turned into json
        'activity': str(model.classes_[best]),
        'confidence': round(float(chances[best]), 3),
    }
