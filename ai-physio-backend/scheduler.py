from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timezone

from database import SessionLocal
import models

from google_fit_service import (
    get_valid_access_token,
    fetch_fitness_data
)

scheduler = BackgroundScheduler()


def sync_google_fit():

    db = SessionLocal()

    try:

        users = db.query(models.User).all()

        print(f"Found {len(users)} users")

        # Today's date (store one record per day)
        today = datetime.now(timezone.utc).date()

        for user in users:

            print(f"Syncing User {user.id}")

            access_token = get_valid_access_token(db, user.id)

            if not access_token:
                print("Google Fit not connected")
                continue

            fitness_data = fetch_fitness_data(access_token)

            # Find today's record
            record = (
                db.query(models.WearableData)
                .filter(
                    models.WearableData.user_id == user.id,
                    models.WearableData.date == today
                )
                .first()
            )

            if record is None:

                # Create today's record
                record = models.WearableData(
                    user_id=user.id,
                    date=today,
                    steps=fitness_data["steps"],
                    calories=fitness_data["calories"],
                    distance=fitness_data["distance"],
                    heart_rate=fitness_data["heart_rate"]
                )

                db.add(record)

            else:

                # IMPORTANT:
                # Google Fit already returns cumulative values.
                # Replace values instead of adding them.

                record.steps = fitness_data["steps"]
                record.calories = fitness_data["calories"]
                record.distance = fitness_data["distance"]
                record.heart_rate = fitness_data["heart_rate"]

            print(
                f"""
User: {user.id}
Steps: {fitness_data['steps']}
Calories: {fitness_data['calories']}
Distance: {fitness_data['distance']}
Heart Rate: {fitness_data['heart_rate']}
"""
            )

        db.commit()

        print(
            "Google Fit Sync Completed:",
            datetime.utcnow()
        )

    except Exception as e:

        db.rollback()
        print("Scheduler Error:", str(e))

    finally:

        db.close()


def start_scheduler():

    # Avoid duplicate scheduler jobs
    if scheduler.get_job("google_fit_sync") is None:

        scheduler.add_job(
            sync_google_fit,
            trigger="interval",
            minutes=30,
            id="google_fit_sync",
            replace_existing=True
        )

    if not scheduler.running:
        scheduler.start()

    print("Google Fit Scheduler Started")