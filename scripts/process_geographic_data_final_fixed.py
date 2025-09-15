#!/usr/bin/env python3
"""
WA Suburb Expansion - Final Fixed Version

FIXES:
1. Police district spatial intersection pandas boolean error
2. Enhanced SA2 mapping with name-based fallback
3. Improved error handling and validation
"""

import geopandas as gpd
import pandas as pd
import json
import os
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WASuburbProcessorFinalFixed:
    def __init__(self, data_dir: str = "./data/geographic"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        # Output directory for processed data
        self.output_dir = Path("./src/data/processed")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def extract_wa_suburbs_from_sal(self, sal_shapefile_path: str) -> gpd.GeoDataFrame:
        """Extract Western Australia suburbs from ABS SAL shapefile with proper CRS handling"""
        logger.info("🏗️ Loading ABS SAL shapefile...")

        sal_gdf = gpd.read_file(sal_shapefile_path)

        logger.info(f"📊 Total features loaded: {len(sal_gdf)}")
        logger.info(f"🗺️ Current CRS: {sal_gdf.crs}")

        # Find the correct column names
        sal_code_col = None
        sal_name_col = None
        state_col = None

        for col in sal_gdf.columns:
            col_upper = col.upper()
            if 'SAL_CODE' in col_upper:
                sal_code_col = col
            elif 'SAL_NAME' in col_upper:
                sal_name_col = col
            elif 'STE_NAME' in col_upper:
                state_col = col

        if not sal_code_col or not sal_name_col:
            logger.error(f"❌ Could not find required SAL columns")
            return gpd.GeoDataFrame()

        # Filter for Western Australia
        wa_suburbs = sal_gdf[sal_gdf[state_col] == 'Western Australia'].copy()
        logger.info(f"🏘️ Found {len(wa_suburbs)} WA suburbs")

        # Clean and standardize
        wa_suburbs['sal_code'] = wa_suburbs[sal_code_col].astype(str)
        wa_suburbs['sal_name'] = wa_suburbs[sal_name_col].astype(str)
        wa_suburbs['state'] = 'WA'

        # Proper CRS handling
        logger.info("📐 Calculating coordinates with proper CRS transformation...")
        wa_suburbs_projected = wa_suburbs.to_crs('EPSG:3577')
        centroids_wgs84 = wa_suburbs_projected.geometry.centroid.to_crs('EPSG:4326')

        wa_suburbs['latitude'] = centroids_wgs84.y
        wa_suburbs['longitude'] = centroids_wgs84.x
        wa_suburbs['area_km2'] = wa_suburbs_projected.geometry.area / 1_000_000

        if 'AREASQKM21' in wa_suburbs.columns:
            wa_suburbs['abs_area_km2'] = wa_suburbs['AREASQKM21'].astype(float)

        logger.info("✅ Successfully processed WA suburbs")
        return wa_suburbs

    def load_locality_sa2_correspondence(self, correspondence_file: str) -> pd.DataFrame:
        """Load and process correspondence file"""
        logger.info(f"📖 Loading correspondence file...")

        try:
            if correspondence_file.endswith('.xlsx'):
                df = pd.read_excel(correspondence_file)
            else:
                df = pd.read_csv(correspondence_file)

            logger.info(f"📊 Loaded {len(df)} correspondence records")

            # Find columns
            locality_col = locality_name_col = sa2_col = sa2_name_col = None

            for col in df.columns:
                col_upper = col.upper()
                if 'LOCALITY_PID' in col_upper and '2021' in col_upper:
                    locality_col = col
                elif 'LOCALITY_NAME' in col_upper and '2021' in col_upper:
                    locality_name_col = col
                elif 'SA2_CODE' in col_upper and '2021' in col_upper:
                    sa2_col = col
                elif 'SA2_NAME' in col_upper and '2021' in col_upper:
                    sa2_name_col = col

            if not locality_name_col or not sa2_col:
                logger.error("❌ Missing required columns")
                return pd.DataFrame()

            logger.info("✅ Correspondence file loaded successfully")

            # Store column info
            df._locality_col = locality_col
            df._locality_name_col = locality_name_col
            df._sa2_col = sa2_col
            df._sa2_name_col = sa2_name_col

            return df

        except Exception as e:
            logger.error(f"❌ Error loading correspondence: {e}")
            return pd.DataFrame()

    def load_police_districts(self, police_shapefile_path: str) -> gpd.GeoDataFrame:
        """Load WA Police districts"""
        logger.info("🚔 Loading police districts...")

        police_gdf = gpd.read_file(police_shapefile_path)
        logger.info(f"📊 Found {len(police_gdf)} police districts")

        # Find district column
        district_col = None
        for col in police_gdf.columns:
            if 'DISTRICT' in col.upper():
                district_col = col
                break

        if district_col:
            police_gdf['police_district'] = police_gdf[district_col].astype(str)
            districts = police_gdf['police_district'].unique()
            logger.info(f"🏢 Districts: {list(districts)}")
        else:
            logger.warning("⚠️ No district column found")
            police_gdf['police_district'] = 'Unknown'

        return police_gdf

    def spatial_intersection_suburbs_police(
        self,
        suburbs_gdf: gpd.GeoDataFrame,
        police_gdf: gpd.GeoDataFrame
    ) -> gpd.GeoDataFrame:
        """FIXED: Spatial intersection with proper error handling"""
        logger.info("🗺️ Performing spatial intersection...")

        # Convert to common CRS
        target_crs = 'EPSG:3577'
        suburbs_proj = suburbs_gdf.to_crs(target_crs)
        police_proj = police_gdf.to_crs(target_crs)

        try:
            # Initial spatial join
            logger.info("🎯 Attempting 'within' spatial join...")
            result = gpd.sjoin(
                suburbs_proj,
                police_proj[['geometry', 'police_district']],
                how='left',
                predicate='within'
            )

            within_count = result['police_district'].notna().sum()
            logger.info(f"✅ Within join: {within_count}/{len(suburbs_proj)} suburbs")

            # FIXED: Retry logic with proper boolean handling
            unmapped_mask = result['police_district'].isna()
            unmapped_count = unmapped_mask.sum()

            if unmapped_count > 0:
                logger.info(f"🔄 Retrying {unmapped_count} suburbs with intersects...")

                # Get unmapped suburbs
                unmapped_indices = unmapped_mask[unmapped_mask].index
                unmapped_suburbs = suburbs_proj.loc[unmapped_indices].copy()

                # Intersects join for unmapped suburbs
                intersects_result = gpd.sjoin(
                    unmapped_suburbs,
                    police_proj[['geometry', 'police_district']],
                    how='left',
                    predicate='intersects'
                )

                # Update results - FIXED: Proper indexing
                for idx in intersects_result.index:
                    if pd.notna(intersects_result.loc[idx, 'police_district']):
                        result.loc[idx, 'police_district'] = intersects_result.loc[idx, 'police_district']

            # Calculate confidence
            result['police_mapping_confidence'] = result['police_district'].notna().astype(float)

            # Convert back to original CRS
            result = result.to_crs(suburbs_gdf.crs)

            final_count = result['police_district'].notna().sum()
            logger.info(f"🎉 Final police mapping: {final_count}/{len(result)} ({final_count/len(result)*100:.1f}%)")

            return result

        except Exception as e:
            logger.error(f"❌ Spatial intersection failed: {e}")
            # Fallback: return original with empty police districts
            suburbs_gdf['police_district'] = ''
            suburbs_gdf['police_mapping_confidence'] = 0.0
            return suburbs_gdf

    def create_enhanced_suburb_records(
        self,
        suburbs_gdf: gpd.GeoDataFrame,
        correspondence_df: pd.DataFrame
    ) -> List[Dict]:
        """ENHANCED: Better SA2 mapping with name fallback"""
        logger.info("🏗️ Creating enhanced suburb records...")

        enhanced_suburbs = []
        successful_sa2_mappings = 0

        for idx, suburb in suburbs_gdf.iterrows():
            sa2_mappings = []

            # SA2 mapping with enhanced matching
            if not correspondence_df.empty and hasattr(correspondence_df, '_locality_name_col'):
                locality_name_col = correspondence_df._locality_name_col
                sa2_col = correspondence_df._sa2_col
                sa2_name_col = correspondence_df._sa2_name_col

                # Clean suburb name for matching
                suburb_name_clean = suburb['sal_name'].upper().strip()

                # Try exact name match first
                name_matches = correspondence_df[
                    correspondence_df[locality_name_col].str.upper().str.strip() == suburb_name_clean
                ]

                # Try partial name match if no exact match
                if len(name_matches) == 0:
                    # Remove common suffixes for better matching
                    clean_patterns = [' (WA)', ' - WA', ' LOCALITY', ' SUBURB']
                    for pattern in clean_patterns:
                        if pattern in suburb_name_clean:
                            suburb_name_clean = suburb_name_clean.replace(pattern, '')
                            break

                    name_matches = correspondence_df[
                        correspondence_df[locality_name_col].str.upper().str.contains(
                            suburb_name_clean.split()[0] if suburb_name_clean else suburb_name_clean,
                            na=False, regex=False
                        )
                    ]

                if len(name_matches) > 0:
                    successful_sa2_mappings += 1
                    # Take first match (could be improved with confidence scoring)
                    match = name_matches.iloc[0]
                    sa2_mappings.append({
                        'sa2_code': str(match[sa2_col]),
                        'sa2_name': str(match[sa2_name_col]) if sa2_name_col else '',
                        'population_weight': 1.0,
                        'area_weight': 1.0,
                        'match_confidence': 0.9 if len(name_matches) == 1 else 0.7
                    })

            # Create record
            enhanced_record = {
                'sal_code': suburb['sal_code'],
                'sal_name': suburb['sal_name'],
                'state': 'WA',
                'latitude': float(suburb['latitude']),
                'longitude': float(suburb['longitude']),
                'area_km2': float(suburb['area_km2']),
                'abs_area_km2': float(suburb.get('abs_area_km2', suburb['area_km2'])),

                'sa2_mappings': sa2_mappings,

                'police_district': str(suburb.get('police_district', '')),
                'police_mapping_confidence': float(suburb.get('police_mapping_confidence', 0.0)),

                'classification_type': self.classify_suburb_type(suburb),
                'economic_base': self.infer_economic_base(suburb),

                'last_updated': '2025-09-15T00:00:00.000Z',
                'data_source': 'ABS_SAL_2021_FINAL'
            }

            enhanced_suburbs.append(enhanced_record)

        logger.info(f"✅ Created {len(enhanced_suburbs)} suburb records")
        logger.info(f"📊 SA2 mapping: {successful_sa2_mappings}/{len(enhanced_suburbs)} ({successful_sa2_mappings/len(enhanced_suburbs)*100:.1f}%)")

        return enhanced_suburbs

    def classify_suburb_type(self, suburb) -> str:
        """Classify suburb type"""
        name = suburb['sal_name'].lower()
        lat = suburb['latitude']
        area = suburb['area_km2']

        if -32.5 < lat < -31.4:
            return 'Urban' if area < 10 else 'Suburban'
        elif any(term in name for term in ['mine', 'mines', 'mining', 'goldfield']):
            return 'Mining'
        elif any(term in name for term in ['beach', 'bay', 'island', 'harbour']):
            return 'Coastal'
        elif lat < -26:
            return 'Remote'
        elif area > 1000:
            return 'Rural'
        return 'Regional Town'

    def infer_economic_base(self, suburb) -> List[str]:
        """Infer economic base"""
        name = suburb['sal_name'].lower()
        lat = suburb['latitude']
        base = []

        if any(term in name for term in ['mine', 'mining', 'gold', 'iron']):
            base.append('Mining')
        if any(term in name for term in ['port', 'harbour']):
            base.append('Port Services')
        if any(term in name for term in ['beach', 'bay', 'island']):
            base.append('Tourism')
        if 'perth' in name or (-32.5 < lat < -31.4):
            base.extend(['Services', 'Finance'])
        if suburb['area_km2'] > 500 and lat > -32:
            base.append('Agriculture')

        return base or ['Mixed Economy']

    def save_processed_data(self, enhanced_suburbs: List[Dict], filename: str = 'wa_suburbs_final.json'):
        """Save final processed data"""
        output_path = self.output_dir / filename

        summary = {
            'metadata': {
                'total_suburbs': len(enhanced_suburbs),
                'processing_date': '2025-09-15T00:00:00.000Z',
                'data_source': 'ABS_SAL_2021',
                'version': 'final_fixed',
                'fixes_applied': [
                    'Fixed police district spatial intersection pandas error',
                    'Enhanced SA2 name-based mapping with fallback',
                    'Improved error handling and validation'
                ],
                'coverage': {
                    'sa2_mapped': sum(1 for s in enhanced_suburbs if s['sa2_mappings']),
                    'police_mapped': sum(1 for s in enhanced_suburbs if s['police_district']),
                    'sa2_percentage': sum(1 for s in enhanced_suburbs if s['sa2_mappings']) / len(enhanced_suburbs) * 100,
                    'police_percentage': sum(1 for s in enhanced_suburbs if s['police_district']) / len(enhanced_suburbs) * 100
                }
            },
            'suburbs': enhanced_suburbs
        }

        with open(output_path, 'w') as f:
            json.dump(summary, f, indent=2)

        logger.info(f"💾 Saved to {output_path}")

        # Save CSV
        csv_path = self.output_dir / filename.replace('.json', '.csv')
        df = pd.json_normalize(enhanced_suburbs)
        df.to_csv(csv_path, index=False)
        logger.info(f"📊 CSV saved to {csv_path}")

        return output_path

    def process_all(self):
        """Main processing pipeline - FINAL VERSION"""
        logger.info("🚀 Starting FINAL WA Suburb Processing Pipeline...")

        try:
            # 1. Load SAL suburbs
            sal_shapefile = self.data_dir / "SAL_2021_AUST_GDA2020" / "SAL_2021_AUST_GDA2020.shp"
            if not sal_shapefile.exists():
                logger.error(f"❌ SAL shapefile not found")
                return None

            wa_suburbs = self.extract_wa_suburbs_from_sal(str(sal_shapefile))
            if wa_suburbs.empty:
                return None

            # 2. Load correspondence
            correspondence_files = list(self.data_dir.glob("*correspondence*")) + list(self.data_dir.glob("*.csv")) + list(self.data_dir.glob("*.xlsx"))
            correspondence_df = pd.DataFrame()

            for file in correspondence_files:
                if 'correspondence' in file.name.lower() or any(term in file.name.lower() for term in ['locality', 'sal']):
                    correspondence_df = self.load_locality_sa2_correspondence(str(file))
                    if not correspondence_df.empty:
                        logger.info(f"✅ Using correspondence file: {file}")
                        break

            # 3. Load police districts
            police_shapefile = self.data_dir / "WA_Police_District_Boundaries" / "Police_Districts.shp"
            if police_shapefile.exists():
                police_districts = self.load_police_districts(str(police_shapefile))
                wa_suburbs = self.spatial_intersection_suburbs_police(wa_suburbs, police_districts)
            else:
                logger.warning("⚠️ Police districts not found")
                wa_suburbs['police_district'] = ''
                wa_suburbs['police_mapping_confidence'] = 0.0

            # 4. Create enhanced records
            enhanced_suburbs = self.create_enhanced_suburb_records(wa_suburbs, correspondence_df)

            # 5. Save results
            output_path = self.save_processed_data(enhanced_suburbs)

            # Final summary
            with_police = sum(1 for s in enhanced_suburbs if s['police_district'])
            with_sa2 = sum(1 for s in enhanced_suburbs if s['sa2_mappings'])

            logger.info("🎉 FINAL PROCESSING COMPLETE!")
            logger.info(f"📊 Total: {len(enhanced_suburbs)} suburbs")
            logger.info(f"🚔 Police: {with_police} ({with_police/len(enhanced_suburbs)*100:.1f}%)")
            logger.info(f"📊 SA2: {with_sa2} ({with_sa2/len(enhanced_suburbs)*100:.1f}%)")

            return output_path

        except Exception as e:
            logger.error(f"❌ Critical error: {e}")
            import traceback
            traceback.print_exc()
            return None

if __name__ == "__main__":
    processor = WASuburbProcessorFinalFixed()
    result = processor.process_all()

    if result:
        print(f"\n🎉 SUCCESS! Output saved to: {result}")
    else:
        print("\n❌ Processing failed. Check logs above.")