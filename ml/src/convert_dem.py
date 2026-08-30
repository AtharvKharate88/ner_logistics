import rasterio
import pandas as pd

input_file = "ml/data/raw/dem/NER_DEM.tif"
output_file = "ml/data/processed/NER_DEM.csv"

with rasterio.open(input_file) as src:
    data = src.read(1)

    rows, cols = data.shape

    records = []

    for row in range(rows):
        for col in range(cols):
            x, y = src.xy(row, col)

            records.append({
                "longitude": x,
                "latitude": y,
                "elevation": data[row, col]
            })

df = pd.DataFrame(records)

df.to_csv(output_file, index=False)

print(f"CSV created successfully: {output_file}")
print(f"Total rows: {len(df)}")