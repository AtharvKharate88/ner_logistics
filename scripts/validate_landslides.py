#To validate the generated .csv
from pathlib import Path
import pandas as pd


# --------------------------------------------------
# Paths
# --------------------------------------------------

PROJECT_DIR = Path(__file__).resolve().parents[1]

INPUT_FILE = (
    PROJECT_DIR
    / "ml"
    / "data"
    / "processed"
    / "landslides_ner.csv"
)


# --------------------------------------------------
# Load
# --------------------------------------------------

print("==========================================")
print("Landslide Dataset Validation")
print("==========================================")

df = pd.read_csv(INPUT_FILE)

print(f"\nRecords: {len(df)}")
print(f"Columns: {len(df.columns)}")

print("\nColumns:")
print(df.columns.tolist())


# --------------------------------------------------
# Missing values
# --------------------------------------------------

print("\n------------------------------------------")
print("Missing values")
print("------------------------------------------")

print(df.isnull().sum())


# --------------------------------------------------
# Coordinate validation
# --------------------------------------------------

print("\n------------------------------------------")
print("Coordinate validation")
print("------------------------------------------")

invalid_latitude = (
    ~df["latitude"].between(-90, 90)
).sum()

invalid_longitude = (
    ~df["longitude"].between(-180, 180)
).sum()

print(f"Invalid latitude: {invalid_latitude}")
print(f"Invalid longitude: {invalid_longitude}")


# --------------------------------------------------
# Date validation
# --------------------------------------------------

print("\n------------------------------------------")
print("Date validation")
print("------------------------------------------")

dates = pd.to_datetime(
    df["date"],
    errors="coerce"
)

print(f"Invalid dates: {dates.isna().sum()}")
print(f"Earliest date: {dates.min()}")
print(f"Latest date: {dates.max()}")


# --------------------------------------------------
# Duplicate validation
# --------------------------------------------------

print("\n------------------------------------------")
print("Duplicate validation")
print("------------------------------------------")

duplicate_events = df["event_id"].duplicated().sum()

print(f"Duplicate event IDs: {duplicate_events}")


# --------------------------------------------------
# State distribution
# --------------------------------------------------

print("\n------------------------------------------")
print("Northeast state distribution")
print("------------------------------------------")

print(
    df["admin_division_name"]
    .value_counts()
)


# --------------------------------------------------
# Category distribution
# --------------------------------------------------

print("\n------------------------------------------")
print("Landslide categories")
print("------------------------------------------")

print(
    df["landslide_category"]
    .value_counts(dropna=False)
)


# --------------------------------------------------
# Trigger distribution
# --------------------------------------------------

print("\n------------------------------------------")
print("Landslide triggers")
print("------------------------------------------")

print(
    df["landslide_trigger"]
    .value_counts(dropna=False)
)


# --------------------------------------------------
# Final result
# --------------------------------------------------

print("\n==========================================")
print("Validation completed")
print("==========================================")