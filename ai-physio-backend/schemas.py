from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    total_score: int = 0

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class ForgotPassword(BaseModel):
    email: EmailStr


class ResetPassword(BaseModel):
    token: str
    new_password: str


class GoogleToken(BaseModel):
    token: str


class UserVerificationRequest(BaseModel):
    email: EmailStr
    password: str


class UserVerificationConfirm(BaseModel):
    email: EmailStr
    code: str


class ExerciseScore(BaseModel):
    exercise_name: str
    sets: int
    reps: int
    avg_accuracy: float


class ExerciseCompletion(BaseModel):
    exercise_name: str


class ExerciseStreakResponse(BaseModel):
    exercise_name: str
    current_streak: int
    last_completed_at: Optional[datetime] = None
    is_broken: bool
    has_warning: bool  # True if 22+ hours since last completion
    hours_until_break: Optional[float] = None  # Hours remaining before streak breaks

    class Config:
        from_attributes = True


class UserProfileCreate(BaseModel):
    full_name: str
    age: int
    gender: str
    height: int
    weight: int
    injury_type: str
    fitness_goal: str
    activity_level: str
    medical_history: Optional[str] = None


class UserProfileResponse(UserProfileCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True


class ExerciseSessionCreate(BaseModel):
    exercise_name: str
    duration_minutes: int
    calories_burned: int
    avg_accuracy: float
    fitness_level: str


class MealPlanResponse(BaseModel):
    calories: int
    diet_type: str
    meals: list