import pandas as pd

# Input file
input_file = "ml/data/processed/rainfall_ner.csv"

# Output file
output_file = "ml/data/processed/rainfall_ner_features.csv"

# Read rainfall data
df = pd.read_csv(input_file)

# Convert TIME to datetime
df["TIME"] = pd.to_datetime(df["TIME"])

# Sort by location and date
df = df.sort_values(
    ["LATITUDE", "LONGITUDE", "TIME"]
)

# Calculate rolling rainfall features
df["rainfall_1d"] = (
    df.groupby(["LATITUDE", "LONGITUDE"])["RAINFALL"]
    .transform(lambda x: x.rolling(1, min_periods=1).sum())
)

df["rainfall_3d"] = (
    df.groupby(["LATITUDE", "LONGITUDE"])["RAINFALL"]
    .transform(lambda x: x.rolling(3, min_periods=1).sum())
)

df["rainfall_7d"] = (
    df.groupby(["LATITUDE", "LONGITUDE"])["RAINFALL"]
    .transform(lambda x: x.rolling(7, min_periods=1).sum())
)

# Save
df.to_csv(output_file, index=False)

print("Rainfall features created successfully!")
print(f"Output: {output_file}")
print(f"Total rows: {len(df)}")
print("\nFirst 10 rows:")
print(df.head(10))