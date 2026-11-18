# MotionQuest server - made by Alex
# Run it from the backend folder: uvicorn main:app --reload

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='MotionQuest API')

# CORS: the list of websites that are allowed to call this server from a browser

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'https://team12-motionquest.github.io'],
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.get('/')
def home():
    return {'message': 'MotionQuest server is running. Try /health or /docs'}

@app.get('/health')
def health():
    # a quick "are you alive?" check
    return {'status': 'ok'}
    