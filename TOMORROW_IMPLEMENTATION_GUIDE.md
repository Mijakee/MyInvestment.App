# TOMORROW'S IMPLEMENTATION GUIDE
**Quick Start Guide for Static Convenience Data Integration**

---

## 🚀 **QUICK START (15 minutes)**

### 1. **Create SLIP Account**
```
https://www.slip.wa.gov.au/
- Click "Register"
- Fill basic details (free account)
- Verify email
- Login credentials for downloads
```

### 2. **Download Missing Datasets**
```bash
# Schools Data
curl -L "[SLIP-SCHOOLS-URL]" -o "src/data/convenience-data/schools/wa-schools.xlsx"

# Health Data
curl -L "https://data-downloads.slip.wa.gov.au/HEALTH-001/GeoJSON" -o "src/data/convenience-data/health/wa-health.geojson"

# Recreation Data
curl -L "[SLIP-PARKS-URL]" -o "src/data/convenience-data/recreation/wa-parks.zip"
```

### 3. **Verify Transport Data**
```bash
ls -la src/data/convenience-data/transport/
# Should show: stops.txt (1.4MB), routes.txt (18KB)
head -3 src/data/convenience-data/transport/stops.txt
```

---

## 🔧 **IMPLEMENTATION STEPS**

### **Step 1: Create Static Data Parser (1-2 hours)**
Create: `src/lib/static-convenience-parser.ts`

```typescript
interface ConveniencePoint {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  metadata?: any
}

export class StaticConvenienceParser {
  // Parse GTFS stops.txt → transport points
  parseTransportStops(): ConveniencePoint[]

  // Parse schools Excel → education points
  parseSchoolsData(): ConveniencePoint[]

  // Parse health GeoJSON → medical points
  parseHealthData(): ConveniencePoint[]

  // Parse parks data → recreation points
  parseRecreationData(): ConveniencePoint[]

  // Calculate distance-based convenience score
  calculateConvenienceScore(lat: number, lng: number): ConvenienceScore
}
```

### **Step 2: Update Convenience Service (30 minutes)**
Modify: `src/lib/data-sources/convenience-score-service.ts`

```typescript
// Replace API calls with static data
import { staticConvenienceParser } from '../static-convenience-parser'

export class ConvenienceScoreService {
  async calculateConvenienceScore(latitude: number, longitude: number): Promise<ConvenienceScore> {
    // Use static data instead of external APIs
    return staticConvenienceParser.calculateConvenienceScore(latitude, longitude)
  }
}
```

### **Step 3: Update Data Generation (15 minutes)**
Modify: `src/scripts/update-precomputed-data.ts`

```typescript
// Remove geographic defaults fallback
// Remove this block:
if (!convenienceData) {
  console.warn(`No convenience data available for ${suburb.sal_name}, using defaults...`)
  // Geographic defaults code...
}

// Replace with error handling:
if (!convenienceData) {
  throw new Error(`Convenience calculation failed for ${suburb.sal_name}`)
}
```

### **Step 4: Re-run Data Generation (1 hour)**
```bash
npm run update-data
# Should process all 1,701 suburbs with real convenience data
```

---

## 📊 **EXPECTED RESULTS**

### **Transport Scores**
- **Perth CBD**: 9+ (multiple train/bus lines)
- **Perth Suburbs**: 6-8 (regular bus service)
- **Regional Towns**: 3-5 (limited service)
- **Remote Areas**: 1-2 (no public transport)

### **Schools Scores**
- **Family Suburbs**: 8-9 (multiple nearby schools)
- **CBD Areas**: 4-6 (fewer schools, more commercial)
- **Regional**: 5-7 (district schools available)
- **Remote**: 2-4 (limited school access)

### **Health Scores**
- **Near Hospitals**: 8-10 (major medical facilities)
- **Perth Metro**: 6-8 (clinics and hospitals accessible)
- **Regional Towns**: 4-6 (basic medical services)
- **Remote**: 1-3 (limited medical access)

---

## 🔍 **VERIFICATION CHECKLIST**

### **Data Quality Checks**
- [ ] All 1,701 suburbs have convenience scores >1 and <10
- [ ] Perth metro averages 6-8, regional averages 3-6
- [ ] Transport scores correlate with actual bus/train access
- [ ] School scores reflect real education facility proximity
- [ ] Health scores show realistic medical access patterns

### **API Consistency Checks**
- [ ] Heatmap API shows varied convenience scores (not all 3.5/6.5)
- [ ] Individual suburb APIs match heatmap data exactly
- [ ] Confidence scores >0.8 for all convenience calculations
- [ ] Response times remain <1 second

### **Application Function Checks**
- [ ] Heat map shows realistic convenience gradients
- [ ] Suburb detail pages show actual facility counts
- [ ] Investment scores combine safety + convenience properly
- [ ] No "defaults" or "estimates" in API responses

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**
1. **SLIP Login Required**: Most WA datasets need free account
2. **File Format Issues**: Use GeoJSON/CSV over shapefile when possible
3. **Coordinate Systems**: Ensure WGS84 (lat/lng) not GDA2020
4. **Memory Usage**: Large datasets may need streaming/chunking
5. **Distance Calculations**: Use Haversine formula or Turf.js

### **Fallback Plans**
- **Schools**: Use OpenStreetMap education POI if SLIP unavailable
- **Health**: Use Yellow Pages medical facilities as backup
- **Recreation**: Use OpenStreetMap parks/recreation areas
- **Shopping**: Always use OpenStreetMap retail/commercial POI

---

## 📞 **RESOURCES**

### **Documentation**
- **GTFS Reference**: https://gtfs.org/reference/static
- **Turf.js Distance**: https://turfjs.org/docs/#distance
- **WA Data Portal**: https://catalogue.data.wa.gov.au/

### **Test Suburbs for Verification**
- **Perth CBD** (50645): Should have high transport/health, lower schools/recreation
- **Subiaco** (51565): Should have balanced high scores across all factors
- **Mandurah** (51375): Should have medium scores, good recreation (coastal)
- **Kalgoorlie** (50950): Should have low transport, medium other factors
- **Broome** (50265): Should have low scores except recreation (tourism)

---

## 🎯 **SUCCESS DEFINITION**

**Mission Complete When:**
1. All 1,701 suburbs show realistic convenience variations
2. API consistency maintained (same scores across all endpoints)
3. Performance remains excellent (<1 second responses)
4. Confidence scores >0.8 for convenience calculations
5. Clear differentiation between metro/regional/remote areas

**Time Estimate**: 4-5 hours total
**Main Blocker**: SLIP account creation (5 minutes)
**Expected Outcome**: Production-ready app with 100% real government data