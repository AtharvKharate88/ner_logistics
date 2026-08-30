#File to get data from data/roads/processed/roads_filtered.ge0json
from pathlib import Path
import json
import re

import geopandas as gpd
import pandas as pd


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_DIR = Path(__file__).resolve().parents[1]

ROADS_DIR = (
    PROJECT_DIR
    / "route-engine"
    / "data"
    / "roads"
)

INPUT_FILE = ROADS_DIR / "processed" / "roads_filtered.geojson"
OUTPUT_FILE = ROADS_DIR / "processed" / "roads.geojson"


# ============================================================
# OSM ROAD TYPES WE WANT
# ============================================================

VALID_HIGHWAYS = {
    "motorway",
    "motorway_link",
    "trunk",
    "trunk_link",
    "primary",
    "primary_link",
    "secondary",
    "secondary_link",
    "tertiary",
    "tertiary_link",
    "residential",
    "living_street",
    "unclassified",
    "service",
    "road",
    "track",
}


# ============================================================
# PARSE OSM other_tags
# ============================================================

def parse_other_tags(value):
    """
    Convert GDAL OSM other_tags format:

    "ref"=>"NH44","surface"=>"asphalt","bridge"=>"yes"

    into:

    {
        "ref": "NH44",
        "surface": "asphalt",
        "bridge": "yes"
    }
    """

    if not value or pd.isna(value):
        return {}

    value = str(value)

    tags = {}

    # Match:
    # "key"=>"value"
    pattern = r'"([^"]+)"=>"(.*?)"'

    matches = re.findall(pattern, value)

    for key, val in matches:
        tags[key] = val

    return tags


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print("ROAD DATA PREPROCESSING")
    print("=" * 60)

    # --------------------------------------------------------
    # 1. Check input
    # --------------------------------------------------------

    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"Input file not found:\n{INPUT_FILE}"
        )

    print(f"\nInput:")
    print(INPUT_FILE)

    print("\nLoading roads...")

    roads = gpd.read_file(
        INPUT_FILE,
        engine="pyogrio"
    )

    print(f"Loaded features: {len(roads):,}")

    # --------------------------------------------------------
    # 2. Remove empty / invalid geometries
    # --------------------------------------------------------

    print("\nCleaning geometries...")

    before = len(roads)

    roads = roads[
        roads.geometry.notna()
        & ~roads.geometry.is_empty
    ].copy()

    # Attempt to repair invalid geometries
    invalid_count = (~roads.geometry.is_valid).sum()

    if invalid_count > 0:
        print(f"Invalid geometries found: {invalid_count:,}")

        roads.loc[~roads.geometry.is_valid, "geometry"] = (
            roads.loc[~roads.geometry.is_valid, "geometry"].make_valid()
        )

    roads = roads[
        roads.geometry.notna()
        & ~roads.geometry.is_empty
    ].copy()

    print(
        f"Removed empty geometries: "
        f"{before - len(roads):,}"
    )

    # --------------------------------------------------------
    # 3. Keep only road geometries
    # --------------------------------------------------------

    print("\nFiltering road geometries...")

    roads = roads[
        roads.geometry.geom_type.isin(
            ["LineString", "MultiLineString"]
        )
    ].copy()

    print(f"Road features remaining: {len(roads):,}")

    # --------------------------------------------------------
    # 4. Normalize highway tag
    # --------------------------------------------------------

    print("\nNormalizing highway tags...")

    roads["highway"] = (
        roads["highway"]
        .astype("string")
        .str.strip()
        .str.lower()
    )

    roads = roads[
        roads["highway"].isin(VALID_HIGHWAYS)
    ].copy()

    print(
        f"Features after highway filtering: "
        f"{len(roads):,}"
    )

    # --------------------------------------------------------
    # 5. Extract additional OSM tags
    # --------------------------------------------------------

    print("\nExtracting additional OSM tags...")

    parsed_tags = roads["other_tags"].apply(parse_other_tags)

    # Useful tags for routing / road analysis
    roads["ref"] = parsed_tags.apply(
        lambda x: x.get("ref")
    )

    roads["surface"] = parsed_tags.apply(
        lambda x: x.get("surface")
    )

    roads["bridge"] = parsed_tags.apply(
        lambda x: x.get("bridge")
    )

    roads["tunnel"] = parsed_tags.apply(
        lambda x: x.get("tunnel")
    )

    roads["oneway"] = parsed_tags.apply(
        lambda x: x.get("oneway")
    )

    roads["maxspeed"] = parsed_tags.apply(
        lambda x: x.get("maxspeed")
    )

    roads["lanes"] = parsed_tags.apply(
        lambda x: x.get("lanes")
    )

    # --------------------------------------------------------
    # 6. Clean common fields
    # --------------------------------------------------------

    print("\nCleaning attributes...")

    # OSM ID
    roads["osm_id"] = (
        roads["osm_id"]
        .astype("string")
        .str.strip()
    )

    # Road name
    if "name" in roads.columns:
        roads["name"] = (
            roads["name"]
            .astype("string")
            .str.strip()
        )
    else:
        roads["name"] = None

    # Road reference
    roads["ref"] = (
        roads["ref"]
        .astype("string")
        .str.strip()
    )

    # Surface
    roads["surface"] = (
        roads["surface"]
        .astype("string")
        .str.strip()
        .str.lower()
    )

    # --------------------------------------------------------
    # 7. Normalize boolean OSM tags
    # --------------------------------------------------------

    def normalize_bool(value):

        if value is None or pd.isna(value):
            return False

        value = str(value).lower().strip()

        return value in {
            "yes",
            "true",
            "1",
        }

    roads["bridge"] = roads["bridge"].apply(
        normalize_bool
    )

    roads["tunnel"] = roads["tunnel"].apply(
        normalize_bool
    )

    # --------------------------------------------------------
    # 8. Normalize oneway
    # --------------------------------------------------------

    def normalize_oneway(value):

        if value is None or pd.isna(value):
            return "no"

        value = str(value).lower().strip()

        if value in {"yes", "true", "1"}:
            return "yes"

        if value == "-1":
            return "-1"

        return "no"

    roads["oneway"] = roads["oneway"].apply(
        normalize_oneway
    )

    # --------------------------------------------------------
    # 9. Convert numeric fields
    # --------------------------------------------------------

    roads["z_order"] = pd.to_numeric(
        roads["z_order"],
        errors="coerce"
    )

    roads["maxspeed"] = pd.to_numeric(
        roads["maxspeed"],
        errors="coerce"
    )

    roads["lanes"] = pd.to_numeric(
        roads["lanes"],
        errors="coerce"
    )

    # --------------------------------------------------------
    # 10. Remove duplicate OSM features
    # --------------------------------------------------------

    print("\nRemoving duplicate OSM features...")

    before = len(roads)

    roads = roads.drop_duplicates(
        subset=["osm_id"],
        keep="first"
    )

    print(
        f"Duplicates removed: "
        f"{before - len(roads):,}"
    )

    # --------------------------------------------------------
    # 11. Select final columns
    # --------------------------------------------------------

    final_columns = [
        "osm_id",
        "name",
        "ref",
        "highway",
        "surface",
        "bridge",
        "tunnel",
        "oneway",
        "maxspeed",
        "lanes",
        "z_order",
        "geometry",
    ]

    # Keep only columns that exist
    final_columns = [
        column
        for column in final_columns
        if column in roads.columns
    ]

    roads = roads[final_columns].copy()

    # --------------------------------------------------------
    # 12. Remove rows without highway
    # --------------------------------------------------------

    roads = roads[
        roads["highway"].notna()
        & (roads["highway"] != "")
    ].copy()

    # --------------------------------------------------------
    # 13. Ensure output directory exists
    # --------------------------------------------------------

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    # --------------------------------------------------------
    # 14. Write final GeoJSON
    # --------------------------------------------------------

    print("\nWriting final dataset...")

    roads.to_file(
        OUTPUT_FILE,
        driver="GeoJSON",
        engine="pyogrio"
    )

    # --------------------------------------------------------
    # 15. Final report
    # --------------------------------------------------------

    print("\n" + "=" * 60)
    print("PREPROCESSING COMPLETE")
    print("=" * 60)

    print(f"\nFinal road features: {len(roads):,}")

    print("\nHighway distribution:")

    print(
        roads["highway"]
        .value_counts()
        .to_string()
    )

    print("\nFinal columns:")
    print(", ".join(roads.columns))

    print("\nOutput:")
    print(OUTPUT_FILE)

    print("\nDone.")


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()