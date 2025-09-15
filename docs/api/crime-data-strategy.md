# Crime Data Integration Strategy

**Date**: 2025-09-15
**Branch**: `feature/abs-data-implementation`
**Status**: Research Phase Complete

## Executive Summary

Based on comprehensive research, WA Police does not provide a public API for crime statistics. However, they do provide downloadable Excel files with 10+ years of historical crime data. We have identified a multi-source approach for crime data integration and geographic mapping.

## Crime Data Sources

### 1. WA Police Crime Statistics (Primary Source)
**Source**: Western Australia Police Force
**URL**: https://www.wa.gov.au/organisation/western-australia-police-force/crime-statistics
**Format**: Excel (.xlsx) files
**Coverage**: 2007-2025 (10+ years of historical data)

#### Available Data Products
1. **Crime Time Series Data (Excel)**
   - 10 years of offence data by location
   - Includes WA Police Force Districts
   - Monthly/quarterly data granularity
   - Covers state, metropolitan/regional, and district levels

2. **Year-to-Date Annual Statistics (PDF)**
   - Snapshot of offences and rates per 100,000 people
   - Includes sanction rates by geographic area
   - Police district level breakdown

#### Geographic Granularity
- **State**: Western Australia total
- **Regional**: Metropolitan WA vs Regional WA
- **District**: Individual police districts (15+ districts)
- **Locality**: Some data available at suburb/locality level

#### Data Quality Notes
- Offence counts subject to revision due to ongoing investigations
- Changes may occur between quarterly reports
- Location matching dependent on WA Police geographical mapping tables
- Unmatchable locations appear in state totals but not lower geographic levels

### 2. Geographic Mapping Sources

#### Option A: ABS API (Recommended)
**Source**: Australian Bureau of Statistics TableBuilder API
**Integration**: Already implemented in our system
**Coverage**: Complete SA2/suburb mapping nationwide

**Available Dataflows for Geographic Mapping**:
- `ABS_SEIFA2021_SA2` - SEIFA 2021 by SA2 (includes geographic identifiers)
- `ABS_SEIFA2021_SAL` - SEIFA 2021 by Suburbs and Localities
- `ABS_SEIFA2021_POA` - SEIFA 2021 by Postcode Areas
- `ABS_SEIFA2021_LGA` - SEIFA 2021 by Local Government Areas

**Benefits**:
- Already integrated API client
- Comprehensive geographic correspondence
- Authoritative source for SA2/suburb relationships
- Includes socioeconomic data (SEIFA) for additional analysis

#### Option B: Data WA Government
**Source**: Western Australia Government Data Catalogue
**URL**: https://catalogue.data.wa.gov.au/dataset
**Coverage**: WA-specific geographic boundaries

**Available Datasets**:
- Local Government Area (LGA) Boundaries - GeoJSON, SHP, FGDB, GeoPackage, WFS
- Cadastre (Polygon) datasets - Multiple formats
- Various administrative boundary datasets

**Benefits**:
- WA-specific data
- Multiple format options
- Direct from state government
- Potential for police district boundaries

### 3. Hybrid Approach: WA Police + ABS Integration

Given the different geographic systems used:
- **Crime Data**: Police Districts (WA Police administrative boundaries)
- **Census Data**: SA2 Areas (ABS statistical boundaries)
- **User Expectations**: Suburbs/Postcodes (familiar geographic units)

## Proposed Integration Architecture

### Phase 1: Automated Excel Download and Processing

```typescript
// src/lib/crime-data-downloader.ts
interface CrimeDataDownloader {
  downloadLatestCrimeData(): Promise<Buffer>
  parseExcelCrimeData(buffer: Buffer): CrimeDataRecord[]
  validateDataQuality(records: CrimeDataRecord[]): ValidationResult
}

interface CrimeDataRecord {
  location: string           // Police district or locality
  locationCode?: string      // If available
  offenceType: string       // Crime category
  offenceCount: number      // Number of offences
  reportPeriod: string      // Month/quarter/year
  rate?: number             // Rate per 100,000 population
}
```

### Phase 2: Geographic Correspondence Mapping

```typescript
// src/lib/geographic-mapper.ts
interface GeographicMapper {
  mapPoliceDistrictToSA2(policeDistrict: string): SA2Mapping[]
  mapSuburbToPoliceDistrict(suburb: string): PoliceDistrictMapping
  calculateSafetyRating(sa2Code: string): SafetyRating
}

interface SA2Mapping {
  sa2Code: string
  sa2Name: string
  policeDistrict: string
  coveragePercentage: number  // How much of SA2 is covered by this district
}

interface SafetyRating {
  overallRating: number       // 1-10 scale
  crimeRate: number          // Per 100,000 population
  crimeCategories: {
    violent: number
    property: number
    drug: number
    traffic: number
    other: number
  }
  trend: 'improving' | 'stable' | 'worsening'
  lastUpdated: string
}
```

### Phase 3: Data Processing Pipeline

```typescript
// Firebase Functions or Next.js API Routes
interface CrimeDataPipeline {
  scheduleDownload(): void                    // Monthly/quarterly schedule
  processDownloadedData(): void              // Parse and validate
  enrichWithGeographicData(): void           // Add SA2/suburb mapping
  calculateSafetyMetrics(): void             // Generate safety ratings
  updateDatabase(): void                     // Store in Firestore
  notifyDataUpdate(): void                   // Trigger cache refresh
}
```

## Implementation Roadmap

### Immediate (Week 1)
1. **Excel Parser Development**
   - Create xlsx parsing utilities
   - Handle multiple sheet formats
   - Implement data validation

2. **Geographic Mapping Research**
   - Test ABS SEIFA datasets for geographic correspondence
   - Research police district boundary data
   - Create suburb/postcode to police district mapping

### Short Term (Weeks 2-3)
1. **Automated Download System**
   - Web scraping for latest Excel files
   - Notification system for new data releases
   - Error handling and retry logic

2. **Data Processing Pipeline**
   - ETL pipeline for crime data
   - Geographic enrichment process
   - Safety rating calculation algorithms

### Medium Term (Month 1)
1. **Integration with Census Data**
   - Combine crime stats with demographic data
   - Enhanced safety rating calculations
   - Trend analysis across time periods

2. **User Interface Integration**
   - Display crime data in suburb search results
   - Interactive maps with crime overlays
   - Historical trend visualizations

## Technical Considerations

### Data Storage Strategy
```typescript
// Firestore Collections Structure
collections: {
  'crime-data': {
    [policeDistrict]: {
      [reportPeriod]: CrimeDataRecord[]
    }
  },
  'geographic-mapping': {
    'police-districts': PoliceDistrictMapping[],
    'sa2-correspondence': SA2Mapping[],
    'suburb-lookup': SuburbLookup[]
  },
  'safety-ratings': {
    [sa2Code]: SafetyRating
  }
}
```

### Performance Optimization
- **Caching**: Cache processed crime data and safety ratings
- **Incremental Updates**: Only process new/changed data
- **Background Processing**: Use Firebase Functions for heavy processing
- **CDN**: Cache static geographic boundary files

### Data Quality Management
- **Validation Rules**: Ensure data consistency across periods
- **Anomaly Detection**: Flag unusual crime rate changes
- **Manual Review**: Process for investigating data quality issues
- **Version Control**: Track data source versions and processing changes

## Risk Assessment

### High Risk
- **Data Source Changes**: WA Police may change Excel format or availability
- **Geographic Boundary Changes**: Police districts may be redrawn
- **Processing Complexity**: Multiple data source integration challenges

### Medium Risk
- **Update Frequency**: Crime data may be updated irregularly
- **Data Quality**: Missing or incorrect location data in police reports
- **Performance**: Large dataset processing may impact application performance

### Mitigation Strategies
- **Flexible Parsers**: Design parsers to handle format variations
- **Multiple Sources**: Maintain backup data sources where possible
- **Monitoring**: Alert systems for data pipeline failures
- **Graceful Degradation**: Show Census-only data when crime data unavailable

## Data Sources Comparison

| Source | Coverage | Format | Update Frequency | Accuracy | Cost |
|--------|----------|---------|------------------|----------|------|
| WA Police Excel | WA Only | XLSX | Quarterly | High | Free |
| ABS API | National | XML/JSON | Annually | Very High | Free |
| Data WA Gov | WA Only | Multiple | Varies | High | Free |
| Commercial APIs | Variable | JSON | Real-time | Variable | Paid |

## Compliance and Legal

### Data Usage Rights
- **WA Police Data**: Public data, no licensing restrictions identified
- **ABS Data**: Creative Commons, attribution required
- **Data WA Gov**: Government data, usage terms vary by dataset

### Privacy Considerations
- **Aggregated Data Only**: No individual-level crime data
- **Geographic Aggregation**: Ensure sufficient population in areas to prevent identification
- **Data Retention**: Follow government data retention guidelines

## Success Metrics

### Technical Metrics
- Data processing success rate (target: >95%)
- API response time for safety ratings (target: <500ms)
- Data freshness (target: within 1 month of WA Police release)

### User Experience Metrics
- Suburb search results include crime data (target: >90% coverage)
- User engagement with safety features
- User feedback on data accuracy and usefulness

## Conclusion

While WA Police doesn't provide an API, their Excel data combined with ABS geographic mapping provides a robust foundation for crime data integration. The hybrid approach using automated Excel processing and our existing ABS API integration offers the best balance of data quality, coverage, and technical feasibility.

The proposed architecture supports automatic updates, maintains data quality, and provides the geographic flexibility needed for suburb-level safety ratings while respecting the administrative boundaries used by law enforcement agencies.