#!/usr/bin/env python3
"""
WA Police Crime Data Processor
Processes the official WA Police crime time series Excel file
"""

import pandas as pd
import json
import os
from pathlib import Path
from typing import Dict, List, Any
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WACrimeDataProcessor:
    def __init__(self, excel_file: str = "../src/data/wa_police_crime_timeseries.xlsx"):
        self.excel_file = Path(excel_file)
        self.output_dir = Path("../src/data/")

        if not self.excel_file.exists():
            raise FileNotFoundError(f"Crime data file not found: {excel_file}")

    def load_and_explore_excel(self):
        """Load and explore the Excel file structure"""
        logger.info(f"Loading Excel file: {self.excel_file}")

        # Load Excel file and check sheet names
        excel_file = pd.ExcelFile(self.excel_file)
        sheet_names = excel_file.sheet_names

        logger.info(f"Found {len(sheet_names)} sheets: {sheet_names}")

        # Explore first few sheets
        sheet_info = {}
        for sheet_name in sheet_names[:5]:  # Check first 5 sheets
            try:
                df = pd.read_excel(excel_file, sheet_name=sheet_name, nrows=10)
                sheet_info[sheet_name] = {
                    'shape': df.shape,
                    'columns': list(df.columns),
                    'sample_data': df.head(3).to_dict('records')
                }
                logger.info(f"Sheet '{sheet_name}': {df.shape[0]} rows, {df.shape[1]} columns")
            except Exception as e:
                logger.warning(f"Could not read sheet '{sheet_name}': {e}")

        return sheet_info

    def process_crime_data(self):
        """Process the main crime data sheets"""
        logger.info("Processing WA Police crime time series data...")

        excel_file = pd.ExcelFile(self.excel_file)
        processed_data = {}

        # Look for main data sheets (usually contain "Data" or location names)
        relevant_sheets = []
        for sheet in excel_file.sheet_names:
            sheet_lower = sheet.lower()
            if any(keyword in sheet_lower for keyword in ['data', 'district', 'region', 'metro', 'wa ']):
                relevant_sheets.append(sheet)

        logger.info(f"Processing {len(relevant_sheets)} relevant sheets: {relevant_sheets[:10]}")

        for sheet_name in relevant_sheets[:10]:  # Process first 10 relevant sheets
            try:
                logger.info(f"Processing sheet: {sheet_name}")
                df = pd.read_excel(excel_file, sheet_name=sheet_name)

                # Clean and standardize the data
                processed_sheet = self.process_sheet_data(df, sheet_name)
                if processed_sheet:
                    processed_data[sheet_name] = processed_sheet

            except Exception as e:
                logger.error(f"Error processing sheet '{sheet_name}': {e}")

        return processed_data

    def process_sheet_data(self, df: pd.DataFrame, sheet_name: str) -> Dict[str, Any]:
        """Process individual sheet data"""
        if df.empty:
            return None

        # Look for common patterns in WA Police data structure
        # Usually has Date/Period columns and various offense types

        # Find date/period columns
        date_cols = [col for col in df.columns if any(term in col.lower() for term in ['date', 'period', 'year', 'month'])]

        # Find location columns
        location_cols = [col for col in df.columns if any(term in col.lower() for term in ['district', 'region', 'area', 'location'])]

        # Find offense columns (usually numeric data)
        offense_cols = []
        for col in df.columns:
            if col not in date_cols + location_cols:
                try:
                    pd.to_numeric(df[col], errors='coerce')
                    offense_cols.append(col)
                except:
                    continue

        logger.info(f"Sheet '{sheet_name}': Date cols: {date_cols}, Location cols: {location_cols}, Offense cols: {len(offense_cols)}")

        # Extract relevant data
        sheet_data = {
            'sheet_name': sheet_name,
            'total_rows': len(df),
            'date_columns': date_cols,
            'location_columns': location_cols,
            'offense_columns': offense_cols[:20],  # Limit to first 20 offense types
            'sample_records': []
        }

        # Extract sample records with geographic information
        if location_cols and offense_cols:
            sample_df = df.head(10).copy()

            for idx, row in sample_df.iterrows():
                record = {
                    'row_index': idx,
                }

                # Add date information
                for date_col in date_cols[:2]:
                    if date_col in row:
                        record[date_col] = str(row[date_col])

                # Add location information
                for loc_col in location_cols[:2]:
                    if loc_col in row:
                        record[loc_col] = str(row[loc_col])

                # Add offense data (sum for total crimes)
                offense_total = 0
                offense_details = {}
                for offense_col in offense_cols[:10]:
                    if offense_col in row:
                        try:
                            value = pd.to_numeric(row[offense_col], errors='coerce')
                            if pd.notna(value):
                                offense_details[offense_col] = float(value)
                                offense_total += float(value)
                        except:
                            pass

                record['total_offenses'] = offense_total
                record['offense_breakdown'] = offense_details

                sheet_data['sample_records'].append(record)

        return sheet_data

    def extract_district_level_data(self, processed_data: Dict) -> Dict[str, List[Dict]]:
        """Extract and aggregate data by police district"""
        logger.info("Extracting district-level crime data...")

        district_data = {}

        for sheet_name, sheet_data in processed_data.items():
            if not sheet_data or not sheet_data['sample_records']:
                continue

            for record in sheet_data['sample_records']:
                # Look for district information
                district = None
                for key, value in record.items():
                    if 'district' in key.lower() and isinstance(value, str):
                        district = value.strip()
                        break

                if district and district != 'nan' and len(district) > 2:
                    if district not in district_data:
                        district_data[district] = []

                    # Create standardized record
                    crime_record = {
                        'police_district': district,
                        'data_source': sheet_name,
                        'total_offenses': record.get('total_offenses', 0),
                        'year': self.extract_year_from_record(record),
                        'offense_categories': record.get('offense_breakdown', {}),
                        'raw_record': record
                    }

                    district_data[district].append(crime_record)

        return district_data

    def extract_year_from_record(self, record: Dict) -> int:
        """Extract year from record data"""
        for key, value in record.items():
            if 'date' in key.lower() or 'period' in key.lower() or 'year' in key.lower():
                try:
                    # Try to extract year from various formats
                    value_str = str(value)
                    if '2023' in value_str:
                        return 2023
                    elif '2024' in value_str:
                        return 2024
                    elif '2022' in value_str:
                        return 2022
                    elif len(value_str) == 4 and value_str.isdigit():
                        year = int(value_str)
                        if 2020 <= year <= 2024:
                            return year
                except:
                    pass
        return 2023  # Default to 2023

    def save_processed_data(self, district_data: Dict[str, List[Dict]], filename: str = 'wa_police_crime_data.json'):
        """Save processed crime data"""
        output_path = self.output_dir / filename

        # Create summary structure
        summary = {
            'metadata': {
                'source': 'WA Police Force Crime Time Series Data',
                'processing_date': '2025-09-16T00:00:00.000Z',
                'total_districts': len(district_data),
                'districts': list(district_data.keys()),
                'data_years': list(set([
                    record['year']
                    for records in district_data.values()
                    for record in records
                ])),
                'note': 'Processed from official WA Police Excel time series data'
            },
            'districts': district_data
        }

        with open(output_path, 'w') as f:
            json.dump(summary, f, indent=2)

        logger.info(f"Saved processed crime data to {output_path}")
        logger.info(f"Districts found: {len(district_data)}")
        for district, records in list(district_data.items())[:5]:
            logger.info(f"  {district}: {len(records)} records")

        return output_path

    def process_all(self):
        """Main processing pipeline"""
        logger.info("Starting WA Police crime data processing...")

        try:
            # 1. Explore file structure
            sheet_info = self.load_and_explore_excel()

            # 2. Process relevant crime data
            processed_data = self.process_crime_data()

            if not processed_data:
                logger.error("No data was successfully processed")
                return None

            # 3. Extract district-level data
            district_data = self.extract_district_level_data(processed_data)

            if not district_data:
                logger.error("No district-level data could be extracted")
                return None

            # 4. Save processed data
            output_path = self.save_processed_data(district_data)

            # 5. Final summary
            logger.info("Crime data processing complete!")
            logger.info(f"Processed {len(district_data)} police districts")
            logger.info(f"Output saved to: {output_path}")

            return output_path

        except Exception as e:
            logger.error(f"Critical error in crime data processing: {e}")
            import traceback
            traceback.print_exc()
            return None

if __name__ == "__main__":
    processor = WACrimeDataProcessor()
    result = processor.process_all()

    if result:
        print(f"\nSUCCESS! Crime data processed and saved to: {result}")
    else:
        print("\nFAILED! Crime data processing failed. Check logs above.")