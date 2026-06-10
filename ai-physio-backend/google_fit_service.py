import os
import requests
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

import models

# ----------------------------
# Load Environment Variables
# ----------------------------

basedir = os.path.dirname(__file__)
load_dotenv(os.path.join(basedir, ".env"))

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")


# ==========================================================
# Get Valid Access Token
# ==========================================================

def get_valid_access_token(db, user_id):

    connection = (
        db.query(models.GoogleFitConnection)
        .filter(models.GoogleFitConnection.user_id == user_id)
        .first()
    )

    if not connection:
        return None

    # Token still valid
    if (
        connection.expires_at is not None
        and connection.expires_at > datetime.utcnow()
    ):
        return connection.access_token

    # Refresh token
    response = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "refresh_token": connection.refresh_token,
            "grant_type": "refresh_token",
        },
    )

    if response.status_code != 200:
        print("Failed to refresh token")
        print(response.text)
        return None

    tokens = response.json()

    connection.access_token = tokens["access_token"]

    connection.expires_at = (
        datetime.utcnow()
        + timedelta(seconds=tokens.get("expires_in", 3600))
    )

    db.commit()

    return connection.access_token


# ==========================================================
# Fetch Today's Fitness Data
# ==========================================================

def fetch_fitness_data(access_token):

    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Today's midnight (UTC)

    now = datetime.now(timezone.utc)

    midnight = now.replace(
        hour=0,
        minute=0,
        second=0,
        microsecond=0
    )

    start_time = int(midnight.timestamp() * 1000)
    end_time = int(now.timestamp() * 1000)

    body = {
        "aggregateBy": [
            {
                "dataTypeName": "com.google.step_count.delta"
            },
            {
                "dataTypeName": "com.google.calories.expended"
            },
            {
                "dataTypeName": "com.google.distance.delta"
            },
            {
                "dataTypeName": "com.google.heart_rate.bpm"
            },
        ],
        "startTimeMillis": start_time,
        "endTimeMillis": end_time,
    }

    response = requests.post(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        headers=headers,
        json=body,
    )

    if response.status_code != 200:
        print(response.text)
        return {
            "steps": 0,
            "calories": 0,
            "distance": 0,
            "heart_rate": 0,
        }

    data = response.json()

    result = {
        "steps": 0,
        "calories": 0.0,
        "distance": 0.0,
        "heart_rate": 0.0,
    }

    for bucket in data.get("bucket", []):

        for dataset in bucket.get("dataset", []):

            for point in dataset.get("point", []):

                data_type = point.get("dataTypeName", "")

                values = point.get("value", [])

                if not values:
                    continue

                value = values[0]

                if data_type == "com.google.step_count.delta":
                    result["steps"] += value.get(
                        "intVal",
                        0,
                    )

                elif data_type == "com.google.calories.expended":
                    result["calories"] += value.get(
                        "fpVal",
                        0,
                    )

                elif data_type == "com.google.distance.delta":
                    result["distance"] += value.get(
                        "fpVal",
                        0,
                    )

                elif data_type == "com.google.heart_rate.bpm":

                    hr = value.get("fpVal")

                    if hr is not None:
                        result["heart_rate"] = hr

    # convert meters → km

    result["distance"] = round(
        result["distance"] / 1000,
        2,
    )

    result["calories"] = round(
        result["calories"],
        2,
    )

    result["heart_rate"] = round(
        result["heart_rate"],
        2,
    )

    print("Google Fit Data")
    print(result)

    return result