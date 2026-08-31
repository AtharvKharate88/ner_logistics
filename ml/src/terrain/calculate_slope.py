import rasterio
import numpy as np
import pandas as pd

input_file = "ml/data/raw/dem/NER_DEM.tif"
output_file = "ml/data/processed/terrain.csv"

with rasterio.open(input_file) as src:

    elevation = src.read(1).astype("float32")

    if src.nodata is not None:
        elevation[elevation == src.nodata] = np.nan

    x_res = src.res[0]
    y_res = src.res[1]

    dz_dy, dz_dx = np.gradient(
        elevation,
        y_res,
        x_res
    )

    slope = np.degrees(
        np.arctan(
            np.sqrt(dz_dx**2 + dz_dy**2)
        )
    )

    rows, cols = np.indices(elevation.shape)
    xs, ys = rasterio.transform.xy(
        src.transform,
        rows,
        cols
    )

    longitude = np.array(xs)
    latitude = np.array(ys)

df = pd.DataFrame({
    "latitude": latitude.ravel(),
    "longitude": longitude.ravel(),
    "elevation": elevation.ravel(),
    "slope": slope.ravel()
})

df = df.dropna(subset=["elevation"])

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
