# Data Layer Architecture

## Overview

The data layer handles integration with Australian Bureau of Statistics (ABS) data sources, providing a unified interface for accessing Census and demographic information across the application.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                         Data Layer                              │
│                                                                 │
│  ┌───────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │  ABS API      │    │  DataPack        │    │   Firebase   │ │
│  │  Client       │    │  Parser          │    │   Store      │ │
│  │               │    │                  │    │              │ │
│  │ abs-api.ts    │    │ abs-real-        │    │ firestore.ts │ │
│  │               │    │ parser.ts        │    │              │ │
│  └───────────────┘    └──────────────────┘    └──────────────┘ │
│           │                     │                      │       │
├───────────┼─────────────────────┼──────────────────────┼───────┤
│           ▼                     ▼                      ▼       │
│  ┌───────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │ TableBuilder  │    │  Census DataPack │    │  Processed   │ │
│  │ API           │    │  CSV Files       │    │  Data Cache  │ │
│  │               │    │                  │    │              │ │
│  │ data.api.     │    │ Local Storage    │    │ Runtime      │ │
│  │ abs.gov.au    │    │ src/data/        │    │ Memory       │ │
│  └───────────────┘    └──────────────────┘    └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. ABS API Client (`src/lib/abs-api.ts`)

**Purpose**: Interface with the ABS TableBuilder API for real-time data access.

**Key Functions**:
- `testABSConnection()` - Health check and connectivity validation
- `getABSDataflows()` - Discover available data collections
- `searchABSDataflows(keyword)` - Find specific datasets
- `getABSData(dataflowId, params)` - Fetch data with filtering
- `getCensusG01Data()` - Demographics (when dataflow IDs discovered)
- `getCensusG02Data()` - Economic indicators (when dataflow IDs discovered)

**Input/Output**:
```typescript
// Input: API parameters
{
  dataflowId: string,
  geography?: string,
  startPeriod?: string,
  endPeriod?: string,
  format?: 'json' | 'xml' | 'csv'
}

// Output: Standardized response
{
  success: boolean,
  data?: any,
  error?: string
}
```

**Error Handling**:
- Network timeouts and connectivity issues
- API rate limiting (HTTP 429)
- Invalid dataflow IDs or parameters
- Malformed response data

### 2. DataPack Parser (`src/lib/abs-real-parser.ts`)

**Purpose**: Process downloaded ABS Census DataPack CSV files for offline analysis.

**Key Functions**:
- `parseRealT01Data()` - Extract demographics from T01 tables
- `parseRealT02Data()` - Extract economic data from T02 tables
- `combineRealABSData()` - Merge multiple table data
- `convertRealABSToAppFormat()` - Transform to application schema
- `validateRealT01Structure()` - Validate file format integrity

**Data Flow**:
```
CSV File → Parse Headers → Validate Structure → Extract Columns → Transform Data → App Format
```

**Supported Tables**:
- **T01**: Demographics (age, gender, birthplace, language, citizenship)
- **T02**: Medians/Averages (income, rent, mortgage, household size)
- **T03-T35**: Additional tables (extensible architecture)

### 3. CSV Parser (`src/lib/csv-parser.ts`)

**Purpose**: Generic CSV parsing utilities with error handling.

**Features**:
- Header validation and mapping
- Type coercion for numeric fields
- Missing value handling
- Memory-efficient streaming for large files

### 4. Firebase Integration (Planned)

**Purpose**: Persistent storage and caching layer.

**Components**:
- **Firestore Collections**:
  - `suburbs` - Processed suburb data
  - `census-data` - Historical census information
  - `user-preferences` - Search criteria and favorites
  - `data-cache` - API response caching

## Data Models

### Raw ABS Data
```typescript
interface RealABSSuburbData {
  sa2Code: string              // Statistical Area 2 identifier
  name: string                 // Suburb/area name
  state: string               // Australian state/territory
  postcode?: string           // Postal code (mapped separately)

  demographics: {
    totalPopulation2021: number
    totalMales2021: number
    totalFemales2021: number
    age0to4: number
    age5to14: number
    // ... additional age groups
    aboriginalTorresStrait2021: number
    bornAustralia2021: number
    englishOnly2021: number
    australianCitizen2021: number
  }

  economics: {
    medianAge2021: number
    medianPersonalIncome2021: number
    medianHouseholdIncome2021: number
    medianRent2021: number
    medianMortgage2021: number
    avgHouseholdSize2021: number
  }
}
```

### Application Data Format
```typescript
interface CensusData {
  id: string                  // Unique identifier
  suburbId: string           // URL-safe identifier
  year: number               // Census year
  population: number
  medianAge: number
  medianHouseholdIncome: number
  medianRent: number
  medianMortgage: number
  unemploymentRate: number

  educationLevel: {
    highSchool: number
    bachelor: number
    postgraduate: number
  }

  householdComposition: {
    couples: number
    singleParent: number
    singlePerson: number
  }

  dwellingTypes: {
    houses: number
    apartments: number
    townhouses: number
    other: number
  }
}
```

## Data Sources

### ABS TableBuilder API
- **URL**: `https://data.api.abs.gov.au/rest`
- **Format**: SDMX-JSON, CSV, XML
- **Coverage**: Real-time access to published datasets
- **Limitations**: Beta status, potential rate limits, requires internet

### Census DataPacks
- **Source**: Downloaded CSV files from ABS website
- **Format**: Statistical Area level CSV files
- **Coverage**: Complete historical data (2011, 2016, 2021)
- **Advantages**: Complete data, offline access, no rate limits
- **Disadvantages**: Manual updates, large file sizes

### Geographic References
- **SA2 Codes**: 9-digit Statistical Area 2 identifiers
- **State Mapping**: First digit indicates state (1=NSW, 2=VIC, etc.)
- **Suburb Names**: Requires separate correspondence files
- **Postcodes**: Requires separate mapping (many-to-many relationship)

## Data Processing Pipeline

### 1. Ingestion
```
API Response / CSV File → Raw Data Validation → Structure Checking → Error Logging
```

### 2. Transformation
```
Raw ABS Format → Column Mapping → Type Conversion → Null Handling → App Format
```

### 3. Enrichment
```
Base Data → Geographic Lookup → Name Resolution → Postcode Mapping → Complete Record
```

### 4. Storage
```
Processed Data → Validation → Deduplication → Database Storage → Index Creation
```

## Performance Considerations

### Memory Management
- **Streaming**: Process large CSV files without loading entirely into memory
- **Chunking**: Break large datasets into manageable pieces
- **Caching**: Store frequently accessed data in memory with TTL

### API Efficiency
- **Batching**: Group multiple requests where possible
- **Caching**: Cache API responses with appropriate TTL
- **Rate Limiting**: Implement client-side rate limiting to avoid API limits

### Database Optimization
- **Indexing**: Create indexes on frequently queried fields (SA2 code, suburb name)
- **Partitioning**: Partition by state or year for large datasets
- **Compression**: Use compression for historical data storage

## Error Handling Strategy

### API Errors
```typescript
enum ABSAPIError {
  CONNECTION_FAILED = 'connection_failed',
  RATE_LIMITED = 'rate_limited',
  INVALID_DATAFLOW = 'invalid_dataflow',
  MALFORMED_RESPONSE = 'malformed_response',
  SERVER_ERROR = 'server_error'
}
```

### Data Processing Errors
```typescript
enum DataProcessingError {
  INVALID_CSV_FORMAT = 'invalid_csv_format',
  MISSING_REQUIRED_COLUMNS = 'missing_required_columns',
  TYPE_CONVERSION_FAILED = 'type_conversion_failed',
  VALIDATION_FAILED = 'validation_failed'
}
```

### Recovery Strategies
- **Retry Logic**: Exponential backoff for transient failures
- **Fallback Sources**: Switch from API to DataPack if API unavailable
- **Partial Processing**: Continue processing valid records when some fail
- **User Notification**: Clear error messages for user-facing failures

## Security Considerations

### API Access
- **Rate Limiting**: Respect API provider limits
- **Error Exposure**: Don't expose internal API details to users
- **Input Validation**: Validate all user inputs before API calls

### Data Privacy
- **No Personal Data**: Census data is aggregated, no individual records
- **Public Data**: All ABS data is publicly available
- **User Preferences**: Encrypt user search preferences if stored

## Testing Strategy

### Unit Tests
- CSV parser with various file formats
- Data transformation functions
- Error handling scenarios
- Type validation

### Integration Tests
- API connectivity and response handling
- End-to-end data pipeline
- Database operations
- Error recovery flows

### Performance Tests
- Large file processing
- API response times
- Memory usage under load
- Concurrent request handling

## Monitoring and Observability

### Metrics
- API response times and success rates
- Data processing throughput
- Error rates by type
- Cache hit/miss ratios

### Logging
- API request/response logging (excluding sensitive data)
- Data processing pipeline events
- Error details for debugging
- Performance benchmarks

### Alerting
- API availability issues
- Data processing failures
- Performance degradation
- Error rate thresholds

## Future Enhancements

### Short Term
1. **Geographic Expansion**: Add suburb name and postcode mapping
2. **Additional Tables**: Integrate more Census tables (education, employment)
3. **Caching Layer**: Implement Redis for API response caching
4. **Validation Enhancement**: More robust data validation rules

### Medium Term
1. **Real-time Updates**: Monitor for new ABS data releases
2. **Multi-year Analysis**: Trend analysis across census years
3. **Data Quality Metrics**: Track and report data completeness
4. **API Optimization**: Implement GraphQL layer for flexible querying

### Long Term
1. **Machine Learning**: Predictive modeling for suburb trends
2. **External Integration**: Integrate additional data sources
3. **Real-time Feeds**: Connect to streaming data sources
4. **International Expansion**: Support for other countries' statistical agencies