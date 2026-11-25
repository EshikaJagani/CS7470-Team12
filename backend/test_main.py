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
