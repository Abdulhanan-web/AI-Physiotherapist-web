from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from tensorflow.keras.models import load_model
from pydantic import BaseModel
import numpy as np
from typing import List
from dotenv import load_dotenv
import os
import random
from datetime import datetime, timedelta
import re

# Import your new database and auth files
import models
import schemas
import auth
from database import engine, get_db
from email_utils import send_reset_email, send_verification_email
from google.oauth2 import id_token
from google.auth.transport import requests
from models import UserVerification

load_dotenv()

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

# ---------------- PASSWORD VALIDATION ----------------
def validate_password(password: str):
    """
    Enforce strong password rules:
    - At least 8 characters
    - At least 1 uppercase
    - At least 1 lowercase
    - At least 1 number
    - At least 1 special character
    """
    pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$'
    if not re.match(pattern, password):
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        )

# ---------------- AUTH ROUTES ----------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    validate_password(user.password)

    hashed_password = auth.get_password_hash(user.password)

    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    if user.hashed_password is None:
        raise HTTPException(
            status_code=400,
            detail="This account was created with Google. Please login using Google."
        )

    if not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


# ---------------- FORGOT PASSWORD ----------------
@app.post("/forgot-password")
def forgot_password(request: schemas.ForgotPassword, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = auth.create_reset_token(user.email)
    send_reset_email(user.email, token)

    return {"message": "Password reset email sent"}


# ---------------- RESET PASSWORD ----------------
@app.post("/reset-password")
def reset_password(data: schemas.ResetPassword, db: Session = Depends(get_db)):

    validate_password(data.new_password)

    email = auth.verify_reset_token(data.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = auth.get_password_hash(data.new_password)
    db.commit()

    return {"message": "Password reset successful"}


# ---------------- GOOGLE LOGIN ----------------
@app.post("/google-login", response_model=schemas.Token)
def google_login(data: schemas.GoogleToken, db: Session = Depends(get_db)):

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )
        email = idinfo["email"]

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    user = db.query(models.User).filter(models.User.email == email).first()

    if not user:
        user = models.User(
            email=email,
            hashed_password=None
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = auth.create_access_token(data={"sub": email})
    return {"access_token": access_token, "token_type": "bearer"}


# ---------------- ML ROUTES ----------------
class SequenceRequest(BaseModel):
    sequence: List[List[float]]

ml_models = {}

def load_ml_models():
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

load_ml_models()


@app.post("/predict/{exercise_name}")
async def predict(exercise_name: str, request: SequenceRequest):

    if exercise_name not in ml_models:
        raise HTTPException(status_code=404, detail="Model not found")

    sequence_data = np.array(request.sequence)
    if sequence_data.shape != (30, 75):
        raise HTTPException(
            status_code=400,
            detail=f"Expected shape (30,75), got {sequence_data.shape}"
        )

    model = ml_models[exercise_name]
    input_seq = sequence_data.reshape(1, 30, 75)
    prediction = model.predict(input_seq, verbose=0)
    confidence = float(prediction[0][0])

    return {
        "exercise": exercise_name,
        "correct": bool(confidence >= 0.5),
        "confidence": confidence
    }


# ---------------- EMAIL VERIFICATION ----------------
VERIFICATION_EXPIRE_MINUTES = 15

@app.post("/register-request")
def register_request(user: schemas.UserVerificationRequest, db: Session = Depends(get_db)):

    validate_password(user.password)

    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    code = f"{random.randint(100000, 999999)}"
    hashed_password = auth.get_password_hash(user.password)

    verification = db.query(UserVerification).filter(
        UserVerification.email == user.email
    ).first()

    if verification:
        verification.code = code
        verification.hashed_password = hashed_password
        verification.created_at = datetime.utcnow()
    else:
        verification = UserVerification(
            email=user.email,
            code=code,
            hashed_password=hashed_password
        )
        db.add(verification)

    db.commit()
    send_verification_email(user.email, code)

    return {"message": "Verification code sent to email"}


@app.post("/verify-registration", response_model=schemas.UserResponse)
def verify_registration(data: schemas.UserVerificationConfirm, db: Session = Depends(get_db)):

    verification = db.query(UserVerification).filter(
        UserVerification.email == data.email
    ).first()

    if not verification:
        raise HTTPException(status_code=400, detail="No verification code found")

    if verification.code != data.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if datetime.utcnow() > verification.created_at + timedelta(minutes=VERIFICATION_EXPIRE_MINUTES):
        raise HTTPException(status_code=400, detail="Verification code expired")

    new_user = models.User(
        email=verification.email,
        hashed_password=verification.hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    db.delete(verification)
    db.commit()

    return new_user