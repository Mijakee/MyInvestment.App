# Developer Quick Start Guide

## Prerequisites

- **Node.js 18+** (required for modern JavaScript features)
- **npm or yarn** (package manager)
- **Git** (for version control)
- **2GB+ RAM** (for data processing)
- **500MB+ storage** (for full dataset)

## Installation

### 1. Clone and Setup
```bash
git clone <repository-url>
cd MyInvestmentApp
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
# (Optional - app works without external services)
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Quick Health Check

### Test System Status
```bash
# Check API health
curl http://localhost:3000/api/integration/test

# Quick convenience API test
curl http://localhost:3000/api/convenience-enhanced?action=test

# Check specific suburb
curl http://localhost:3000/api/safety?sal_code=50001
```

Expected responses should show `"success": true` and health scores above 95%.

## Available Commands

### Development
```bash
npm run dev          # Start development server (hot reload)
npm run build        # Build for production
npm start           # Start production server
npm run type-check  # TypeScript type checking
npm run lint        # Code quality checks
```

### Data Processing
```bash
npm run update-data                    # Generate precomputed suburb scores
npm run update-data:specific          # Update specific suburbs only
npm run generate-osm-data             # Generate OSM facility data
npm run collect-comprehensive-osm     # Collect comprehensive facilities
```

## Project Structure

```
MyInvestmentApp/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   ├── heatmap/           # Heat map visualization page
│   │   └── suburbs/[id]/      # Dynamic suburb pages
│   ├── components/            # React components
│   ├── lib/                   # Core business logic
│   │   ├── enhanced-convenience-score-service.ts
│   │   ├── safety-rating-service.ts
│   │   ├── precomputed-data-service.ts
│   │   └── wa-suburb-loader.ts
│   ├── scripts/               # Data processing scripts
│   ├── types/                 # TypeScript type definitions
│   └── data/                  # Static data files
├── TECHNICAL_DOCUMENTATION.md # Complete technical docs
├── USER_GUIDE.md              # User-facing guide
└── package.json               # Dependencies and scripts
```

## Key APIs to Know

### System Health
```bash
GET /api/integration/test
# Returns: System health, data quality, performance metrics
```

### Suburb Safety Analysis
```bash
GET /api/safety?sal_code=50001
# Returns: Safety rating, crime breakdown, demographics
```

### Enhanced Convenience Scoring
```bash
GET /api/convenience-enhanced?lat=-31.9505&lng=115.8605
# Returns: Real-time convenience calculation with facility breakdown
```

### Heat Map Data
```bash
GET /api/heatmap?action=optimized
# Returns: Optimized dataset for visualization (100 suburbs)
```

### Suburb Database
```bash
GET /api/suburbs?search=perth
# Returns: Suburb search results and basic info
```

## Development Workflows

### Adding New Features

1. **Create API endpoint** in `src/app/api/`
2. **Add business logic** in `src/lib/`
3. **Define types** in `src/types/`
4. **Test locally** with curl or browser
5. **Update documentation**

### Working with Data

1. **Understand data flow**: Raw → Processing → Precomputed → API
2. **Check data quality** via integration test
3. **Use existing services** for data access
4. **Validate results** against known suburbs

### Testing Changes

```bash
# Run type checking
npm run type-check

# Test API endpoints
curl http://localhost:3000/api/integration/test

# Check specific functionality
curl http://localhost:3000/api/convenience-enhanced?action=multi-location
```

## Common Development Tasks

### Adding a New API Endpoint

1. Create file: `src/app/api/your-endpoint/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const param = searchParams.get('param')

    // Your logic here
    const result = await yourService.process(param)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
```

2. Test your endpoint:
```bash
curl http://localhost:3000/api/your-endpoint?param=value
```

### Using Existing Data Services

```typescript
// Import the service
import { precomputedDataService } from '../../../lib/precomputed-data-service'
import { enhancedConvenienceScoreService } from '../../../lib/enhanced-convenience-score-service'

// In your API or component
const suburbData = precomputedDataService.getSuburbScore('50001')
const convenienceScore = await enhancedConvenienceScoreService.calculateEnhancedConvenienceScore(-31.9505, 115.8605)
```

### Processing New Data

1. **Add raw data** to appropriate directory in `src/data/`
2. **Create or modify processing script** in `src/scripts/`
3. **Run processing** with `npm run` command
4. **Test results** via API endpoints
5. **Update precomputed data** with `npm run update-data`

## Data Sources Overview

### Current Data Files
- **Crime**: `src/data/crime/wa_police_crime_timeseries.xlsx` (15.8MB)
- **Suburbs**: `src/data/wa_suburbs.json` (1,701 suburbs)
- **Facilities**: `src/data/convenience-data/osm-static/` (38,862 facilities)
- **Precomputed**: `src/data/precomputed-suburb-scores.json` (all ratings)

### Data Quality
- **Crime Data**: 90% coverage, 199,800+ records
- **Census Data**: 99.9% coverage, ABS 2021
- **Geographic Data**: 100% coverage, ABS boundaries
- **Facility Data**: 100% coverage, population-weighted

## Performance Considerations

### API Response Times
- **Target**: <1 second for most endpoints
- **Optimization**: Use precomputed data service when possible
- **Heavy operations**: Run async or in background

### Memory Usage
- **Precomputed service**: Loads ~50MB data at startup
- **Enhanced convenience**: Loads ~20MB facility data
- **Monitoring**: Check via integration test

### Caching Strategy
- **Static data**: Cached indefinitely (doesn't change)
- **API responses**: 24-hour cache headers
- **Development**: No caching for testing

## Troubleshooting

### Common Issues

**"Module not found" errors**:
```bash
# Clear node modules and reinstall
rm -rf node_modules
npm install
```

**TypeScript errors**:
```bash
# Run type checking
npm run type-check

# Check specific files
npx tsc --noEmit src/path/to/file.ts
```

**Data not loading**:
```bash
# Check data files exist
ls src/data/precomputed-suburb-scores.json

# Regenerate if needed
npm run update-data
```

**API errors**:
```bash
# Check server logs in terminal
# Test system health
curl http://localhost:3000/api/integration/test
```

### Debug Mode

Add debug logging to any service:
```typescript
console.log('Debug info:', { variable, state })
console.time('operation-name')
// ... your code
console.timeEnd('operation-name')
```

## Production Deployment

### Build and Test
```bash
# Type check
npm run type-check

# Build production bundle
npm run build

# Test production build locally
npm start
```

### Static Export (Optional)
```bash
# Add to next.config.js
module.exports = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true }
}

# Build static version
npm run build
```

### Firebase Deployment
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Deploy
firebase deploy
```

## Best Practices

### Code Style
- **Use TypeScript** for all new code
- **Follow existing patterns** for consistency
- **Add error handling** for all API endpoints
- **Include JSDoc comments** for complex functions

### API Design
- **Consistent response format**: `{ success: boolean, data: any, error?: string }`
- **Proper HTTP status codes**: 200, 400, 404, 500
- **Parameter validation**: Check required parameters
- **Error messages**: User-friendly, no stack traces

### Data Processing
- **Validate inputs**: Check data before processing
- **Handle missing data**: Graceful degradation
- **Performance logging**: Time expensive operations
- **Memory management**: Clean up large data structures

## Extending the System

### Adding New Data Sources
1. **Create parser** in `src/lib/` or `src/scripts/`
2. **Define data types** in `src/types/`
3. **Add processing script** with npm command
4. **Update precomputed data** generation
5. **Create API endpoint** for access

### Adding New Metrics
1. **Design calculation algorithm**
2. **Implement in service class**
3. **Add to precomputed data structure**
4. **Create API endpoint**
5. **Update documentation**

### Adding New Visualizations
1. **Create API endpoint** for data
2. **Build React component**
3. **Add to app router**
4. **Style with Tailwind CSS**
5. **Test responsiveness**

## Resources

### Documentation
- **Technical Documentation**: `TECHNICAL_DOCUMENTATION.md`
- **User Guide**: `USER_GUIDE.md`
- **This Guide**: `DEVELOPER_QUICK_START.md`

### External APIs
- **ABS Data**: https://api.data.abs.gov.au
- **WA Police**: https://www.wa.gov.au/organisation/western-australia-police-force
- **Transperth**: https://www.transperth.wa.gov.au/TimetablesMaps/LiveTrainTimes

### Tools
- **Next.js Docs**: https://nextjs.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs

## Getting Help

### For Development Issues
1. **Check logs** in terminal running `npm run dev`
2. **Run integration test** to check system health
3. **Check TypeScript** with `npm run type-check`
4. **Review error messages** carefully

### For Data Issues
1. **Check data files** exist and have content
2. **Run data processing** scripts to regenerate
3. **Check integration test** for data quality metrics
4. **Review confidence scores** in API responses

### For Performance Issues
1. **Check API response times** with curl timing
2. **Monitor memory usage** in system metrics
3. **Review caching** strategy and hit rates
4. **Profile expensive operations**

---

**Ready to develop?** Start with `npm run dev` and explore the APIs at `http://localhost:3000/api/`. The integration test at `/api/integration/test` is your best friend for system health checking!