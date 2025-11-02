from fastapi import FastAPI
from .routes_upload import router as upload_router
from .routes_chat import router as chat_router
from .routes_chat_history import router as chat_history_router
from .document_analysis import router as analysis_router
from .cache_management import router as cache_router
from .auth import router as auth_router
from .db import create_db_and_tables
import os
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    # You can add more origins if needed
]

# Create FastAPI app
app = FastAPI(title="Chat2Doc API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth")
app.include_router(upload_router, prefix="/upload")
app.include_router(chat_router, prefix="/chat")
app.include_router(chat_history_router, prefix="/chat-history")
app.include_router(analysis_router, prefix="/analysis")
app.include_router(cache_router, prefix="/cache")

# On startup: create DB tables and directories if missing
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    # Ensure directories exist
    os.makedirs(os.path.join(os.path.dirname(__file__), "..", "data", "uploads"), exist_ok=True)
    # os.makedirs(os.path.join(os.path.dirname(__file__), "..", "data", "chroma"), exist_ok=True)

# Simple healthcheck
@app.get("/")
def root():
    return {"status": "ok", "message": "Chat2Doc API is running"}
