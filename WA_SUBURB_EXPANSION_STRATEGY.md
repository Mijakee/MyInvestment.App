# WA Suburb Database Expansion Strategy

## Current State Problems

### Coverage Gap
- **Current**: 64 handcrafted suburbs
- **Target**: 300+ comprehensive WA suburbs
- **Missing**: Rural towns, mining centers, tourist destinations, emerging growth areas

### Mapping Issues
- **Current Approach**: SA2-based (Statistical Area Level 2)
- **Problem**: SA2s don't match real estate market expectations
- **Solution Needed**: SAL (Suburbs and Localities) + SA2 correspondence

### Data Integration Challenges
- **Census Data**: Available in SA2 format only
- **Crime Data**: WA Police districts don't align perfectly with SA2/SAL boundaries
- **Property Market**: Uses suburb names, not statistical codes

## Solution Architecture

### 1. Dual Geographic System
```
Real Suburb (SAL) ←→ SA2 Census Area ←→ Police District
    ↓                    ↓                    ↓
Property Market    Census Demographics   Crime Statistics
```

### 2. Data Sources Required

#### A. ABS SAL (Suburbs and Localities) Boundaries
- **Source**: ABS ASGS Edition 3 (2021-2026)
- **Coverage**: 15,353 Australia-wide, ~1,000+ for WA
- **Download**: Digital boundary files from abs.gov.au
- **Format**: Shapefiles with SAL codes and names

#### B. SAL ↔ SA2 Correspondence Table
- **Source**: ABS Allocation Files
- **Purpose**: Map SAL suburbs to SA2 census areas
- **Challenge**: Many-to-many relationship (some suburbs span multiple SA2s)
- **Solution**: Weight by population/area overlap

#### C. Enhanced Police District Mapping
- **Source**: WA Police Force District Boundaries (WAPOL-002)
- **Current Data**: Shapefile from data.wa.gov.au (last updated 2018)
- **Enhancement**: Geographic intersection with SAL boundaries
- **Districts**: 8 metro + 7 regional = 15 total districts

#### D. Comprehensive Suburb Metadata
- **Population**: From SA2 census data (weighted)
- **Coordinates**: Centroid from SAL shapefile
- **Classifications**: Urban/Regional/Rural based on ABS classifications
- **Economic Data**: Tourism, mining, agriculture from industry data

### 3. Implementation Phases

#### Phase 1: Data Acquisition (1-2 days)
1. Download ABS SAL shapefiles (2021 boundaries)
2. Download ABS SAL ↔ SA2 correspondence files
3. Download WA Police district shapefiles
4. Obtain comprehensive WA suburb list from Geoscape/Australia Post

#### Phase 2: Geographic Processing (2-3 days)
1. Extract WA suburbs from SAL shapefile (~1,000+ suburbs)
2. Generate SAL ↔ SA2 mapping table with confidence scores
3. Perform spatial intersection: SAL suburbs × Police districts
4. Create comprehensive WA suburb database with all mappings

#### Phase 3: Data Integration (3-4 days)
1. Connect SA2 census data to SAL suburbs (weighted by overlap)
2. Map crime statistics from police districts to suburbs
3. Enrich with additional metadata (tourism, economic classification)
4. Validate data quality and coverage

#### Phase 4: System Updates (2-3 days)
1. Update suburb database schema to support SAL + SA2 dual system
2. Modify safety rating service to use new suburb mappings
3. Update APIs to handle expanded suburb coverage
4. Test with real census and crime data integration

## Technical Architecture Changes

### Database Schema Updates
```typescript
interface EnhancedWASuburb {
  // SAL (Real suburb) identifiers
  salCode: string          // Official ABS SAL code
  salName: string          // Official suburb name

  // SA2 (Census) mappings - can be multiple!
  sa2Mappings: Array<{
    sa2Code: string
    sa2Name: string
    populationWeight: number  // 0-1, this suburb's share of SA2
    areaWeight: number       // 0-1, this suburb's area share of SA2
  }>

  // Police district mapping
  policeDistrict: string
  policeStation: string
  districtMappingConfidence: number // 0-1

  // Enhanced metadata
  classification: 'Major Urban' | 'Urban' | 'Regional Town' | 'Rural' | 'Remote' | 'Mining' | 'Tourist'
  economicBase: string[]
  tourismRating?: 'High' | 'Medium' | 'Low'
  miningActivity?: boolean

  // Existing fields remain the same
  latitude: number
  longitude: number
  postcode: string
  lgaName: string
  regionName: string
}
```

### Service Layer Updates
```typescript
class EnhancedGeographicService {
  // Get census data for suburb (weighted across multiple SA2s)
  async getCensusDataForSuburb(salCode: string): Promise<CensusData>

  // Get crime data for suburb via police district
  async getCrimeDataForSuburb(salCode: string): Promise<CrimeData>

  // Find suburbs by various criteria
  async searchSuburbs(query: string, filters?: SuburbFilters): Promise<EnhancedWASuburb[]>
}
```

## Expected Coverage After Expansion

### Geographic Coverage
- **Perth Metro**: ~200 suburbs (vs current 45)
- **Regional Cities**: ~50 major regional centers
- **Towns & Localities**: ~150 smaller towns
- **Tourist Destinations**: ~30 coastal/wine/natural areas
- **Mining Centers**: ~20 Pilbara/Goldfields townships
- **Agricultural Areas**: ~80 Wheatbelt/South West localities

### Data Quality Expectations
- **SAL Coverage**: 100% (all official WA suburbs)
- **SA2 Census Mapping**: 95%+ (weighted by population)
- **Police District Mapping**: 90%+ (geographic intersection)
- **Complete Metadata**: 80%+ (manual enrichment may be needed)

## Migration Strategy

### Backward Compatibility
- Keep existing 64 suburbs as "premium" tier with manual curation
- Gradually enhance remaining suburbs with automated processing
- Maintain existing API endpoints while adding new ones

### Data Validation
- Cross-reference with property market data (Domain, REA)
- Validate against Australia Post locality database
- Check population figures against ABS official counts
- Verify police station coverage with WA Police website

### Quality Assurance
- Spot-check random sample of 50 suburbs for accuracy
- Compare safety ratings between old and new system for overlap
- Test edge cases (suburbs spanning multiple SA2s/police districts)

## Timeline and Resources

### Total Timeline: 8-12 days
- **Data Acquisition**: 1-2 days
- **Geographic Processing**: 2-3 days
- **Data Integration**: 3-4 days
- **System Updates**: 2-3 days

### Dependencies
- ABS data download (free, immediate)
- WA Police shapefile (free, immediate)
- Geographic processing tools (PostGIS, GDAL, or similar)
- Validation against real-world data sources

### Success Metrics
- 300+ WA suburbs in database
- <5% suburbs missing census data
- <10% suburbs missing police district mapping
- Property investor user testing validates suburb recognition
- Safety ratings remain consistent for existing suburbs

## Next Steps

1. **Immediate**: Download and examine ABS SAL shapefiles for WA
2. **Day 1**: Set up geographic processing pipeline
3. **Day 2**: Generate comprehensive suburb list and mappings
4. **Day 3-4**: Integrate with existing census and crime data systems
5. **Day 5**: Update codebase and APIs
6. **Day 6**: Testing and validation
7. **Day 7**: Documentation and deployment

This expansion will transform the application from a limited demo to a production-ready tool covering the entire WA property investment market.