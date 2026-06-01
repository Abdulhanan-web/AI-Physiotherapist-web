from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from tensorflow.keras.models import load_model
from collections import defaultdict
from pydantic import BaseModel
import numpy as np
from typing import List
from dotenv import load_dotenv
import os
import random
import time
from datetime import datetime, timedelta
import re
from fastapi.responses import FileResponse
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus.tables import Table
from reportlab.platypus.tables import TableStyle
from reportlab.lib import colors
from reportlab.platypus import Image
import matplotlib.pyplot as plt

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
import requests as http_requests

basedir = os.path.dirname(__file__)
load_dotenv(os.path.join(basedir, ".env"))

SPOONACULAR_API_KEY = os.getenv("SPOONACULAR_API_KEY")

# Create database tables automatically on startup
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.mount("/reports", StaticFiles(directory="reports"), name="reports")

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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("❌ 422 VALIDATION ERROR:", exc.errors())
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

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


    try:
        send_verification_email(user.email, code)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to send verification email")


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
    completion_data: schemas.ExerciseSessionCreate,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """
    Record exercise completion and update streak.
    Streak logic:
    - If no previous session: start streak at 1
    - If last session was < 24 hours ago: increment streak
    - If last session was >= 24 hours ago: reset streak to 1

    Returns full session summary for the post-session report.
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
        exercise_name=completion_data.exercise_name,
        duration_minutes=completion_data.duration_minutes,
        calories_burned=completion_data.calories_burned,
        avg_accuracy=completion_data.avg_accuracy,
        fitness_level=completion_data.fitness_level
    )
    db.add(session)
    db.commit()
    db.refresh(session)

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
        "duration_minutes": session.duration_minutes,
        "calories_burned": session.calories_burned,
        "avg_accuracy": session.avg_accuracy,
        "fitness_level": session.fitness_level,
        "completed_at": session.completed_at,
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


@app.put("/profile", response_model=schemas.UserProfileResponse)
def update_profile(
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

    if not existing_profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found. Please create a profile first."
        )

    existing_profile.full_name     = profile.full_name
    existing_profile.age           = profile.age
    existing_profile.gender        = profile.gender
    existing_profile.height        = profile.height
    existing_profile.weight        = profile.weight
    existing_profile.injury_type   = profile.injury_type
    existing_profile.fitness_goal  = profile.fitness_goal
    existing_profile.activity_level = profile.activity_level
    existing_profile.medical_history = profile.medical_history

    db.commit()
    db.refresh(existing_profile)

    return existing_profile


def group_sessions(sessions, report_type):

    grouped = defaultdict(list)

    for session in sessions:

        # WEEKLY REPORT
        # Group by exact date
        if report_type == "weekly":

            key = session.completed_at.strftime("%Y-%m-%d")

        # MONTHLY REPORT
        # Group by every 5 days
        else:

            days_ago = (
                datetime.utcnow() - session.completed_at
            ).days

            block = days_ago // 5

            start = block * 5
            end = start + 4

            key = f"{start}-{end} Days Ago"

        grouped[key].append(session)

    return grouped


def calculate_daily_calories(profile):

    # Mifflin-St Jeor Formula

    if profile.gender.lower() == "male":
        bmr = (
            10 * profile.weight
            + 6.25 * profile.height
            - 5 * profile.age
            + 5
        )
    else:
        bmr = (
            10 * profile.weight
            + 6.25 * profile.height
            - 5 * profile.age
            - 161
        )

    activity_map = {
        "low": 1.2,
        "medium": 1.55,
        "high": 1.75
    }

    multiplier = activity_map.get(
        profile.activity_level.lower(),
        1.2
    )

    calories = int(bmr * multiplier)

    # Goal adjustment

    if profile.fitness_goal.lower() == "weight loss":
        calories -= 300

    elif profile.fitness_goal.lower() == "muscle gain":
        calories += 300

    return calories


def map_rehab_diet(profile):
    injury = profile.injury_type.lower()
    goal = profile.fitness_goal.lower()

    # ---------------- Neurological conditions ----------------
    if "stroke" in injury or "paralysis" in injury:
        return "high protein recommendation"

    # ---------------- Joint / bone recovery ----------------
    if "knee" in injury or "back" in injury or "shoulder" in injury:
        return "high protein recommendation"

    # ---------------- Lower back pain ----------------
    if "lower back pain" in injury:
        return "anti-inflammatory recommendation"

    # ---------------- Goal-based logic ----------------
    if "weight loss" in goal:
        return "low calorie recommendation"

    if "muscle gain" in goal:
        return "high protein recommendation"

    # ---------------- Default ----------------
    return "balanced recommendation"


def convert_to_api_diet(diet_type: str):
    diet_type = diet_type.lower()

    valid_diets = [
        "vegetarian",
        "vegan",
        "gluten free",
        "ketogenic",
        "paleo"
    ]

    # Map your AI output → Spoonacular supported values
    if "vegetarian" in diet_type:
        return "vegetarian"

    if "vegan" in diet_type:
        return "vegan"

    if "gluten" in diet_type:
        return "gluten free"

    if "protein" in diet_type:
        return "ketogenic"   # closest match

    return None



@app.get("/generate-report-data/{report_type}")
def generate_report_data(
    report_type: str,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    # ---------------- AUTH ----------------

    email = get_current_user(token)

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ---------------- PROFILE ----------------

    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Complete profile first"
        )

    # ---------------- DATE RANGE ----------------

    now = datetime.utcnow()

    if report_type == "weekly":
        start_date = now - timedelta(days=7)

    elif report_type == "monthly":
        start_date = now - timedelta(days=30)

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report type"
        )

    # ---------------- FETCH SESSIONS ----------------

    sessions = db.query(models.ExerciseSession).filter(
        models.ExerciseSession.user_id == user.id,
        models.ExerciseSession.completed_at >= start_date
    ).all()

    if not sessions:
        raise HTTPException(
            status_code=400,
            detail="No exercise data found"
        )

    # ---------------- GROUP DATA ----------------

    grouped_sessions = group_sessions(
        sessions,
        report_type
    )

    report_data = []

    for period, items in grouped_sessions.items():

        total_time = sum(
            session.duration_minutes
            for session in items
        )

        total_calories = sum(
            session.calories_burned
            for session in items
        )

        avg_accuracy = round(
            sum(
                session.avg_accuracy
                for session in items
            ) / len(items),
            2
        )

        report_data.append({

            "period": period,

            "exercise_count": len(items),

            "time_spent": total_time,

            "calories": total_calories,

            "avg_accuracy": avg_accuracy
        })

    # ---------------- STREAKS ----------------

    streaks = db.query(models.ExerciseStreak).filter(
        models.ExerciseStreak.user_id == user.id
    ).all()

    # ---------------- AI RECOMMENDATION ----------------

    if user.total_score < 500:
        recommendation = "Increase rehabilitation consistency."
    else:
        recommendation = "Excellent rehabilitation progress."

    # ---------------- RETURN JSON ----------------

    return {

        "user": {

            "name": profile.full_name,

            "age": profile.age,

            "injury_type": profile.injury_type,

            "fitness_goal": profile.fitness_goal,

            "activity_level": profile.activity_level,

            "total_score": user.total_score
        },

        "summary": {

            "total_sessions": len(sessions),

            "total_calories": sum(
                s.calories_burned for s in sessions
            ),

            "total_minutes": sum(
                s.duration_minutes for s in sessions
            ),

            "average_accuracy": round(
                sum(s.avg_accuracy for s in sessions)
                / len(sessions),
                2
            )
        },

        "report_data": report_data,

        "streaks": [

            {
                "exercise": s.exercise_name,
                "days": s.current_streak
            }

            for s in streaks
        ],

        "recommendation": recommendation
    }


@app.get("/generate-report/{report_type}")
def generate_report(
    report_type: str,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    # ---------------- AUTH ----------------

    email = get_current_user(token)

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ---------------- PROFILE ----------------

    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Complete profile first"
        )

    # ---------------- DATE RANGE ----------------

    now = datetime.utcnow()

    if report_type == "weekly":
        start_date = now - timedelta(days=7)

    elif report_type == "monthly":
        start_date = now - timedelta(days=30)

    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report type"
        )

    # ---------------- FETCH SESSIONS ----------------

    sessions = db.query(models.ExerciseSession).filter(
        models.ExerciseSession.user_id == user.id,
        models.ExerciseSession.completed_at >= start_date
    ).all()

    if not sessions:
        raise HTTPException(
            status_code=400,
            detail="No exercise data found for this report period"
        )

    # ---------------- GROUP SESSIONS ----------------

    grouped_sessions = group_sessions(
        sessions,
        report_type
    )

    # ---------------- ANALYTICS DATA ----------------

    report_data = []

    for period, items in grouped_sessions.items():

        exercise_names = [
            session.exercise_name
            for session in items
        ]

        total_time = sum(
            session.duration_minutes
            for session in items
        )

        total_calories = sum(
            session.calories_burned
            for session in items
        )

        avg_accuracy = round(
            sum(
                session.avg_accuracy
                for session in items
            ) / len(items),
            2
        )

        fitness_level = items[-1].fitness_level

        total_exercises = len(items)

        report_data.append({
            "period": period,
            "exercises": ", ".join(exercise_names),
            "exercise_count": total_exercises,
            "time_spent": total_time,
            "calories": total_calories,
            "avg_accuracy": avg_accuracy,
            "fitness_level": fitness_level
        })

    # ---------------- GET STREAKS ----------------

    streaks = db.query(models.ExerciseStreak).filter(
        models.ExerciseStreak.user_id == user.id
    ).all()

    # ---------------- CREATE REPORTS FOLDER ----------------

    if not os.path.exists("reports"):
        os.makedirs("reports")

    # ---------------- CREATE CHART ----------------

    chart_filename = f"chart_{user.id}.png"

    chart_path = os.path.abspath(
        os.path.join("reports", chart_filename)
    )

    labels = [
        item["period"]
        for item in report_data
    ]

    exercise_counts = [
        item["exercise_count"]
        for item in report_data
    ]

    avg_accuracy_data = [
        item["avg_accuracy"]
        for item in report_data
    ]

    calories_data = [
        item["calories"]
        for item in report_data
    ]

    plt.figure(figsize=(11, 5))

    # Exercise activity line
    plt.plot(
        labels,
        exercise_counts,
        marker='o',
        linewidth=3,
        label="Exercises Performed"
    )

    # Accuracy line
    plt.plot(
        labels,
        avg_accuracy_data,
        marker='s',
        linewidth=3,
        label="Average Accuracy"
    )

    # Calories burned bars
    plt.bar(
        labels,
        calories_data,
        alpha=0.3,
        label="Calories Burned"
    )

    plt.title(
        f"{report_type.capitalize()} Rehabilitation Analytics",
        fontsize=16,
        fontweight='bold'
    )

    plt.xlabel("Period")
    plt.ylabel("Performance Metrics")

    plt.xticks(rotation=25)

    plt.legend()

    plt.grid(True, linestyle='--', alpha=0.5)

    plt.tight_layout()

    plt.savefig(chart_path)

    plt.close()

    # ---------------- CREATE PDF ----------------

    report_filename = f"health_report_{user.id}.pdf"

    report_path = os.path.abspath(
        os.path.join("reports", report_filename)
    )

    doc = SimpleDocTemplate(report_path)

    styles = getSampleStyleSheet()

    elements = []

    # ---------------- TITLE ----------------

    elements.append(
        Paragraph(
            "AI Physiotherapy Health Report",
            styles['Title']
        )
    )

    elements.append(Spacer(1, 20))

    # ---------------- USER INFO TABLE ----------------

    user_data = [
        ["Field", "Value"],
        ["Full Name", profile.full_name],
        ["Age", str(profile.age)],
        ["Gender", profile.gender],
        ["Injury Type", profile.injury_type],
        ["Fitness Goal", profile.fitness_goal],
        ["Activity Level", profile.activity_level],
        ["Total Score", str(user.total_score)]
    ]

    table = Table(user_data, colWidths=[200, 300])

    table.setStyle(TableStyle([

        ('BACKGROUND', (0,0), (-1,0), colors.grey),

        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),

        ('GRID', (0,0), (-1,-1), 1, colors.black),

        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),

        ('BOTTOMPADDING', (0,0), (-1,0), 12),

    ]))

    elements.append(table)

    elements.append(Spacer(1, 30))

    # ---------------- SESSION COUNT ----------------

    elements.append(
        Paragraph(
            f"Total Exercise Sessions: {len(sessions)}",
            styles['Heading2']
        )
    )

    elements.append(Spacer(1, 20))

    # ---------------- ANALYTICS TABLE ----------------

    elements.append(
        Paragraph(
            f"{report_type.capitalize()} Rehabilitation Analytics",
            styles['Heading2']
        )
    )

    elements.append(Spacer(1, 15))

    analytics_data = [[
        "Period",
        "Exercises",
        "Time",
        "Calories",
        "Accuracy",
        "Fitness"
    ]]

    for item in report_data:

        analytics_data.append([

            item["period"],

            item["exercises"],

            str(item["time_spent"]),

            str(item["calories"]),

            f"{item['avg_accuracy']}%",

            item["fitness_level"]

        ])

    analytics_table = Table(
        analytics_data,
        colWidths=[90, 180, 70, 70, 80, 90]
    )

    analytics_table.setStyle(TableStyle([

        ('BACKGROUND', (0,0), (-1,0), colors.darkblue),

        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),

        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),

        ('FONTSIZE', (0,0), (-1,0), 10),

        ('BOTTOMPADDING', (0,0), (-1,0), 12),

        ('BACKGROUND', (0,1), (-1,-1), colors.beige),

        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),

        ('FONTSIZE', (0,1), (-1,-1), 9),

        ('GRID', (0,0), (-1,-1), 1, colors.black),

        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),

        ('ALIGN', (2,1), (4,-1), 'CENTER'),

    ]))

    elements.append(analytics_table)

    elements.append(Spacer(1, 30))

    # ---------------- STREAKS ----------------

    elements.append(
        Paragraph(
            "Exercise Streaks",
            styles['Heading2']
        )
    )

    elements.append(Spacer(1, 10))

    for streak in streaks:

        elements.append(
            Paragraph(
                f"{streak.exercise_name}: {streak.current_streak} day streak",
                styles['BodyText']
            )
        )

    elements.append(Spacer(1, 30))

    # ---------------- ADD CHART ----------------

    elements.append(
        Image(chart_path, width=450, height=250)
    )

    elements.append(Spacer(1, 30))

    # ---------------- AI RECOMMENDATION ----------------

    if user.total_score < 500:
        recommendation = "Increase rehabilitation consistency."
    else:
        recommendation = "Excellent rehabilitation progress."

    elements.append(
        Paragraph(
            f"AI Recommendation: {recommendation}",
            styles['Heading2']
        )
    )

    # ---------------- BUILD PDF ----------------

    doc.build(elements)


    if not os.path.exists(report_path):
        raise HTTPException(
            status_code=500,
            detail="PDF generation failed"
        )

    # ---------------- SAVE REPORT ----------------

    report = models.HealthReport(
        user_id=user.id,
        report_path=report_path
    )

    db.add(report)
    db.commit()

    # ---------------- RETURN PDF ----------------

    return FileResponse(
        path=report_path,
        media_type="application/pdf",
        filename=report_filename
    )


@app.get("/nutrition-plan")
def generate_nutrition_plan(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    # ---------------- AUTH ----------------

    email = get_current_user(token)

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # ---------------- PROFILE ----------------

    profile = db.query(models.UserProfile).filter(
        models.UserProfile.user_id == user.id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=400,
            detail="Please complete profile first"
        )

    # ---------------- CALORIES ----------------

    calories = calculate_daily_calories(profile)

    # ---------------- DIET TYPE ----------------

    raw_diet = map_rehab_diet(profile)
    api_diet = convert_to_api_diet(raw_diet)

    # ---------------- API REQUEST ----------------

    url = "https://api.spoonacular.com/mealplanner/generate"

    params = {
        "apiKey": SPOONACULAR_API_KEY,
        "timeFrame": "day",
        "targetCalories": calories
    }

    if api_diet:
        params["diet"] = api_diet

    response = http_requests.get(url, params=params)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Meal API failed")

    data = response.json()

    # ---------------- RESPONSE ----------------

    return {
        "calories": calories,
        "diet_type": raw_diet,
        "api_diet_used": api_diet,
        "meals": data.get("meals", []),
        "nutrients": data.get("nutrients", {})
    }


@app.post("/google-fit/connect")
def connect_google_fit(
    data: schemas.GoogleFitToken,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    # ---------------- AUTH ----------------
    email = get_current_user(token)

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ---------------- GOOGLE FIT REQUEST ----------------
    headers = {
        "Authorization": f"Bearer {data.access_token}"
    }

    # ✅ SAFE TIME RANGE (last 7 days only)
    now = int(time.time() * 1000)
    seven_days_ago = now - (7 * 24 * 60 * 60 * 1000)

    body = {
        "aggregateBy": [
            {
                "dataTypeName": "com.google.step_count.delta"
            }
        ],
        "bucketByTime": {
            "durationMillis": 86400000  # 1 day
        },
        "startTimeMillis": seven_days_ago,
        "endTimeMillis": now
    }

    steps_url = "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate"

    response = http_requests.post(
        steps_url,
        headers=headers,
        json=body
    )

    # ---------------- DEBUG ----------------
    print("GOOGLE FIT STATUS:", response.status_code)
    print("GOOGLE FIT RESPONSE:", response.text)

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail=f"Google Fit API failed: {response.text}"
        )

    fit_data = response.json()

    # ---------------- PARSE STEPS ----------------
    total_steps = 0

    for bucket in fit_data.get("bucket", []):
        for dataset in bucket.get("dataset", []):
            for point in dataset.get("point", []):
                values = point.get("value", [])
                if values:
                    total_steps += values[0].get("intVal", 0)

    # ---------------- SAVE TO DB ----------------
    wearable = models.WearableData(
        user_id=user.id,
        steps=total_steps
    )

    db.add(wearable)
    db.commit()

    return {
        "message": "Google Fit connected successfully",
        "steps": total_steps
    }

@app.get("/wearable-stats")
def wearable_stats(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    email = get_current_user(token)

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    data = db.query(models.WearableData).filter(
        models.WearableData.user_id == user.id
    ).all()

    return data