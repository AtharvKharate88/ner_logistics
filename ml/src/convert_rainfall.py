import xarray as xr
import pandas as pd

# Input rainfall dataset
input_file = "ml/data/raw/rainfall/rainfall_file.nc"

# Output CSV
output_file = "ml/data/processed/rainfall_ner.csv"

# Open NetCDF
ds = xr.open_dataset(input_file)

print("Original dataset:")
print(ds)

# Filter Northeast India
ner = ds.sel(
    LATITUDE=slice(21, 29),
    LONGITUDE=slice(88, 98)
)

print("\nFiltered Northeast dataset:")
print(ner)

# Convert to DataFrame
df = ner["RAINFALL"].to_dataframe().reset_index()

# Save CSV
df.to_csv(output_file, index=False)

print("\nCSV created successfully!")
print(f"Output: {output_file}")
print(f"Total rows: {len(df)}")
print("\nFirst 10 rows:")
print(df.head(10))