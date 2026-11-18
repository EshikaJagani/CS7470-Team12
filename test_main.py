# Automatic tests for the server - made by Alex
# Run them from the backend folder: pytest

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
