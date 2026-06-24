from datetime import datetime, timedelta, date
import random

from database import SessionLocal
from models import (
    User,
    UserVerification,
    UserProfile,
    ExerciseSession,
    ExerciseStreak,
    HealthReport,
    WearableData,
    GoogleFitConnection,
)
from auth import get_password_hash

db = SessionLocal()

EXERCISES = [
    "Elbow Flexion Left",
    "Elbow Flexion Right",
    "Shoulder Flexion Left",
    "Shoulder Flexion Right",
    "Shoulder Abduction Left",
    "Shoulder Abduction Right",
    "Shoulder Forward Elevation",
    "Side Tap Left",
    "Side Tap Right",
]

EMAIL = "demo@physio.com"
PASSWORD = "Demo@123"

try:

    # ==========================================================
    # Delete Existing Demo Data
    # ==========================================================

    existing_user = (
        db.query(User)
        .filter(User.email == EMAIL)
        .first()
    )

    if existing_user:
        db.query(ExerciseSession).filter(
            ExerciseSession.user_id == existing_user.id
        ).delete()

        db.query(ExerciseStreak).filter(
            ExerciseStreak.user_id == existing_user.id
        ).delete()

        db.query(UserProfile).filter(
            UserProfile.user_id == existing_user.id
        ).delete()

        db.query(WearableData).filter(
            WearableData.user_id == existing_user.id
        ).delete()

        db.query(HealthReport).filter(
            HealthReport.user_id == existing_user.id
        ).delete()

        db.query(GoogleFitConnection).filter(
            GoogleFitConnection.user_id == existing_user.id
        ).delete()

        db.query(User).filter(
            User.id == existing_user.id
        ).delete()

        db.commit()

    db.query(UserVerification).filter(
        UserVerification.email == EMAIL
    ).delete()

    db.commit()

    # ==========================================================
    # User
    # ==========================================================

    user = User(
        email=EMAIL,
        hashed_password=get_password_hash(PASSWORD),
        total_score=1250,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    print(f"Created User ID: {user.id}")

    # ==========================================================
    # User Verification
    # ==========================================================

    verification = UserVerification(
        email=EMAIL,
        hashed_password=get_password_hash(PASSWORD),
        code="123456",
    )

    db.add(verification)

    # ==========================================================
    # User Profile
    # ==========================================================

    profile = UserProfile(
        user_id=user.id,
        full_name="Demo Patient",
        age=28,
        gender="Male",
        height=175,
        weight=75,
        injury_type="Shoulder Injury",
        fitness_goal="Pain Reduction",
        activity_level="Moderate",
        medical_history="Previous shoulder strain",
    )

    db.add(profile)

    # ==========================================================
    # Exercise Streaks
    # ==========================================================

    for exercise in EXERCISES:
        streak = ExerciseStreak(
            user_id=user.id,
            exercise_name=exercise,
            current_streak=random.randint(3, 20),
            last_completed_at=datetime.utcnow(),
            is_broken=False,
        )

        db.add(streak)

    # ==========================================================
    # Exercise Sessions
    # ==========================================================

    for exercise in EXERCISES:

        for i in range(5):

            session = ExerciseSession(
                user_id=user.id,
                exercise_name=exercise,
                completed_at=datetime.utcnow()
                - timedelta(days=random.randint(0, 30)),
                duration_minutes=random.randint(5, 20),
                calories_burned=random.randint(20, 120),
                avg_accuracy=round(
                    random.uniform(75, 99), 2
                ),
                fitness_level=random.choice(
                    [
                        "Beginner",
                        "Intermediate",
                        "Advanced",
                    ]
                ),
            )

            db.add(session)

    # ==========================================================
    # Health Report
    # ==========================================================

    report = HealthReport(
        user_id=user.id,
        report_path="reports/demo_report.pdf",
    )

    db.add(report)

    # ==========================================================
    # Wearable Data (30 Days)
    # ==========================================================

    for i in range(30):

        wearable = WearableData(
            user_id=user.id,
            date=date.today() - timedelta(days=i),
            steps=random.randint(3000, 15000),
            calories=round(
                random.uniform(180, 650), 2
            ),
            distance=round(
                random.uniform(2.0, 12.0), 2
            ),
            heart_rate=round(
                random.uniform(65, 95), 2
            ),
        )

        db.add(wearable)

    # ==========================================================
    # Google Fit Connection
    # ==========================================================

    google_fit = GoogleFitConnection(
        user_id=user.id,
        access_token="demo_access_token",
        refresh_token="demo_refresh_token",
        expires_at=datetime.utcnow() + timedelta(days=30),
    )

    db.add(google_fit)

    db.commit()

    print("===================================")
    print("DATABASE SEEDED SUCCESSFULLY")
    print("===================================")
    print(f"Email    : {EMAIL}")
    print(f"Password : {PASSWORD}")
    print("===================================")

except Exception as e:
    db.rollback()
    print("ERROR:", e)

finally:
    db.close()