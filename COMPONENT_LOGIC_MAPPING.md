# Component Logic Mapping & Crime Score Implementation

## Overview
This document maps where each component's logic is located. **MIGRATION COMPLETED** - The application now uses:
- **Crime Score**: Higher values = worse crime (1-10 scale)
- **Convenience Score**: Higher values = better convenience (1-10 scale, 25% weighting each)
- **Investment Score**: Higher values = better investment (1-10 scale)

## Core Logic Locations

### 1. CRIME SCORE CALCULATION ✅ IMPLEMENTED

**Primary Service**: `src/lib/safety-rating-service.ts` (renamed to CrimeScoreService)
- **Main Function**: `calculateCrimeScore(salCode: string)` + legacy `calculateSafetyRating(salCode: string)`
- **✅ NEW Algorithm**: 70% direct crime + 30% neighborhood crime influence
- **✅ NEW Output**: CrimeScore interface with 1-10 scale (higher = worse crime)

**Dependencies**:
- `src/lib/wa-police-crime-service.ts` - WA Police crime data processing
- `src/lib/abs-census-service.ts` - Census demographics data
- `src/lib/wa-suburb-loader.ts` - Suburb geographic data

**API Endpoint**: `src/app/api/safety/route.ts`
- Endpoint: `/api/safety?sal_code=XXXXX`
- Actions: calculate, batch, test, enhanced

### 2. CONVENIENCE SCORE CALCULATION ✅ UPDATED

**Primary Service**: `src/lib/convenience-score-service.ts`
- **Main Function**: `calculateConvenienceScore(salCode: string)`
- **✅ NEW Algorithm**: 25% transport + 25% shopping + 25% education + 25% recreation
- **✅ Output**: ConvenienceScore interface with 1-10 scale (higher = better convenience)

**Dependencies**:
- `src/lib/transport-accessibility-service.ts` - Public transport analysis

**API Endpoint**: `src/app/api/convenience/route.ts`
- Endpoint: `/api/convenience?sal_code=XXXXX`
- Actions: calculate, combined, test

### 3. HEAT MAP VISUALIZATION

**Primary Service**: `src/lib/heatmap-data-service.ts`
- **Main Function**: `generateHeatMapData(metric: string)`
- **Metrics**: safety, convenience, investment
- **Output**: HeatMapData array with color coding

**Components**:
- `src/components/SuburbBoundaryHeatMap.tsx` - Interactive boundary-based heat map
- `src/components/SimpleHeatMapVisualization.tsx` - Circle marker heat map
- `src/components/HeatMapVisualization.tsx` - Legacy heat map component

**API Endpoint**: `src/app/api/heatmap/route.ts`
- Actions: optimized, full, bounded, statistics, export, test

**Page**: `src/app/heatmap/page.tsx`

## Component-by-Component Logic Mapping

### Frontend Pages

#### 1. **Home Page** - `src/app/page.tsx`
**Logic Location**: Inline React component
**Safety/Crime References**:
- Line ~45: Links to `/heatmap` for safety visualization
- Line ~60: Safety rating explanations and examples

#### 2. **Suburbs Listing** - `src/app/suburbs/page.tsx`
**Logic Location**: React hooks and API calls
**Safety/Crime References**:
- Line ~167: `fetchSafetyRatingsForSuburbs()` function
- Line ~200: API call to `/api/safety?action=batch`
- Line ~250: Safety rating display in suburb cards

#### 3. **Suburb Detail Page** - `src/app/suburbs/[id]/page.tsx`
**Logic Location**: Multiple API calls and data integration
**Safety/Crime References**:
- Line ~95: API call to `/api/safety?sal_code=${salCode}`
- Line ~121: Crime trends API call
- Line ~200: Safety rating display components
- Line ~300: SafetyRating interface usage

#### 4. **Heat Map Page** - `src/app/heatmap/page.tsx`
**Logic Location**: Metric switching and map component integration
**Safety/Crime References**:
- Line ~45: Metric state management ('safety', 'convenience', 'investment')
- Line ~80: API calls to `/api/heatmap?action=optimized&metric=${metric}`
- Line ~120: Color coding for safety metrics

### UI Components

#### 1. **Safety Rating Badge** - `src/components/SafetyRatingBadge.tsx`
**Logic Location**: Pure presentation component
**Safety/Crime References**:
- Props: `rating`, `confidence`, `size`, `showLabel`
- Color mapping based on 1-10 scale
- Text labels: "Very Low Risk" to "Very High Risk"

#### 2. **Suburb Cards** - `src/components/SuburbCard.tsx`
**Logic Location**: Card layout with embedded safety rating
**Safety/Crime References**:
- Safety rating badge integration
- API data display from safety service

#### 3. **Suburb Details Modal** - `src/components/SuburbDetailsModal.tsx`
**Logic Location**: Comprehensive suburb analysis display
**Safety/Crime References**:
- Line ~48: `loadSuburbDetails()` function
- Line ~80: API calls to safety and convenience endpoints
- Line ~150: Detailed safety component breakdown display

#### 4. **Suburb Metrics** - `src/components/SuburbMetrics.tsx`
**Logic Location**: Metrics dashboard component
**Safety/Crime References**:
- Safety vs convenience score comparison
- Investment recommendation logic

### Chart Components

#### 1. **Demographic Chart** - `src/components/charts/DemographicChart.tsx`
**Logic Location**: Census data visualization
**Safety/Crime References**:
- Safety rating integration with demographic data
- Component breakdown display

#### 2. **Enhanced Demographics** - `src/components/charts/EnhancedDemographics.tsx`
**Logic Location**: Advanced demographic analysis
**Safety/Crime References**:
- Crime trend visualization
- Safety rating correlation with demographics

### Data Services

#### 1. **WA Police Crime Service** - `src/lib/wa-police-crime-service.ts`
**Logic Location**: Crime data processing and analysis
**Functions**:
- `getCrimeDataForSuburb(salCode: string)`
- `getDistrictCrimeProfile(district: string)`
- `calculateCrimeSeverity(crimeData: any)`

#### 2. **ABS Census Service** - `src/lib/abs-census-service.ts`
**Logic Location**: Census data integration
**Functions**:
- `getCensusDataForSuburb(salCode: string, year: number)`
- `getAllWACensusData(year: number)`

#### 3. **Transport Accessibility Service** - `src/lib/transport-accessibility-service.ts`
**Logic Location**: Transport convenience calculation
**Functions**:
- `calculateTransportAccessibility(latitude: number, longitude: number)`

## Type Definitions

**Primary Types File**: `src/types/index.ts`

### Current Safety-Related Interfaces:
```typescript
// Line ~98: SafetyRating interface
export interface SafetyRating {
  overallRating: number // 1-10 scale
  confidence: number
  components: {
    crimeRating: number      // 50% weight
    demographicRating: number // 25% weight
    neighborhoodRating: number // 15% weight
    trendRating: number       // 10% weight
  }
}

// Line ~70: CrimeData interface
export interface CrimeData {
  categories: {
    violentCrime: number
    propertyCrime: number
    drugOffenses: number
    // ... other crime types
  }
}
```

## API Endpoints Summary

### Safety/Crime Related:
1. **`/api/safety`** - Main safety rating calculations
2. **`/api/crime-trends`** - Historical crime trend analysis
3. **`/api/abs/census`** - Census data for demographic components
4. **`/api/heatmap`** - Visualization data including safety metrics
5. **`/api/integration/test`** - System testing including safety calculations

### Supporting:
1. **`/api/convenience`** - Convenience scoring (separate from safety)
2. **`/api/transport-accessibility`** - Transport component of convenience
3. **`/api/suburbs`** - Suburb data management
4. **`/api/demographics`** - Ancestry and demographic data

## Migration Guide: Safety Score → Crime Score

### 1. **Terminology Changes Required**

**Service Files to Update**:
- `src/lib/safety-rating-service.ts` → rename to `crime-score-service.ts`
- Update all function names: `calculateSafetyRating` → `calculateCrimeScore`
- Update interface: `SafetyRating` → `CrimeScore`

**API Endpoints to Update**:
- `src/app/api/safety/route.ts` → rename to `crime-score/route.ts`
- Update URL references throughout frontend

**Type Definitions to Update**:
- `src/types/index.ts`:
  - `SafetyRating` → `CrimeScore`
  - `safetyRating` properties → `crimeScore`

### 2. **Algorithm Focus Changes**

**Current Safety Algorithm** (in `safety-rating-service.ts`):
```
50% crime + 25% demographics + 15% neighborhood + 10% trends
```

**Proposed Crime Score Algorithm**:
```
70% direct crime data + 20% neighborhood crime + 10% crime trends
```

**Files to Modify**:
- `src/lib/safety-rating-service.ts` - Update weighting percentages
- Remove or reduce demographic components
- Increase crime data weighting

### 3. **Frontend Component Updates**

**Text/Label Changes Needed**:
- "Safety Rating" → "Crime Score"
- "Very Low Risk" → "Very Low Crime" (or similar)
- "Safety Analysis" → "Crime Analysis"

**Files to Update**:
- `src/components/SafetyRatingBadge.tsx` → `CrimeScoreBadge.tsx`
- All page components that display safety ratings
- Heat map legend and descriptions

### 4. **Color Coding Adjustments**

**Current Logic**: Higher safety rating = Green (safer)
**Crime Score Logic**: Higher crime score = Red (more crime)

**Invert Color Scale in**:
- `src/lib/heatmap-data-service.ts`
- `src/components/SuburbBoundaryHeatMap.tsx`
- `src/utils/constants.ts` - SAFETY_RATING colors

### 5. **Priority Change List**

**High Priority** (Core functionality):
1. `src/lib/safety-rating-service.ts` - Main algorithm
2. `src/types/index.ts` - Interface definitions
3. `src/app/api/safety/route.ts` - API endpoint
4. `src/app/suburbs/[id]/page.tsx` - Detail page display

**Medium Priority** (User interface):
1. `src/components/SafetyRatingBadge.tsx`
2. `src/app/heatmap/page.tsx` - Heat map labels
3. `src/app/suburbs/page.tsx` - Listing page

**Low Priority** (Polish):
1. Documentation and help text
2. Error messages and tooltips
3. Chart labels and legends

## Current Data Flow

```
WA Police Data → Crime Service → Safety Rating Service → Frontend Components
     ↓              ↓                    ↓                      ↓
Raw Excel     District-level     Multi-factor         UI Display
Crime Data    Crime Profiles     Safety Score         (1-10 scale)
```

## ✅ IMPLEMENTATION COMPLETED

### Changes Made:

#### **1. Core Algorithm Changes**
- **Crime Score**: Now 70% direct crime + 30% neighborhood crime (removed demographics/trends)
- **Convenience Score**: Now 25% each for transport/shopping/education/recreation
- **Scoring Direction**: Crime score inverted (higher = worse), convenience/investment (higher = better)

#### **2. Type System Updates**
- **New Interfaces**: `CrimeScore`, `SuburbRating`, updated `ConvenienceScore`
- **Backward Compatibility**: Legacy `SafetyRating` interface maintained
- **File**: `src/types/index.ts` completely updated

#### **3. Service Layer Updates**
- **CrimeScoreService**: New class in `safety-rating-service.ts`
- **Method Updates**: `calculateCrimeScore()` + legacy `calculateSafetyRating()`
- **Confidence Calculation**: Now crime-data focused (80% crime + 20% neighborhood)

#### **4. API Endpoints**
- **New Endpoint**: `/api/safety?action=crime&sal_code=XXXXX` for pure crime scores
- **Updated Descriptions**: All algorithm descriptions reflect new weightings
- **Backward Compatibility**: Legacy safety endpoints still work

#### **5. Frontend Components**
- **New Component**: `CrimeScoreBadge.tsx` with proper color coding (red = bad)
- **Heat Map Updates**: Metric buttons changed to crime/convenience/investment
- **State Management**: `selectedMetric` updated to support new types

#### **6. Heat Map Visualization**
- **Interface Updates**: `HeatMapPoint` with crime/convenience/investment fields
- **Color Logic**: Crime uses darker colors for worse areas (correct)
- **Metric Support**: Supports 'crime', 'convenience', 'investment' metrics

### **Validation Points**

**To verify correct implementation**:
1. **API Test**: `/api/safety?action=crime&sal_code=50008` - Returns CrimeScore format
2. **Legacy Test**: `/api/safety?action=suburb&sal_code=50008` - Returns converted SafetyRating
3. **Heat Map**: Visit `/heatmap` - Buttons show Crime Score/Convenience Score/Investment Score
4. **Build Test**: `npm run build` - Compiles successfully ✅

### **Key Architectural Decisions**
1. **Maintained Legacy Support**: Old APIs still work for backward compatibility
2. **Clear Separation**: Crime vs Convenience vs Investment as distinct metrics
3. **Proper Scaling**: All scores use 1-10 scale with clear direction indicators
4. **Component Consistency**: All frontend components align with backend logic