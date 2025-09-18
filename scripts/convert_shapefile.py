#!/usr/bin/env python3
"""
Convert SAL shapefile to GeoJSON for WA suburbs only
"""

import geopandas as gpd
import json
import os

def convert_shapefile_to_geojson():
    """Convert the SAL shapefile to GeoJSON, filtering for WA suburbs only"""

    # Read the shapefile
    shapefile_path = "../scripts/data/geographic/SAL_2021_AUST_GDA2020/SAL_2021_AUST_GDA2020.shp"

    print("Loading shapefile...")
    gdf = gpd.read_file(shapefile_path)

    # Print some info about the data
    print(f"Total features: {len(gdf)}")
    print(f"Columns: {list(gdf.columns)}")

    # Filter for WA suburbs only
    # Check column names first
    print("\nFirst few rows:")
    print(gdf.head())

    # Look for state/territory column
    state_columns = [col for col in gdf.columns if 'STE' in col.upper() or 'STATE' in col.upper()]
    print(f"State columns found: {state_columns}")

    if state_columns:
        state_col = state_columns[0]
        unique_states = gdf[state_col].unique()
        print(f"Unique values in {state_col}: {unique_states}")

        # Filter for WA (might be '5' for WA or 'WA' depending on format)
        wa_filter = gdf[state_col].isin(['5', 'WA', 'Western Australia'])
        wa_gdf = gdf[wa_filter]
        print(f"WA suburbs found: {len(wa_gdf)}")
    else:
        print("No state column found, keeping all data")
        wa_gdf = gdf

    # Convert to WGS84 (EPSG:4326) for web mapping
    print("Converting to WGS84...")
    wa_gdf = wa_gdf.to_crs('EPSG:4326')

    # Simplify geometries to reduce file size (tolerance in degrees)
    print("Simplifying geometries...")
    wa_gdf['geometry'] = wa_gdf['geometry'].simplify(tolerance=0.001)

    # Create output directory
    output_dir = "src/data/geographic"
    os.makedirs(output_dir, exist_ok=True)

    # Export to GeoJSON
    output_path = f"{output_dir}/wa_suburbs.geojson"
    print(f"Saving to {output_path}...")

    wa_gdf.to_file(output_path, driver='GeoJSON')

    print(f"Successfully created {output_path}")
    print(f"File size: {os.path.getsize(output_path) / 1024 / 1024:.2f} MB")

    return output_path

if __name__ == "__main__":
    convert_shapefile_to_geojson()