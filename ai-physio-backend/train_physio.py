"""
LSTM Model Training for Gesture Label 0 (Correct vs Incorrect Form Detection)
==============================================================================
Dataset: Simplified folder with 75 features per frame (25 joints × 3D coordinates)
Target:  Binary classification — CorrectLabel 1 (correct) vs 2 (incorrect)

File naming convention:
    SubjectID_DateID_GestureLabel_RepetitionNumber_CorrectLabel_Position.txt

Usage:
    python train_lstm_gesture0.py --data_dir /path/to/Simplified
"""

import os
import re
import argparse
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, confusion_matrix, classification_report
)

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    LSTM, Dense, Dropout, Bidirectional,
    BatchNormalization, Masking
)
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
)
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.preprocessing.sequence import pad_sequences

# ─────────────────────────────────────────────
# 0.  Configuration
# ─────────────────────────────────────────────
GESTURE_LABEL    = 8          # Only train on gesture 8
NUM_FEATURES     = 75         # 25 joints × 3 coordinates
SEQUENCE_LENGTH  = None       # None → pad to longest in dataset; set an int to truncate/pad to fixed length
TEST_SIZE        = 0.20
VAL_SIZE         = 0.15       # fraction of training set
RANDOM_SEED      = 42
BATCH_SIZE       = 32
EPOCHS           = 100
LSTM_UNITS_1     = 128
LSTM_UNITS_2     = 64
DENSE_UNITS      = 64
DROPOUT_RATE     = 0.4

# Joint names (informational)
JOINT_NAMES = [
    "SpineBase", "SpineMid", "Neck", "Head",
    "ShoulderLeft", "ElbowLeft", "WristLeft", "HandLeft",
    "ShoulderRight", "ElbowRight", "WristRight", "HandRight",
    "HipLeft", "KneeLeft", "AnkleLeft", "FootLeft",
    "HipRight", "KneeRight", "AnkleRight", "FootRight",
    "SpineShoulder", "HandTipLeft", "ThumbLeft",
    "HandTipRight", "ThumbRight"
]

# ─────────────────────────────────────────────
# 1.  Data Loading
# ─────────────────────────────────────────────
def parse_filename(filename):
    """
    Returns (subject_id, date_id, gesture_label, rep_num, correct_label, position)
    or None if the filename doesn't match the expected pattern.
    """
    name = os.path.splitext(filename)[0]
    parts = name.split("_")
    if len(parts) != 6:
        return None
    try:
        subject_id    = int(parts[0])
        date_id       = int(parts[1])
        gesture_label = int(parts[2])
        rep_num       = int(parts[3])
        correct_label = int(parts[4])
        position      = parts[5]
        return subject_id, date_id, gesture_label, rep_num, correct_label, position
    except ValueError:
        return None


def load_sequence(filepath):
    """Load one .txt file as a numpy array of shape (T, 75)."""
    rows = []
    with open(filepath, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            values = [float(v) for v in line.split(",")]
            if len(values) == NUM_FEATURES:
                rows.append(values)
    return np.array(rows, dtype=np.float32) if rows else None


def load_dataset(data_dir):
    """
    Walk data_dir, filter for GestureLabel == GESTURE_LABEL,
    and return lists of sequences and binary labels.

    Labels:
        CorrectLabel 1  →  0  (correct form)
        CorrectLabel 2  →  1  (incorrect form)
    """
    sequences, labels, meta = [], [], []

    if not os.path.isdir(data_dir):
        raise FileNotFoundError(f"Data directory not found: {data_dir}")

    all_files = [f for f in os.listdir(data_dir)
                 if f.endswith(".txt") or f.endswith(".csv")]

    print(f"Found {len(all_files)} files in '{data_dir}'")
    skipped = 0

    for filename in all_files:
        parsed = parse_filename(filename)
        if parsed is None:
            skipped += 1
            continue

        subject_id, date_id, gesture_label, rep_num, correct_label, position = parsed

        if gesture_label != GESTURE_LABEL:
            continue
        if correct_label not in (1, 2):
            skipped += 1
            continue

        filepath = os.path.join(data_dir, filename)
        seq = load_sequence(filepath)

        if seq is None or len(seq) == 0:
            skipped += 1
            continue

        sequences.append(seq)
        labels.append(0 if correct_label == 1 else 1)   # 0 = correct, 1 = incorrect
        meta.append({
            "file": filename,
            "subject": subject_id,
            "date": date_id,
            "rep": rep_num,
            "correct_label": correct_label,
            "position": position,
            "frames": len(seq)
        })

    print(f"  Loaded  : {len(sequences)} sequences for Gesture {GESTURE_LABEL}")
    print(f"  Skipped : {skipped} files")
    return sequences, np.array(labels, dtype=np.int32), meta


# ─────────────────────────────────────────────
# 2.  Pre-processing
# ─────────────────────────────────────────────
def normalize_sequences(sequences, scaler=None, fit=True):
    """
    Z-score normalise across ALL frames and features.
    Returns normalised sequences and the fitted scaler.
    """
    all_frames = np.vstack(sequences)          # (total_frames, 75)
    if fit:
        scaler = StandardScaler()
        scaler.fit(all_frames)
    normalised = [scaler.transform(seq) for seq in sequences]
    return normalised, scaler


def pad_and_stack(sequences, maxlen=None):
    """
    Pad sequences to the same length and return a 3-D array (N, T, 75).
    """
    if maxlen is None:
        maxlen = max(len(s) for s in sequences)
    padded = pad_sequences(
        sequences,
        maxlen=maxlen,
        dtype="float32",
        padding="post",
        truncating="post",
        value=0.0
    )
    return padded, maxlen


# ─────────────────────────────────────────────
# 3.  Model Definition
# ─────────────────────────────────────────────
def build_lstm_model(seq_len, n_features, n_classes=2):
    """
    Bidirectional LSTM with batch normalisation and dropout.
    """
    model = Sequential([
        Masking(mask_value=0.0, input_shape=(seq_len, n_features)),

        Bidirectional(LSTM(LSTM_UNITS_1, return_sequences=True)),
        BatchNormalization(),
        Dropout(DROPOUT_RATE),

        Bidirectional(LSTM(LSTM_UNITS_2, return_sequences=False)),
        BatchNormalization(),
        Dropout(DROPOUT_RATE),

        Dense(DENSE_UNITS, activation="relu"),
        BatchNormalization(),
        Dropout(DROPOUT_RATE / 2),

        Dense(n_classes, activation="softmax")
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model


# ─────────────────────────────────────────────
# 4.  Training
# ─────────────────────────────────────────────
def train_model(X_train, y_train, X_val, y_val, seq_len):
    model = build_lstm_model(seq_len, NUM_FEATURES, n_classes=2)
    model.summary()

    y_train_cat = to_categorical(y_train, num_classes=2)
    y_val_cat   = to_categorical(y_val,   num_classes=2)

    # Class weights to handle imbalanced data
    class_counts = np.bincount(y_train)
    total = len(y_train)
    class_weights = {i: total / (len(class_counts) * c)
                     for i, c in enumerate(class_counts)}
    print(f"\nClass weights: {class_weights}")

    callbacks = [
        EarlyStopping(
            monitor="val_loss", patience=15,
            restore_best_weights=True, verbose=1
        ),
        ReduceLROnPlateau(
            monitor="val_loss", factor=0.5,
            patience=7, min_lr=1e-6, verbose=1
        ),
        ModelCheckpoint(
            f"best_gesture{GESTURE_LABEL}_lstm.h5", monitor="val_accuracy",
            save_best_only=True, verbose=1
        )
    ]

    history = model.fit(
        X_train, y_train_cat,
        validation_data=(X_val, y_val_cat),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1
    )
    return model, history


# ─────────────────────────────────────────────
# 5.  Evaluation & Plots
# ─────────────────────────────────────────────
def evaluate_model(model, X_test, y_test):
    y_prob = model.predict(X_test, verbose=0)
    y_pred = np.argmax(y_prob, axis=1)

    acc  = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec  = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1   = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    cm   = confusion_matrix(y_test, y_pred)

    print("\n" + "="*55)
    print("           TEST SET EVALUATION RESULTS")
    print("="*55)
    print(f"  Accuracy  : {acc*100:.2f}%")
    print(f"  Precision : {prec*100:.2f}%  (weighted)")
    print(f"  Recall    : {rec*100:.2f}%  (weighted)")
    print(f"  F1 Score  : {f1*100:.2f}%  (weighted)")
    print("="*55)
    print("\nDetailed Classification Report:")
    print(classification_report(
        y_test, y_pred,
        target_names=["Correct (1)", "Incorrect (2)"],
        zero_division=0
    ))
    print("Confusion Matrix:")
    print(cm)

    return y_pred, {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1, "cm": cm}


def plot_training_history(history, save_path="training_history.png"):
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    fig.suptitle(f"LSTM Training History — Gesture {GESTURE_LABEL}", fontsize=14, fontweight="bold")

    axes[0].plot(history.history["loss"],     label="Train Loss")
    axes[0].plot(history.history["val_loss"], label="Val Loss")
    axes[0].set_title("Loss")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    axes[1].plot(history.history["accuracy"],     label="Train Accuracy")
    axes[1].plot(history.history["val_accuracy"], label="Val Accuracy")
    axes[1].set_title("Accuracy")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"\nTraining history plot saved → {save_path}")


def plot_confusion_matrix(cm, save_path="confusion_matrix.png"):
    fig, ax = plt.subplots(figsize=(7, 6))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=["Correct", "Incorrect"],
        yticklabels=["Correct", "Incorrect"],
        ax=ax, linewidths=0.5, linecolor="gray"
    )
    ax.set_title(f"Confusion Matrix — Gesture {GESTURE_LABEL} LSTM", fontsize=13, fontweight="bold")
    ax.set_xlabel("Predicted Label", fontsize=11)
    ax.set_ylabel("True Label", fontsize=11)
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Confusion matrix plot saved  → {save_path}")


def plot_metrics_bar(metrics, save_path="metrics_bar.png"):
    names  = ["Accuracy", "Precision", "Recall", "F1 Score"]
    values = [metrics["accuracy"], metrics["precision"],
              metrics["recall"],   metrics["f1"]]

    colours = ["#4C72B0", "#DD8452", "#55A868", "#C44E52"]
    fig, ax = plt.subplots(figsize=(8, 5))
    bars = ax.bar(names, [v * 100 for v in values], color=colours, edgecolor="white", width=0.5)

    for bar, val in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.5,
            f"{val*100:.1f}%", ha="center", va="bottom", fontweight="bold"
        )

    ax.set_ylim(0, 110)
    ax.set_ylabel("Score (%)", fontsize=11)
    ax.set_title(f"Model Performance Metrics — Gesture {GESTURE_LABEL}", fontsize=13, fontweight="bold")
    ax.grid(axis="y", alpha=0.3)
    plt.tight_layout()
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Metrics bar chart saved      → {save_path}")


# ─────────────────────────────────────────────
# 6.  Main Pipeline
# ─────────────────────────────────────────────
def main(data_dir):
    np.random.seed(RANDOM_SEED)
    tf.random.set_seed(RANDOM_SEED)

    # ── 6.1  Load ──────────────────────────────
    print("\n[1/6] Loading data …")
    sequences, labels, meta = load_dataset(data_dir)

    if len(sequences) == 0:
        raise RuntimeError(
            f"No sequences found for Gesture {GESTURE_LABEL} in '{data_dir}'.\n"
            "Check that the filenames follow the pattern "
            "SubjectID_DateID_GestureLabel_RepetitionNumber_CorrectLabel_Position.txt"
        )

    print(f"\nClass distribution:")
    unique, counts = np.unique(labels, return_counts=True)
    for u, c in zip(unique, counts):
        name = "Correct" if u == 0 else "Incorrect"
        print(f"  {name} (label {u}): {c} sequences")

    frame_lengths = [len(s) for s in sequences]
    print(f"\nSequence length — min: {min(frame_lengths)}, "
          f"max: {max(frame_lengths)}, "
          f"mean: {np.mean(frame_lengths):.0f}")

    # ── 6.2  Train / Test split ─────────────────
    print("\n[2/6] Splitting data …")
    idx = np.arange(len(sequences))
    idx_train, idx_test = train_test_split(
        idx, test_size=TEST_SIZE,
        random_state=RANDOM_SEED, stratify=labels
    )
    idx_train, idx_val = train_test_split(
        idx_train, test_size=VAL_SIZE,
        random_state=RANDOM_SEED, stratify=labels[idx_train]
    )

    train_seqs = [sequences[i] for i in idx_train]
    val_seqs   = [sequences[i] for i in idx_val]
    test_seqs  = [sequences[i] for i in idx_test]

    y_train = labels[idx_train]
    y_val   = labels[idx_val]
    y_test  = labels[idx_test]

    print(f"  Train : {len(train_seqs)} | Val : {len(val_seqs)} | Test : {len(test_seqs)}")

    # ── 6.3  Normalise ──────────────────────────
    print("\n[3/6] Normalising …")
    train_seqs, scaler = normalize_sequences(train_seqs, fit=True)
    val_seqs,   _      = normalize_sequences(val_seqs,   scaler=scaler, fit=False)
    test_seqs,  _      = normalize_sequences(test_seqs,  scaler=scaler, fit=False)

    # ── 6.4  Pad sequences ──────────────────────
    print("\n[4/6] Padding sequences …")
    max_len = SEQUENCE_LENGTH  # None → computed from training set
    if max_len is None:
        max_len = max(len(s) for s in train_seqs)

    X_train, _ = pad_and_stack(train_seqs, maxlen=max_len)
    X_val,   _ = pad_and_stack(val_seqs,   maxlen=max_len)
    X_test,  _ = pad_and_stack(test_seqs,  maxlen=max_len)

    print(f"  Input shape: (N, {max_len}, {NUM_FEATURES})")

    # ── 6.5  Train ──────────────────────────────
    print("\n[5/6] Training LSTM model …")
    model, history = train_model(X_train, y_train, X_val, y_val, seq_len=max_len)

    # ── 6.6  Evaluate ───────────────────────────
    print("\n[6/6] Evaluating on test set …")
    y_pred, metrics = evaluate_model(model, X_test, y_test)

    # ── Save artefacts ──────────────────────────
    model_path = f"gesture{GESTURE_LABEL}_lstm_model.h5"
    model.save(model_path)
    print(f"\nModel saved → {model_path}")

    # Save best checkpoint under a clearer name too
    if os.path.exists(f"best_gesture{GESTURE_LABEL}_lstm.h5"):
        print(f"Best checkpoint → best_gesture{GESTURE_LABEL}_lstm.h5")

    plot_training_history(history, "training_history.png")
    plot_confusion_matrix(metrics["cm"], "confusion_matrix.png")
    plot_metrics_bar(metrics, "metrics_bar.png")

    # Save metrics to CSV
    metrics_df = pd.DataFrame([{
        "gesture":   GESTURE_LABEL,
        "accuracy":  round(metrics["accuracy"],  4),
        "precision": round(metrics["precision"], 4),
        "recall":    round(metrics["recall"],    4),
        "f1_score":  round(metrics["f1"],        4),
        "test_size": len(y_test),
        "train_size": len(y_train),
    }])
    metrics_df.to_csv("metrics_summary.csv", index=False)
    print("Metrics summary saved → metrics_summary.csv")

    print("\n✅  Done!")
    return model, history, metrics


# ─────────────────────────────────────────────
if __name__ == "__main__":
    # Simplified folder is expected to sit next to this script
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR   = os.path.join(SCRIPT_DIR, "Simplified")
    main(DATA_DIR)