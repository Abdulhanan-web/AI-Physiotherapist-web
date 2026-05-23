from database import SessionLocal
import models
import auth
from datetime import datetime, timedelta
import random

db = SessionLocal()

# ---------------- CREATE USER ----------------

hashed_password = auth.get_password_hash("Test@123")

user = models.User(
    email="testuser@gmail.com",
    hashed_password=hashed_password,
    total_score=1200
)

db.add(user)
db.commit()
db.refresh(user)

print("✅ User created")

# ---------------- CREATE PROFILE ----------------

profile = models.UserProfile(
    user_id=user.id,
    full_name="Ali Raza",
    age=24,
    gender="Male",
    height=175,
    weight=72,
    injury_type="Shoulder Injury",
    fitness_goal="Muscle Recovery",
    activity_level="Intermediate",
    medical_history="Minor shoulder stiffness"
)

db.add(profile)
db.commit()

print("✅ Profile created")

# ---------------- EXERCISE LIST ----------------

exercises = [
    "Elbow Flexion Left",
    "Shoulder Flexion Right",
    "Side Tap Left",
    "Cat-Cow Stretch",
    "Bird Dog",
]

fitness_levels = [
    "Beginner",
    "Intermediate",
    "Advanced"
]

# ---------------- CREATE SESSIONS ----------------

for i in range(30):

    random_days = random.randint(0, 29)

    completed_date = datetime.utcnow() - timedelta(days=random_days)

    session = models.ExerciseSession(
        user_id=user.id,
        exercise_name=random.choice(exercises),
        duration_minutes=random.randint(10, 60),
        calories_burned=random.randint(50, 500),
        avg_accuracy=random.randint(60, 100),
        fitness_level=random.choice(fitness_levels),
        completed_at=completed_date
    )

    db.add(session)

db.commit()

print("✅ Exercise sessions created")

# ---------------- CREATE STREAKS ----------------

for exercise in exercises:

    streak = models.ExerciseStreak(
        user_id=user.id,
        exercise_name=exercise,
        current_streak=random.randint(1, 10),
        last_completed_at=datetime.utcnow() - timedelta(hours=random.randint(1, 20)),
        is_broken=False
    )

    db.add(streak)

db.commit()

print("✅ Streaks created")

print("🎉 Dummy data inserted successfully")