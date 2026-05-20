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
from auth import get_current_user

basedir = os.path.dirname(__file__)
load_dotenv(os.path.join(basedir, ".env"))

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
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google client ID is not configured on the backend.")

    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=60
        )
        email = idinfo["email"]

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid Google token: {e}")

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
        "Shoulder Forward Elevation", "Side Tap Left", "Side Tap Right",
        # LOWER BACK PAIN
    "Cat-Cow Stretch",
    "Knee to Chest Stretch",
    "Bird Dog",
    "Glute Bridge",
    "Child's Pose Stretch",

    # KNEE RECOVERY
    "Quad Sets",
    "Straight Leg Raise",
    "Heel Slides",
    "Seated Knee Extension",
    "Mini Squats",
    "Step-Ups",
    "Hamstring Curls",
    "Lunges",
    "Single Leg Balance",

    # STROKE RECOVERY
    "Wrist Extension/Flexion",
    "Finger Open/Close",
    "Seated Marching",
    "Sit-to-Stand",
    "Weight Shifting",

    # SHOULDER REHAB
    "Pendulum Exercise",
    "Wall Climb Exercise",
    "Shoulder External Rotation",
    "Shoulder Internal Rotation Stretch",
    "Scaption",
    "Resistance Band Rows"
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
        "correct": bool(confidence >= 0.3),
        "confidence": confidence
    }


@app.post("/update-score")
async def update_score(score_data: schemas.ExerciseScore, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Calculate and update the user's total score.
    Formula: ((sets * reps) * 5) + (avg_accuracy * 2) + 50
    """
    email = get_current_user(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate exercise score: ((sets * reps) * 5) + (avg_accuracy * 2) + 50
    exercise_score = int(((score_data.sets * score_data.reps) * 5) + (score_data.avg_accuracy * 2) + 50)
    
    # Update user's total score
    user.total_score += exercise_score
    db.commit()
    db.refresh(user)

    return {
        "exercise": score_data.exercise_name,
        "exercise_score": exercise_score,
        "total_score": user.total_score,
        "message": f"Score updated! You earned {exercise_score} points."
    }


@app.get("/user-score")
async def get_user_score(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Get the user's current total score
    """
    email = get_current_user(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": user.email,
        "total_score": user.total_score
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


# -------------------- STREAK MANAGEMENT --------------------

@app.post("/complete-exercise")
async def complete_exercise(
    completion_data: schemas.ExerciseCompletion,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Record exercise completion and update streak.
    Streak logic:
    - If no previous session: start streak at 1
    - If last session was < 24 hours ago: increment streak
    - If last session was >= 24 hours ago: reset streak to 1
    """
    email = get_current_user(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Record the exercise session
    session = models.ExerciseSession(
        user_id=user.id,
        exercise_name=completion_data.exercise_name
    )
    db.add(session)
    db.commit()

    # Get or create streak record
    streak = db.query(models.ExerciseStreak).filter(
        models.ExerciseStreak.user_id == user.id,
        models.ExerciseStreak.exercise_name == completion_data.exercise_name
    ).first()

    now = datetime.utcnow()

    if not streak:
        # First time doing this exercise
        streak = models.ExerciseStreak(
            user_id=user.id,
            exercise_name=completion_data.exercise_name,
            current_streak=1,
            last_completed_at=now,
            is_broken=False
        )
        db.add(streak)
    else:
        # Update existing streak
        if streak.last_completed_at:
            time_diff = now - streak.last_completed_at
            hours_since = time_diff.total_seconds() / 3600

            if hours_since >= 24:
                # Streak broken - reset to 1
                streak.current_streak = 1
                streak.is_broken = True
            else:
                # Streak continues - increment
                streak.current_streak += 1
                streak.is_broken = False
        else:
            streak.current_streak = 1

        streak.last_completed_at = now

    db.commit()
    db.refresh(streak)

    return {
        "exercise": completion_data.exercise_name,
        "current_streak": streak.current_streak,
        "message": f"Great! Your {completion_data.exercise_name} streak is now {streak.current_streak} day(s)!"
    }


@app.get("/streaks")
async def get_streaks(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Get all streaks for the current user with warning status.
    Warning: shows glass hour icon if 22+ hours since last completion
    Break: streak breaks if 24+ hours since last completion
    """
    email = get_current_user(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    streaks = db.query(models.ExerciseStreak).filter(
        models.ExerciseStreak.user_id == user.id
    ).all()

    now = datetime.utcnow()
    streaks_response = []

    for streak in streaks:
        has_warning = False
        hours_until_break = None
        is_currently_broken = False

        if streak.last_completed_at:
            time_diff = now - streak.last_completed_at
            hours_since = time_diff.total_seconds() / 3600

            # Check if already broken (24+ hours)
            if hours_since >= 24:
                is_currently_broken = True
                hours_until_break = 0
            # Check for warning (22+ hours)
            elif hours_since >= 22:
                has_warning = True
                hours_until_break = max(0, 24 - hours_since)
            else:
                hours_until_break = max(0, 24 - hours_since)

        streak_response = schemas.ExerciseStreakResponse(
            exercise_name=streak.exercise_name,
            current_streak=streak.current_streak if not is_currently_broken else 0,
            last_completed_at=streak.last_completed_at,
            is_broken=is_currently_broken,
            has_warning=has_warning,
            hours_until_break=hours_until_break
        )
        streaks_response.append(streak_response)

    return streaks_response


@app.post("/profile", response_model=schemas.UserProfileResponse)
def create_profile(
    profile: schemas.UserProfileCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    email = get_current_user(token)

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    existing_profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == user.id
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Profile already exists"
        )

    new_profile = models.UserProfile(
        user_id=user.id,
        full_name=profile.full_name,
        age=profile.age,
        gender=profile.gender,
        height=profile.height,
        weight=profile.weight,
        injury_type=profile.injury_type,
        fitness_goal=profile.fitness_goal,
        activity_level=profile.activity_level,
        medical_history=profile.medical_history
    )

    db.add(new_profile)
    db.commit()
    db.refresh(new_profile)

    return new_profile


@app.get("/profile")
def get_profile(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    email = get_current_user(token)

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == user.id
    ).first()

    if not profile:
        return {"profile_completed": False}

    return {
        "profile_completed": True,
        "profile": profile
    }