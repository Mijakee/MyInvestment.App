# API Usage Guide

## Base URL
```
http://localhost:3000/api  (Development)
https://your-domain.com/api  (Production)
```

## Quick Start

### Test System Health
```bash
GET /api/integration/test
```
Returns system health metrics, data quality scores, and performance information.

### Get Suburb Safety Rating
```bash
GET /api/safety?sal_code=50001
```
Returns detailed safety analysis for a specific suburb.

### Calculate Real-Time Convenience
```bash
GET /api/convenience-enhanced?lat=-31.9505&lng=115.8605
```
Returns convenience score based on nearby facilities.

---

## Core Endpoints

### 1. Integration Test - System Health

**Endpoint**: `GET /api/integration/test`
**Purpose**: Check system health and data quality
**Response Time**: ~15-20 seconds
**Use Case**: Monitoring, troubleshooting, system validation

**Parameters**: None

**Response**:
```json
{
  "testId": "integration-test-1234567890",
  "timestamp": "2025-09-25T08:54:55.596Z",
  "dataConnections": {
    "censusDataAvailability": 1.0,
    "crimeDataAvailability": 0.9,
    "suburbDataAvailability": 1.0,
    "hasValidCensusData": true,
    "hasValidCrimeData": true
  },
  "sampleSuburbTests": [
    {
      "salCode": "50001",
      "suburbName": "Abba River",
      "censusConnected": true,
      "crimeConnected": true,
      "safetyRatingCalculated": true,
      "overallRating": 9.32920256,
      "dataQuality": "high"
    }
  ],
  "systemPerformance": {
    "responseTimeMs": 15327,
    "cacheHitRate": 0.85,
    "dataProcessingTime": 9196.2
  },
  "summary": {
    "realDataPercentage": 95.0,
    "overallHealthScore": 97,
    "readyForProduction": true,
    "recommendations": []
  }
}
```

**Key Metrics**:
- `overallHealthScore`: 0-100 system health
- `realDataPercentage`: % of real vs estimated data
- `readyForProduction`: Boolean system status

### 2. Safety Rating Analysis

**Endpoint**: `GET /api/safety`
**Purpose**: Get detailed safety ratings and crime analysis
**Response Time**: <1 second
**Use Case**: Property investment analysis, safety assessment

**Parameters**:
- `sal_code` (required): Suburb ABS code (e.g., "50001")
- `action` (optional): "calculate" (default), "test", "range"

**Example Request**:
```bash
curl "http://localhost:3000/api/safety?sal_code=50001"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "suburbCode": "50001",
    "suburbName": "Abba River",
    "overallRating": 9.33,
    "components": {
      "crimeRating": 1.67,
      "demographicRating": 7.5,
      "neighborhoodRating": 8.0,
      "trendRating": 8.0
    },
    "crimeBreakdown": {
      "totalCrimes": 8,
      "violentCrimes": 2,
      "propertyCrimes": 4,
      "otherCrimes": 2,
      "crimeRate": 9.2
    },
    "confidence": 0.86,
    "coordinates": {
      "latitude": -33.683,
      "longitude": 115.488
    },
    "lastUpdated": "2025-09-25T15:08:53.128Z",
    "dataSource": "wa_police_excel_2025"
  }
}
```

**Understanding the Response**:
- `overallRating`: 1-10 safety score (higher = safer)
- `crimeRating`: Crime component (lower = less crime)
- `confidence`: 0-1 data reliability
- `crimeRate`: Crimes per 1000 residents

### 3. Enhanced Convenience Scoring

**Endpoint**: `GET /api/convenience-enhanced`
**Purpose**: Real-time convenience calculation with comprehensive facility data
**Response Time**: <1 second
**Use Case**: Lifestyle assessment, amenity analysis

**Parameters**:
- `lat` (required): Latitude (-31.9505)
- `lng` (required): Longitude (115.8605)
- `action` (optional): "calculate" (default), "test", "multi-location"

**Example Request**:
```bash
curl "http://localhost:3000/api/convenience-enhanced?lat=-31.9505&lng=115.8605"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "location": {
      "latitude": -31.9505,
      "longitude": 115.8605
    },
    "overallScore": 9.8,
    "confidence": 1.0,
    "components": {
      "shopping": {
        "score": 10,
        "weight": 0.30,
        "nearbyShoppingCentres": 19,
        "nearbyGroceries": 95,
        "facilitiesWithin2km": 15,
        "facilitiesWithin5km": 114
      },
      "health": {
        "score": 9.5,
        "weight": 0.25,
        "nearbyHealthCare": 185,
        "nearbyPharmacies": 235,
        "facilitiesWithin5km": 103,
        "facilitiesWithin10km": 420
      },
      "recreation": {
        "score": 9.5,
        "weight": 0.25,
        "nearbyParks": 93,
        "nearbyLeisureCentres": 38,
        "facilitiesWithin2km": 13,
        "beachAccess": false
      },
      "transport": {
        "score": 10,
        "weight": 0.20,
        "nearbyStops": 341,
        "stopsWithin1km": 197,
        "stopsWithin2km": 341
      }
    },
    "explanation": {
      "shoppingSummary": "Excellent shopping access (15 facilities within 2km)",
      "healthSummary": "Excellent health access (103 facilities within 5km)",
      "recreationSummary": "Excellent recreation access (13 facilities within 2km)",
      "transportSummary": "Excellent public transport (197 stops within 1km)",
      "overallSummary": "Exceptional convenience with excellent access to all amenities"
    },
    "dataSource": "comprehensive_facility_data",
    "facilityTypes": "Shopping, Groceries, Health Care, Pharmacies, Leisure Centres, Parks",
    "performance": "Static data - no API rate limits"
  },
  "metadata": {
    "purpose": "Enhanced convenience scoring with comprehensive facility data",
    "algorithm": "Shopping(30%) + Health(25%) + Recreation(25%) + Transport(20%)",
    "data_sources": ["OSM Static Data", "GTFS Transport Data"],
    "note": "Uses 38,862 comprehensive facility dataset"
  }
}
```

**Key Components**:
- Each component has score (1-10) and weight (%)
- Facility counts show nearby amenities
- Explanations provide human-readable summaries

### 4. Legacy Convenience (Precomputed)

**Endpoint**: `GET /api/convenience`
**Purpose**: Fast precomputed convenience scores
**Response Time**: <1 second
**Use Case**: Bulk analysis, quick lookups

**Parameters**:
- `sal_code` (required): Suburb ABS code
- `action` (optional): "calculate", "combined", "range", "test"

**Combined Investment Score**:
```bash
curl "http://localhost:3000/api/convenience?sal_code=50001&action=combined"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "suburbCode": "50001",
    "suburbName": "Abba River",
    "safety": {
      "rating": 9.3,
      "weight": 0.6
    },
    "convenience": {
      "score": 1.0,
      "weight": 0.4
    },
    "combined": {
      "investmentScore": 5.98,
      "recommendation": "Fair",
      "color": "#FFA500",
      "explanation": "Based on 9.3/10 safety and 1.0/10 convenience"
    },
    "coordinates": {
      "latitude": -33.683,
      "longitude": 115.488
    },
    "confidence": 0.86,
    "dataSource": "precomputed_static_data"
  }
}
```

### 5. Heat Map Data

**Endpoint**: `GET /api/heatmap`
**Purpose**: Visualization data for mapping interfaces
**Response Time**: 1-5 seconds
**Use Case**: Interactive maps, data visualization

**Parameters**:
- `action` (optional): "optimized" (default), "full", "bounded", "statistics", "export", "test"

**Optimized Data** (100 suburbs for fast loading):
```bash
curl "http://localhost:3000/api/heatmap?action=optimized"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "suburbs": [
      {
        "sal_code": "50001",
        "sal_name": "Abba River",
        "coordinates": {
          "latitude": -33.683,
          "longitude": 115.488
        },
        "scores": {
          "safety": 9.3,
          "convenience": 1.0,
          "investment": 5.98
        },
        "metadata": {
          "confidence": 0.86,
          "population": 865
        }
      }
    ],
    "statistics": {
      "totalSuburbs": 100,
      "averageScores": {
        "safety": 7.8,
        "convenience": 5.2,
        "investment": 6.8
      },
      "bounds": {
        "north": -28.7774,
        "south": -35.0267,
        "east": 129.0023,
        "west": 112.9211
      }
    }
  },
  "metadata": {
    "purpose": "Optimized heat map data",
    "optimization": "100 suburbs for fast loading",
    "performanceImprovement": "94% faster than full dataset"
  }
}
```

### 6. Suburb Database

**Endpoint**: `GET /api/suburbs`
**Purpose**: Search and retrieve suburb information
**Response Time**: <1 second
**Use Case**: Suburb lookup, search functionality

**Parameters**:
- `sal_code` (optional): Specific suburb code
- `search` (optional): Name search query
- `limit` (optional): Result limit (default 10)

**Search Example**:
```bash
curl "http://localhost:3000/api/suburbs?search=perth&limit=5"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "suburbs": [
      {
        "sal_code": "50644",
        "sal_name": "Perth",
        "coordinates": {
          "latitude": -31.9505,
          "longitude": 115.8605
        },
        "state": "WA"
      }
    ],
    "total": 1,
    "query": "perth",
    "limit": 5
  }
}
```

---

## Common Usage Patterns

### 1. Property Investment Analysis

**Step 1**: Get suburb safety rating
```bash
curl "http://localhost:3000/api/safety?sal_code=50644"
```

**Step 2**: Get convenience score
```bash
curl "http://localhost:3000/api/convenience-enhanced?lat=-31.9505&lng=115.8605"
```

**Step 3**: Get combined investment recommendation
```bash
curl "http://localhost:3000/api/convenience?sal_code=50644&action=combined"
```

### 2. Suburb Comparison

**Get multiple suburb data**:
```bash
# Suburb A
curl "http://localhost:3000/api/convenience?sal_code=50644&action=combined"

# Suburb B
curl "http://localhost:3000/api/convenience?sal_code=50001&action=combined"
```

**Compare scores in your application**:
```javascript
const suburbA = await fetch('/api/convenience?sal_code=50644&action=combined').then(r => r.json())
const suburbB = await fetch('/api/convenience?sal_code=50001&action=combined').then(r => r.json())

console.log('Investment scores:', {
  suburbA: suburbA.data.combined.investmentScore,
  suburbB: suburbB.data.combined.investmentScore
})
```

### 3. Heat Map Visualization

**Get optimized data for fast loading**:
```bash
curl "http://localhost:3000/api/heatmap?action=optimized"
```

**Process for mapping**:
```javascript
const heatmapData = await fetch('/api/heatmap?action=optimized').then(r => r.json())

heatmapData.data.suburbs.forEach(suburb => {
  // Add to your map visualization
  addSuburbToMap({
    position: [suburb.coordinates.latitude, suburb.coordinates.longitude],
    safetyScore: suburb.scores.safety,
    convenienceScore: suburb.scores.convenience,
    name: suburb.sal_name
  })
})
```

### 4. System Monitoring

**Health check endpoint**:
```bash
curl "http://localhost:3000/api/integration/test"
```

**Check specific metrics**:
```javascript
const health = await fetch('/api/integration/test').then(r => r.json())

if (health.summary.overallHealthScore < 90) {
  console.warn('System health below optimal:', health.summary.overallHealthScore)
}

if (health.summary.realDataPercentage < 95) {
  console.warn('Real data percentage low:', health.summary.realDataPercentage)
}
```

---

## Response Format Standards

### Success Response
```json
{
  "success": true,
  "data": {
    // Main response data
  },
  "metadata": {
    // Additional information about the request/response
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Human-readable error message",
  "message": "Additional details if available"
}
```

### HTTP Status Codes
- **200**: Success
- **400**: Bad Request (missing/invalid parameters)
- **404**: Not Found (suburb code doesn't exist)
- **500**: Server Error (processing failed)

---

## Rate Limiting and Performance

### Rate Limits
- **No strict rate limits** currently implemented
- **Recommended**: Max 60 requests/minute per client
- **Heavy endpoints** (integration test): Max 1 request/minute

### Performance Tips
1. **Use precomputed endpoints** when possible for speed
2. **Cache responses** for 1-24 hours depending on use case
3. **Batch requests** instead of individual calls when possible
4. **Monitor response times** and adjust if needed

### Response Time Expectations
- **Fast endpoints** (<1 second): safety, convenience, suburbs
- **Medium endpoints** (1-5 seconds): heatmap
- **Slow endpoints** (15-20 seconds): integration test

---

## Error Handling

### Common Errors

**Invalid SAL Code**:
```json
{
  "success": false,
  "error": "Suburb 99999 not found in precomputed data"
}
```

**Missing Parameters**:
```json
{
  "success": false,
  "error": "sal_code parameter required for calculate action"
}
```

**Invalid Coordinates**:
```json
{
  "success": false,
  "error": "Invalid lat/lng coordinates"
}
```

### Retry Logic
```javascript
async function apiCallWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        return data
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

---

## Integration Examples

### JavaScript/React
```javascript
import { useState, useEffect } from 'react'

function SuburbAnalysis({ salCode }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSuburbData() {
      try {
        const [safety, convenience] = await Promise.all([
          fetch(`/api/safety?sal_code=${salCode}`).then(r => r.json()),
          fetch(`/api/convenience?sal_code=${salCode}&action=combined`).then(r => r.json())
        ])

        setData({
          safety: safety.data,
          investment: convenience.data
        })
      } catch (error) {
        console.error('Failed to load suburb data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSuburbData()
  }, [salCode])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2>{data.safety.suburbName}</h2>
      <p>Safety Rating: {data.safety.overallRating}/10</p>
      <p>Investment Score: {data.investment.combined.investmentScore}/10</p>
      <p>Recommendation: {data.investment.combined.recommendation}</p>
    </div>
  )
}
```

### Python
```python
import requests

def get_suburb_analysis(sal_code):
    base_url = "http://localhost:3000/api"

    # Get safety data
    safety_response = requests.get(f"{base_url}/safety?sal_code={sal_code}")
    safety_data = safety_response.json()

    # Get investment recommendation
    investment_response = requests.get(f"{base_url}/convenience?sal_code={sal_code}&action=combined")
    investment_data = investment_response.json()

    return {
        'suburb_name': safety_data['data']['suburbName'],
        'safety_rating': safety_data['data']['overallRating'],
        'investment_score': investment_data['data']['combined']['investmentScore'],
        'recommendation': investment_data['data']['combined']['recommendation']
    }

# Usage
suburb_analysis = get_suburb_analysis('50644')  # Perth
print(f"Suburb: {suburb_analysis['suburb_name']}")
print(f"Safety: {suburb_analysis['safety_rating']}/10")
print(f"Investment: {suburb_analysis['investment_score']}/10")
```

### curl Scripts
```bash
#!/bin/bash
# suburb_analysis.sh - Get complete suburb analysis

SAL_CODE=$1
BASE_URL="http://localhost:3000/api"

if [ -z "$SAL_CODE" ]; then
    echo "Usage: $0 <sal_code>"
    exit 1
fi

echo "Analyzing suburb $SAL_CODE..."

echo "Safety Rating:"
curl -s "$BASE_URL/safety?sal_code=$SAL_CODE" | jq '.data.overallRating'

echo "Investment Recommendation:"
curl -s "$BASE_URL/convenience?sal_code=$SAL_CODE&action=combined" | jq '.data.combined.recommendation'

echo "System Health:"
curl -s "$BASE_URL/integration/test" | jq '.summary.overallHealthScore'
```

---

## Testing and Debugging

### Testing Endpoints
```bash
# Test all major endpoints
curl http://localhost:3000/api/integration/test
curl http://localhost:3000/api/safety?sal_code=50001
curl http://localhost:3000/api/convenience-enhanced?action=test
curl http://localhost:3000/api/heatmap?action=test
```

### Debugging Tips
1. **Check system health** first with integration test
2. **Validate parameters** are correct format
3. **Check response times** for performance issues
4. **Review confidence scores** for data quality
5. **Test with known suburbs** (50001, 50644) for baseline

### Response Validation
```javascript
function validateApiResponse(response) {
  if (!response.success) {
    throw new Error(`API Error: ${response.error}`)
  }

  if (response.data.confidence < 0.6) {
    console.warn('Low confidence data:', response.data.confidence)
  }

  return response.data
}
```

---

**Ready to integrate?** Start with the health check endpoint and then explore the specific APIs you need for your use case!