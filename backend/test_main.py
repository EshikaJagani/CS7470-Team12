# Automatic tests for the server - made by Alex
# Run them from the backend folder: pytest
# for running this, simply give pytest command in backend folder.. 
# currently i am getting 3 passed with 1 warning so this is looking good for now -Eshika

from fastapi.testclient import TestClient
from main import app

# a pretend browser that talks to our server without starting it
client = TestClient(app)

def test_home_page_works():
    response = client.get('/')
    assert response.status_code == 200

def test_health_says_ok():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'

# adding test for model and will add other tests later on 
# as this is wont affect our other code and this is not prior too -Eshika
def test_model_is_loaded():
    # if this fails: the model file is missing.. run ml/export_model.py n git pull
    assert client.get('/health').json()['model_loaded'] is True

def test_predict_returns_five_chances():
    axes = ['lx', 'ly', 'lz', 'gx', 'gy', 'gz']
    # window of 128 zeroes for each of the axes
    window_payload = {axis: [0.0] * 128 for axis in axes}

    response = client.post('/predict', json=window_payload)
    assert response.status_code == 200

    response_body = response.json()

    chances = response_body['chances']
    # check that chances has 5 entries
    assert len(chances) == 5

    # they add up to 1 within 0.01
    assert abs(sum(chances.values()) - 1) <= 0.01
