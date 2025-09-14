# ABS API Integration Documentation

## Overview

This document tracks the implementation of Australian Bureau of Statistics (ABS) data integration for the MyInvestmentApp project. The integration supports both the ABS TableBuilder API and real ABS Census DataPacks.

## Implementation Status

**Current Phase**: ABS TableBuilder API integration
**Branch**: `feature/abs-data-implementation`
**Last Updated**: 2025-09-15

### Completed Components

#### 1. ABS API Layer (`src/lib/abs-api.ts`)
- ✅ Base API client for ABS TableBuilder API
- ✅ Connection testing functionality
- ✅ Dataflow discovery and search
- ✅ Generic data fetching with parameter support
- ✅ Error handling and response typing
- ✅ Support for multiple output formats (JSON, CSV, XML)

**Key Functions:**
- `testABSConnection()` - Test API connectivity
- `getABSDataflows()` - Fetch all available dataflows
- `searchABSDataflows(keyword)` - Search dataflows by keyword
- `getCensusG01Data()` - Get demographics data (placeholder IDs)
- `getCensusG02Data()` - Get economics data (placeholder IDs)
- `getABSData()` - Generic data fetching with custom parameters

#### 2. Real ABS DataPack Parser (`src/lib/abs-real-parser.ts`)
- ✅ Parser for 2021 Census T01 files (demographics)
- ✅ Parser for 2021 Census T02 files (economics/medians)
- ✅ Data combination and validation functions
- ✅ Conversion to application CensusData format
- ✅ SA2 code to state mapping
- ✅ Basic safety rating calculation placeholder

**Key Functions:**
- `parseRealT01Data()` - Parse demographics from T01 CSV
- `parseRealT02Data()` - Parse economics from T02 CSV
- `combineRealABSData()` - Merge T01 and T02 data
- `convertRealABSToAppFormat()` - Convert to app's CensusData type
- `validateRealT01Structure()` - Validate T01 file format
- `validateRealT02Structure()` - Validate T02 file format

#### 3. API Test Endpoint (`src/app/api/abs/test/route.ts`)
- ✅ Test endpoint for ABS API connectivity
- ✅ Dataflow listing functionality
- ✅ Search capability
- ✅ Error handling and response formatting

**Available Actions:**
- `GET /api/abs/test?action=test` - Test connection
- `GET /api/abs/test?action=dataflows` - List all dataflows
- `GET /api/abs/test?action=search&search=census` - Search dataflows

### Data Sources

#### ABS TableBuilder API
- **Base URL**: `https://data.api.abs.gov.au/rest`
- **Format**: SDMX-JSON, CSV, XML
- **Status**: Live API integration implemented
- **Usage**: Real-time data fetching

#### ABS Census DataPacks
- **Source**: Downloaded CSV files from ABS
- **Format**: Statistical Area 2 (SA2) level data
- **Coverage**: Complete 2021 Census tables (T01-T35)
- **Sample Data**: ACT SA2 data included for testing

### Data Structure

#### Real ABS Suburb Data Interface
```typescript
interface RealABSSuburbData {
  sa2Code: string        // Statistical Area 2 code
  name: string          // Suburb/area name
  state: string         // Derived from SA2 code
  postcode?: string     // To be mapped

  demographics: {
    totalPopulation2021: number
    totalMales2021: number
    totalFemales2021: number
    // Age groups, indigenous status, birthplace, etc.
  }

  economics: {
    medianAge2021: number
    medianPersonalIncome2021: number
    medianHouseholdIncome2021: number
    medianRent2021: number
    medianMortgage2021: number
    // Additional economic indicators
  }
}
```

## Next Steps

### Immediate (Current Sprint)
1. **API Discovery**: Use test endpoint to discover actual dataflow IDs for Census data
2. **Dataflow Mapping**: Map discovered dataflows to our G01/G02 equivalents
3. **Parameter Refinement**: Test geographic filtering and time period parameters
4. **Error Handling**: Enhance error handling for API rate limits and failures

### Short Term
1. **Geographic Mapping**: Implement SA2 code to suburb name mapping
2. **Postcode Integration**: Add postcode lookup functionality
3. **Data Import Pipeline**: Create automated data import from DataPacks
4. **Data Validation**: Enhanced validation for both API and CSV data

### Medium Term
1. **Caching Strategy**: Implement Redis/memory caching for API responses
2. **Background Processing**: Move data processing to Firebase Functions
3. **Multi-State Support**: Extend beyond ACT to all Australian states
4. **Real-time Updates**: Monitor for new ABS data releases

## Technical Notes

### SA2 Geographic Codes
- First digit indicates state: 1=NSW, 2=VIC, 3=QLD, 4=SA, 5=WA, 6=TAS, 7=NT, 8=ACT
- Full codes are 9 digits (e.g., 801021007 for Canberra - City)

### API Limitations
- Rate limiting: Monitor for HTTP 429 responses
- Data size: Large requests may timeout
- Format compatibility: Not all endpoints support all formats

### File Structure
```
src/data/abs-real/
├── 2021 Census TSP Statistical Area 2 for ACT/
│   ├── 2021Census_T01_ACT_SA2.csv  # Demographics
│   ├── 2021Census_T02_ACT_SA2.csv  # Medians/Averages
│   └── [T03-T35 additional tables]
└── [Other states to be added]
```

## Testing

### Manual Testing
1. Start development server: `npm run dev`
2. Test API connection: `GET /api/abs/test?action=test`
3. List dataflows: `GET /api/abs/test?action=dataflows`
4. Search census data: `GET /api/abs/test?action=search&search=census`

### Sample Data Testing
- ACT SA2 data available in `src/data/abs-real/`
- Use T01 and T02 files for parser testing
- Validate against known SA2 codes (e.g., 801021007)

## Dependencies

### Production
- Next.js API routes for endpoint handling
- Built-in fetch for API requests
- TypeScript for type safety

### Development
- Sample CSV files for testing
- CSV parsing utilities

## Change Log

### 2025-09-15
- Initial ABS API integration layer
- Real DataPack parser implementation
- Test endpoint creation
- Documentation structure established