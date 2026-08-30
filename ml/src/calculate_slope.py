import rasterio
import numpy as np
import pandas as pd

# Input DEM
input_file = "ml/data/raw/dem/NER_DEM.tif"

# Output terrain CSV
output_file = "ml/data/processed/terrain.csv"

with rasterio.open(input_file) as src:

    # Basic DEM information
    print("CRS:", src.crs)
    print("Width:", src.width)
    print("Height:", src.height)
    print("Bounds:", src.bounds)
    print("Resolution:", src.res)

    # Read elevation
    elevation = src.read(1).astype("float32")

    # Handle NoData
    if src.nodata is not None:
        elevation[elevation == src.nodata] = np.nan

    # Pixel size
    x_res = src.res[0]
    y_res = src.res[1]

    # Calculate gradient
    dz_dy, dz_dx = np.gradient(
        elevation,
        y_res,
        x_res
    )

    # Calculate slope in degrees
    slope = np.degrees(
        np.arctan(
            np.sqrt(dz_dx**2 + dz_dy**2)
        )
    )

    # Create coordinate grids
    rows, cols = np.indices(elevation.shape)

    xs, ys = rasterio.transform.xy(
        src.transform,
        rows,
        cols
    )

    longitude = np.array(xs)
    latitude = np.array(ys)

# Convert to 1D arrays
df = pd.DataFrame({
    "latitude": latitude.ravel(),
    "longitude": longitude.ravel(),
    "elevation": elevation.ravel(),
    "slope": slope.ravel()
})

# Remove pixels without elevation
df = df.dropna(subset=["elevation"])

# Save
df.to_csv(output_file, index=False)

print("\nTerrain data created successfully!")
print("Output:", output_file)
print("Total rows:", len(df))

print("\nFirst 10 rows:")
print(df.head(10))

print("\nElevation statistics:")
print(df["elevation"].describe())

print("\nSlope statistics:")
print(df["slope"].describe())