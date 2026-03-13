from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from tensorflow.keras.models import load_model
from pydantic import BaseModel
import numpy as np
from typing import List

# Import your new database and auth files
import models
import schemas
import auth
from database import engine, get_db

# Create database tables automatically on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 1. Authentication Routes ---

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and save user
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Authenticate user
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate JWT Token
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# --- 2. Machine Learning / Physiotherapist Routes ---

class SequenceRequest(BaseModel):
    sequence: List[List[float]]

# Renamed from 'models' to 'ml_models' to avoid conflict with models.py
ml_models = {}

def load_ml_models():
    # Model names must match exactly what frontend sends (decoded)
    model_list = [
        "Elbow Flexion Left", "Elbow Flexion Right",
        "Shoulder Flexion Left", "Shoulder Flexion Right",
        "Shoulder Abduction Left", "Shoulder Abduction Right",
        "Shoulder Forward Elevation", "Side Tap Left", "Side Tap Right"
    ]
    for name in model_list:
        file_path = f"models/{name.lower().replace(' ', '_')}.h5"
        try:
            ml_models[name] = load_model(file_path)
            print(f"✅ Loaded: {name}")
        except Exception as e:
            print(f"❌ Failed to load {name}: {e}")

# Load models when the server starts
load_ml_models()

@app.post("/predict/{exercise_name}")
async def predict(exercise_name: str, request: SequenceRequest):
    if exercise_name not in ml_models:
        raise HTTPException(status_code=404, detail="Model not found")

    # Data validation
    sequence_data = np.array(request.sequence)
    if sequence_data.shape != (30, 75):
         raise HTTPException(status_code=400, detail=f"Expected shape (30,75), got {sequence_data.shape}")

    # Inference
    model = ml_models[exercise_name]
    input_seq = sequence_data.reshape(1, 30, 75)
    prediction = model.predict(input_seq, verbose=0)
    
    confidence = float(prediction[0][0])
    
    return {
        "exercise": exercise_name,
        "correct": bool(confidence >= 0.5),
        "confidence": confidence
    }