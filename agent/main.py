from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers and database
from api.topic import router as topic_router
from api.tutor import router as tutor_router
from database.client import mongodb

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    await mongodb.connect()
    print("Successfully connected to MongoDB.")
    yield
    # Shutdown: Close MongoDB connection
    await mongodb.close()
    print("Successfully closed MongoDB connection.")

app = FastAPI(
    title="Tutorly Agent API",
    description="FastAPI backend for Tutorly AI Agents (ReAct Planners, etc.)",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS to allow the Next.js frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.56.1:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(topic_router)
app.include_router(tutor_router)

@app.get("/")
async def root():
    return {"message": "Tutorly Agent API is running!"}

