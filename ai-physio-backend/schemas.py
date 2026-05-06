from pydantic import BaseModel, EmailStr


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