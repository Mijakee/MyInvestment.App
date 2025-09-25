# Investment App - Property Analysis Platform

A comprehensive property investment analysis platform that evaluates suburbs across Western Australia using real government data. Provides safety ratings and convenience scores to help investors and homebuyers make informed residential property decisions.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test system health
curl http://localhost:3000/api/integration/test
```

Visit `http://localhost:3000` to access the application.

## 📚 Documentation

All comprehensive documentation is located in the `/docs` folder:

- **[📖 Complete Guide](docs/README.md)** - Main documentation hub with navigation
- **[👤 User Guide](docs/USER_GUIDE.md)** - Understanding ratings and using the app
- **[⚡ Developer Quick Start](docs/DEVELOPER_QUICK_START.md)** - Setup and development
- **[🔌 API Usage Guide](docs/API_USAGE_GUIDE.md)** - API integration and examples
- **[📊 Data Sources Guide](docs/DATA_SOURCES_GUIDE.md)** - Data explanation and quality
- **[⚙️ Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md)** - Complete technical reference

## System Status ✅

- **Health Score**: 97/100
- **Real Data Coverage**: 95%+
- **WA Suburbs**: 1,701 complete coverage
- **Crime Records**: 199,800+ (WA Police 2007-2025)
- **Facilities**: 38,862 comprehensive database
- **API Performance**: <1 second response times

## Key Features

- **Safety Ratings** (1-10): Crime, demographics, neighborhood analysis
- **Convenience Scores** (1-10): Shopping, health, transport, recreation
- **Investment Index**: Combined guidance for property decisions
- **Interactive Heat Maps**: Visual suburb comparisons
- **Production APIs**: Complete backend services

## Quick API Test

```bash
# System health check
curl http://localhost:3000/api/integration/test

# Perth CBD analysis
curl http://localhost:3000/api/safety?sal_code=50644
curl "http://localhost:3000/api/convenience-enhanced?lat=-31.9505&lng=115.8605"
```

## Data Sources

- **Crime Data**: WA Police official statistics (199,800+ records)
- **Demographics**: ABS 2021 Census (99.9% coverage)
- **Facilities**: Comprehensive database (38,862 facilities)
- **Geographic**: Official ABS suburb boundaries

---

**Get Started**: Read the [Documentation](docs/) for detailed guides and technical information.