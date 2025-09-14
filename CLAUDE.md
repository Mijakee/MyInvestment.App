# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web and mobile application that analyzes Australian Census data (2011, 2016, 2021) and crime statistics (2007-2025) to generate safety ratings for suburbs, helping property investors and homebuyers make informed decisions about residential investments.

## Technology Stack

- **Frontend Web**: Next.js 15 with TypeScript, Tailwind CSS
- **Mobile**: React Native with Expo
- **Backend**: Firebase Functions (Node.js)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting (within free tier limits)
- **Data Processing**: Firebase Functions for CSV parsing and analysis

## Development Status

- **Current State**: Basic project structure established
- **Branch**: master (initial setup complete)
- **Structure**: Full-stack application with web and mobile clients

## Project Structure

```
MyInvestmentApp/
├── src/                    # Web app source
│   ├── app/               # Next.js app router pages
│   ├── components/        # Reusable React components
│   ├── lib/              # Firebase configuration
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helper functions and constants
│   └── data/             # Static data files
├── mobile/                # React Native mobile app
│   ├── src/
│   │   ├── components/   # Mobile-specific components
│   │   ├── screens/      # App screens
│   │   ├── navigation/   # Navigation configuration
│   │   └── services/     # API services
│   └── App.tsx
├── functions/             # Firebase Cloud Functions
│   └── src/
└── firebase.json         # Firebase configuration
```

## Build Commands

### Web Application
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Mobile Application
```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Build for production (requires Expo EAS)
npm run build:android
npm run build:ios
```

### Firebase Functions
```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build functions
npm run build

# Run Firebase emulators
firebase emulators:start

# Deploy functions
npm run deploy
```

## Development Workflow

1. **Environment Setup**:
   - Copy `.env.example` to `.env.local`
   - Add your Firebase project configuration
   - Run `npm install` in root and `mobile/` directories

2. **Firebase Setup**:
   - Create Firebase project at https://console.firebase.google.com
   - Enable Firestore, Authentication, Functions, and Hosting
   - Update environment variables with your project config

3. **Data Sources**:
   - Australian Census data via ABS API or Excel files
   - WA Police crime statistics via Excel files
   - Data processing handled by Firebase Functions

## Code Architecture

### Shared Types (`src/types/`)
- Suburb, CensusData, CrimeData interfaces
- User preferences and search criteria
- API response types

### Utilities (`src/utils/`)
- Constants for Australian states, census years
- Helper functions for formatting and calculations
- Safety rating algorithms

### Firebase Integration
- Firestore for storing processed suburb data
- Authentication for user preferences
- Functions for data processing and API endpoints
- Security rules for data access control

## Firebase Free Tier Considerations

- **Firestore**: 1GB storage, 50K reads/20K writes/20K deletes per day
- **Hosting**: 1GB storage, 10GB transfer per month
- **Functions**: 2M invocations per month
- **Authentication**: 10K verifications per month

## Testing

Testing framework to be implemented. Consider:
- Jest for unit tests
- Cypress or Playwright for e2e tests
- React Native Testing Library for mobile tests

## Notes

- Project configured for Firebase free tier constraints
- Shared types between web and mobile applications
- Ready for data ingestion and processing implementation