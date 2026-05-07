from sqlalchemy import Column, Integer, String, DateTime, func, ForeignKey, Boolean
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)  # allow Google users
    total_score = Column(Integer, default=0)


class UserVerification(Base):
    __tablename__ = "user_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    code = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    exercise_name = Column(String, index=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())


class ExerciseStreak(Base):
    __tablename__ = "exercise_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    exercise_name = Column(String, index=True)
    current_streak = Column(Integer, default=0)
    last_completed_at = Column(DateTime(timezone=True), nullable=True)
    is_broken = Column(Boolean, default=False)