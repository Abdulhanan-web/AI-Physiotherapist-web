import os
import numpy as np
import pandas as pd

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Masking, Input
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split

# -------------------------------
# DATASET PATH
# -------------------------------
data_folder = "Simplified"

# Folder to save models
model_folder = "models"
os.makedirs(model_folder, exist_ok=True)

# -------------------------------
# TRAIN MODEL FOR EACH EXERCISE
# -------------------------------
for gesture_id in range(9):

    print("\n=============================")
    print(f"Training model for Gesture {gesture_id}")
    print("=============================")

    X = []
    y = []

    # -------------------------------
    # LOAD FILES
    # -------------------------------
    for file in os.listdir(data_folder):

        if file.endswith(".txt"):

            parts = file.split("_")

            gesture_label = int(parts[2])

            # Select only this exercise
            if gesture_label == gesture_id:

                filepath = os.path.join(data_folder, file)

                df = pd.read_csv(filepath, header=None)

                sequence = df.values
                X.append(sequence)

                correct_label = int(parts[4])

                # Binary label
                if correct_label == 1:
                    y.append(1)
                else:
                    y.append(0)

    # Skip if no data
    if len(X) == 0:
        print("No samples found")
        continue

    # -------------------------------
    # PAD SEQUENCES
    # -------------------------------
    X_padded = pad_sequences(X, padding="post", dtype="float32")

    X_padded = np.array(X_padded)
    y = np.array(y)

    print("Total samples:", len(X_padded))
    print("Sequence shape:", X_padded.shape)

    # -------------------------------
    # TRAIN TEST SPLIT
    # -------------------------------
    X_train, X_test, y_train, y_test = train_test_split(
        X_padded,
        y,
        test_size=0.2,
        random_state=42
    )

    timesteps = X_train.shape[1]
    features = X_train.shape[2]

    # -------------------------------
    # LSTM MODEL
    # -------------------------------
    model = Sequential([
        Input(shape=(timesteps, features)),
        Masking(mask_value=0.0),
        LSTM(64),
        Dense(32, activation="relu"),
        Dense(1, activation="sigmoid")   # Binary output
    ])

    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )

    model.summary()

    # -------------------------------
    # TRAIN MODEL
    # -------------------------------
    model.fit(
        X_train,
        y_train,
        epochs=20,
        batch_size=32,
        validation_data=(X_test, y_test)
    )

    # -------------------------------
    # SAVE MODEL
    # -------------------------------
    model_path = os.path.join(model_folder, f"gesture_{gesture_id}.h5")

    model.save(model_path)

    print(f"Model saved as {model_path}")

print("\nAll models trained successfully.")