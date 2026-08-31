import xarray as xr

file = "ml/data/raw/rainfall/rainfall_file.nc"

ds = xr.open_dataset(file)

print(ds)
