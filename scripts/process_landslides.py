from pathlib import Path
import unicodedata

import pandas as pd


# --------------------------------------------------
# Project paths
# --------------------------------------------------

PROJECT_DIR = Path(__file__).resolve().parents[1]

INPUT_FILE = (
    PROJECT_DIR
    / "ml"
    / "data"
    / "raw"
    / "Global_Landslide_Catalog_Export_rows.csv"
)

OUTPUT_DIR = (
    PROJECT_DIR
    / "ml"
    / "data"
    / "processed"
)

OUTPUT_FILE = OUTPUT_DIR / "landslides_ner.csv"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# --------------------------------------------------
# Northeast India states
# --------------------------------------------------

NORTHEAST_STATES = {
    "assam",
    "arunachal pradesh",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "sikkim",
    "tripura",
}


# --------------------------------------------------
# Canonical state names
# --------------------------------------------------

CANONICAL_STATES = {
    "assam": "Assam",
    "arunachal pradesh": "Arunachal Pradesh",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "sikkim": "Sikkim",
    "tripura": "Tripura",
}


# --------------------------------------------------
# Helper functions
# --------------------------------------------------

def normalize_text(value):
    """
    Normalize text by:
    - converting to string
    - removing surrounding spaces
    - removing accents/diacritics
    - converting to lowercase
    """

    if pd.isna(value):
        return ""

    value = str(value).strip()

    value = unicodedata.normalize("NFKD", value)

    value = "".join(
        char
        for char in value
        if not unicodedata.combining(char)
    )

    return value.lower()


# --------------------------------------------------
# Main processing
# --------------------------------------------------

def main():

    print("==========================================")
    print("Landslide Dataset Preprocessing")
    print("==========================================")

    # --------------------------------------------------
    # Step 1: Check input
    # --------------------------------------------------

    print("\nChecking input file...")

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Landslide dataset not found:\n{INPUT_FILE}"
        )

    print(f"Input: {INPUT_FILE}")


    # --------------------------------------------------
    # Step 2: Load dataset
    # --------------------------------------------------

    print("\nLoading dataset...")

    df = pd.read_csv(INPUT_FILE)

    print(f"Original records: {len(df)}")
    print(f"Original columns: {len(df.columns)}")


    # --------------------------------------------------
    # Step 3: Verify required columns
    # --------------------------------------------------

    required_columns = [
        "event_id",
        "event_date",
        "landslide_category",
        "landslide_trigger",
        "landslide_size",
        "landslide_setting",
        "country_name",
        "country_code",
        "admin_division_name",
        "location_description",
        "longitude",
        "latitude",
        "fatality_count",
        "injury_count",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            "Missing required columns:\n"
            + "\n".join(missing_columns)
        )

    print("Required columns verified.")


    # --------------------------------------------------
    # Step 4: Filter India
    # --------------------------------------------------

    print("\nFiltering India...")

    df["country_normalized"] = (
        df["country_name"]
        .apply(normalize_text)
    )

    df = df[
        df["country_normalized"] == "india"
    ].copy()

    print(
        f"Records after India filter: {len(df)}"
    )


    # --------------------------------------------------
    # Step 5: Normalize state names
    # --------------------------------------------------

    print("\nNormalizing state names...")

    df["state_normalized"] = (
        df["admin_division_name"]
        .apply(normalize_text)
    )


    # --------------------------------------------------
    # Step 6: Filter Northeast India
    # --------------------------------------------------

    print("\nFiltering Northeast India...")

    df = df[
        df["state_normalized"].isin(NORTHEAST_STATES)
    ].copy()

    print(
        f"Records after Northeast India filter: {len(df)}"
    )


    # --------------------------------------------------
    # Step 7: Convert state names to canonical names
    # --------------------------------------------------

    df["admin_division_name"] = (
        df["state_normalized"]
        .map(CANONICAL_STATES)
    )


    # --------------------------------------------------
    # Step 8: Clean coordinates
    # --------------------------------------------------

    print("\nCleaning coordinates...")

    df["latitude"] = pd.to_numeric(
        df["latitude"],
        errors="coerce"
    )

    df["longitude"] = pd.to_numeric(
        df["longitude"],
        errors="coerce"
    )

    before_coordinates = len(df)

    df = df[
        df["latitude"].between(-90, 90)
        & df["longitude"].between(-180, 180)
    ].copy()

    removed_coordinates = (
        before_coordinates - len(df)
    )

    print(
        f"Invalid/missing coordinates removed: "
        f"{removed_coordinates}"
    )


    # --------------------------------------------------
    # Step 9: Clean dates
    # --------------------------------------------------

    print("\nCleaning event dates...")

    df["date"] = pd.to_datetime(
        df["event_date"],
        errors="coerce"
    )

    before_dates = len(df)

    df = df[
        df["date"].notna()
    ].copy()

    removed_dates = (
        before_dates - len(df)
    )

    print(
        f"Invalid/missing dates removed: "
        f"{removed_dates}"
    )

    # Keep date only
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")


    # --------------------------------------------------
    # Step 10: Remove duplicate events
    # --------------------------------------------------

    print("\nRemoving duplicate events...")

    before_duplicates = len(df)

    df = df.drop_duplicates(
        subset=["event_id"]
    ).copy()

    removed_duplicates = (
        before_duplicates - len(df)
    )

    print(
        f"Duplicate events removed: "
        f"{removed_duplicates}"
    )


    # --------------------------------------------------
    # Step 11: Select useful columns
    # --------------------------------------------------

    print("\nSelecting useful columns...")

    output_columns = [
        "event_id",
        "date",
        "latitude",
        "longitude",
        "landslide_category",
        "landslide_trigger",
        "landslide_size",
        "landslide_setting",
        "admin_division_name",
        "location_description",
        "fatality_count",
        "injury_count",
        "country_code",
    ]

    df = df[output_columns].copy()


    # --------------------------------------------------
    # Step 12: Clean text fields
    # --------------------------------------------------

    text_columns = [
        "landslide_category",
        "landslide_trigger",
        "landslide_size",
        "landslide_setting",
        "admin_division_name",
        "location_description",
    ]

    for column in text_columns:
        df[column] = (
            df[column]
            .astype("string")
            .str.strip()
        )


    # --------------------------------------------------
    # Step 13: Sort dataset
    # --------------------------------------------------

    df = df.sort_values(
        by=["date", "event_id"]
    ).reset_index(drop=True)


    # --------------------------------------------------
    # Step 14: Save final dataset
    # --------------------------------------------------

    print("\nSaving processed dataset...")

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print(f"Output: {OUTPUT_FILE}")
    print(f"Final records: {len(df)}")
    print(f"Final columns: {len(df.columns)}")


    # --------------------------------------------------
    # Step 15: Final summary
    # --------------------------------------------------

    print("\n==========================================")
    print("Processing completed successfully")
    print("==========================================")

    print("\nLandslides by Northeast state:")

    print(
        df["admin_division_name"]
        .value_counts()
    )

    print("\nLandslide categories:")

    print(
        df["landslide_category"]
        .value_counts()
    )

    print("\nLandslide triggers:")

    print(
        df["landslide_trigger"]
        .value_counts()
    )


if __name__ == "__main__":
    main()