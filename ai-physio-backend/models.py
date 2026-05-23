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

    # NEW FIELDS
    duration_minutes = Column(Integer, default=0)

    calories_burned = Column(Integer, default=0)

    avg_accuracy = Column(Integer, default=0)

    fitness_level = Column(String, default="Beginner")


class ExerciseStreak(Base):
    __tablename__ = "exercise_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    exercise_name = Column(String, index=True)
    current_streak = Column(Integer, default=0)
    last_completed_at = Column(DateTime(timezone=True), nullable=True)
    is_broken = Column(Boolean, default=False)


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), unique=True)

    full_name = Column(String)
    age = Column(Integer)
    gender = Column(String)

    height = Column(Integer)
    weight = Column(Integer)

    injury_type = Column(String)
    fitness_goal = Column(String)

    activity_level = Column(String)

    medical_history = Column(String, nullable=True)

class HealthReport(Base):
    __tablename__ = "health_reports"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    report_path = Column(String)

    generated_at = Column(DateTime(timezone=True), server_default=func.now())