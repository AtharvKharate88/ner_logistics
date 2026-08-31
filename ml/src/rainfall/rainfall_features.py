import pandas as pd

input_file = "ml/data/processed/rainfall_ner.csv"
output_file = "ml/data/processed/rainfall_ner_features.csv"

df = pd.read_csv(input_file)

df["TIME"] = pd.to_datetime(df["TIME"])

df = df.sort_values(
    ["LATITUDE", "LONGITUDE", "TIME"]
)

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

df.to_csv(output_file, index=False)

print("Rainfall features created successfully!")
print(f"Output: {output_file}")
print(f"Total rows: {len(df)}")
print("\nFirst 10 rows:")
print(df.head(10))
