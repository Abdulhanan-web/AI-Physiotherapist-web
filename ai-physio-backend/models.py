from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Float,
    Boolean,
    ForeignKey,
    func,
    UniqueConstraint,
)

from database import Base


# ==========================================================
# User
# ==========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True)

    hashed_password = Column(String, nullable=True)

    total_score = Column(Integer, default=0)


# ==========================================================
# User Verification
# ==========================================================

class UserVerification(Base):
    __tablename__ = "user_verifications"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True)

    hashed_password = Column(String)

    code = Column(String)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ==========================================================
# Exercise Session
# ==========================================================

class ExerciseSession(Base):
    __tablename__ = "exercise_sessions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        index=True
    )

    exercise_name = Column(String, index=True)

    completed_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    duration_minutes = Column(Integer, default=0)

    calories_burned = Column(Integer, default=0)

    avg_accuracy = Column(Float, default=0.0)

    fitness_level = Column(String, default="Beginner")


# ==========================================================
# Exercise Streak
# ==========================================================

class ExerciseStreak(Base):
    __tablename__ = "exercise_streaks"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        index=True
    )

    exercise_name = Column(String, index=True)

    current_streak = Column(Integer, default=0)

    last_completed_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    is_broken = Column(Boolean, default=False)


# ==========================================================
# User Profile
# ==========================================================

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True
    )

    full_name = Column(String)

    age = Column(Integer)

    gender = Column(String)

    height = Column(Integer)

    weight = Column(Integer)

    injury_type = Column(String)

    fitness_goal = Column(String)

    activity_level = Column(String)

    medical_history = Column(String, nullable=True)


# ==========================================================
# Health Report
# ==========================================================

class HealthReport(Base):
    __tablename__ = "health_reports"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id")
    )

    report_path = Column(String)

    generated_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )


# ==========================================================
# Wearable Data (Google Fit)
# ==========================================================

class WearableData(Base):
    __tablename__ = "wearable_data"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    # One record per user per day
    date = Column(
        Date,
        nullable=False,
        index=True,
    )

    steps = Column(
        Integer,
        default=0,
        nullable=False,
    )

    calories = Column(
        Float,
        default=0.0,
        nullable=False,
    )

    distance = Column(
        Float,
        default=0.0,
        nullable=False,
    )

    heart_rate = Column(
        Float,
        default=0.0,
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "date",
            name="uq_user_date"
        ),
    )


# ==========================================================
# Google Fit Connection
# ==========================================================

class GoogleFitConnection(Base):
    __tablename__ = "google_fit_connections"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        unique=True,
        nullable=False,
    )

    access_token = Column(
        String,
        nullable=False,
    )

    refresh_token = Column(
        String,
        nullable=False,
    )

    expires_at = Column(
        DateTime,
        nullable=False,
    )

    connected_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )