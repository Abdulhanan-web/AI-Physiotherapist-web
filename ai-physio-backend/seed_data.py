from datetime import datetime, timedelta, date
import random
from passlib.context import CryptContext

from database import SessionLocal
from models import (
    User,
    UserProfile,
    WearableData,
    ExerciseSession,
    ExerciseStreak,
    GoogleFitConnection,
    HealthReport,
)

# --------------------------
# Password Hashing
# --------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)


# --------------------------
# Seed Script
# --------------------------
def seed_data():
    db = SessionLocal()

    try:
        # ======================================================
        # 1. Create User
        # ======================================================
        user = User(
            email="testuser@example.com",
            hashed_password=hash_password("Test@12345"),
            total_score=1200
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # ======================================================
        # 2. User Profile
        # ======================================================
        profile = UserProfile(
            user_id=user.id,
            full_name="Ali Raza",
            age=25,
            gender="Male",
            height=175,
            weight=70,
            injury_type="Knee Pain",
            fitness_goal="Weight Loss",
            activity_level="Moderate",
            medical_history="None"
        )
        db.add(profile)

        # ======================================================
        # 3. Google Fit Connection
        # ======================================================
        fit = GoogleFitConnection(
            user_id=user.id,
            access_token="dummy_access_token",
            refresh_token="dummy_refresh_token",
            expires_at=datetime.utcnow() + timedelta(days=30),
        )
        db.add(fit)

        # ======================================================
        # 4. Generate 35 Days of Data
        # ======================================================
        start_date = date.today() - timedelta(days=35)

        streak = 0

        for i in range(35):
            current_date = start_date + timedelta(days=i)

            # Random wearable data
            steps = random.randint(3000, 12000)
            calories = round(steps * 0.04, 2)
            distance = round(steps * 0.0008, 2)
            heart_rate = random.randint(65, 150)

            wearable = WearableData(
                user_id=user.id,
                date=current_date,
                steps=steps,
                calories=calories,
                distance=distance,
                heart_rate=heart_rate,
            )
            db.add(wearable)

            # Exercise session (daily)
            duration = random.randint(20, 90)
            accuracy = round(random.uniform(60, 98), 2)

            session = ExerciseSession(
                user_id=user.id,
                exercise_name=random.choice([
                    "Running",
                    "Cycling",
                    "Yoga",
                    "Strength Training",
                    "Walking"
                ]),
                completed_at=datetime.combine(current_date, datetime.min.time()),
                duration_minutes=duration,
                calories_burned=int(calories),
                avg_accuracy=accuracy,
                fitness_level=random.choice(["Beginner", "Intermediate", "Advanced"])
            )
            db.add(session)

            # Streak logic
            streak += 1
            streak_record = ExerciseStreak(
                user_id=user.id,
                exercise_name="General Fitness",
                current_streak=streak,
                last_completed_at=datetime.combine(current_date, datetime.min.time()),
                is_broken=False
            )
            db.add(streak_record)

        # ======================================================
        # 5. Health Reports (weekly)
        # ======================================================
        for i in range(5):
            report = HealthReport(
                user_id=user.id,
                report_path=f"/reports/health_report_week_{i+1}.pdf",
                generated_at=datetime.utcnow() - timedelta(days=i * 7)
            )
            db.add(report)

        db.commit()
        print("✅ Seed data inserted successfully!")

    except Exception as e:
        db.rollback()
        print("❌ Error:", e)

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()