/**
 * Tests for WA Police Crime Data Excel Parser
 */

import {
  parseExcelCrimeData,
  processCrimeData,
  validateCrimeData,
  type RawCrimeDataRecord,
  type ProcessedCrimeData
} from '../crime-parser'
import * as XLSX from 'xlsx'

// Mock data for testing
const createMockExcelData = (): ArrayBuffer => {
  const sampleRows = [
    ['Police District', 'Offence Type', 'Year', 'Quarter', 'Count', 'Rate per 100,000'],
    ['Test District', 'Assault', 2023, 1, 100, 500.0],
    ['Test District', 'Burglary', 2023, 1, 50, 250.0],
    ['Test District', 'Assault', 2023, 2, 120, 600.0],
    ['Another District', 'Theft', 2023, 1, 75, 375.0]
  ]

  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.aoa_to_sheet(sampleRows)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Crime Data')

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
  return buffer.buffer as ArrayBuffer
}

const mockRawData: RawCrimeDataRecord[] = [
  {
    location: 'Test District',
    offenceType: 'Assault',
    year: 2023,
    quarter: 1,
    offenceCount: 100,
    rate: 500.0
  },
  {
    location: 'Test District',
    offenceType: 'Burglary',
    year: 2023,
    quarter: 1,
    offenceCount: 50,
    rate: 250.0
  },
  {
    location: 'Test District',
    offenceType: 'Assault',
    year: 2023,
    quarter: 2,
    offenceCount: 120,
    rate: 600.0
  }
]

describe('Crime Data Parser', () => {
  describe('parseExcelCrimeData', () => {
    it('should successfully parse valid Excel data', async () => {
      const mockData = createMockExcelData()
      const result = await parseExcelCrimeData(mockData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.length).toBeGreaterThan(0)
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.recordCount).toBeGreaterThan(0)
    })

    it('should handle empty Excel files gracefully', async () => {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.aoa_to_sheet([])
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Empty')

      const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })
      const emptyData = buffer.buffer as ArrayBuffer

      const result = await parseExcelCrimeData(emptyData)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should extract correct metadata from Excel file', async () => {
      const mockData = createMockExcelData()
      const result = await parseExcelCrimeData(mockData)

      expect(result.success).toBe(true)
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.sheetsFound).toContain('Crime Data')
      expect(result.metadata!.dateRange).toBeDefined()
      expect(result.metadata!.dateRange.earliest).toMatch(/2023/)
      expect(result.metadata!.dateRange.latest).toMatch(/2023/)
    })
  })

  describe('processCrimeData', () => {
    it('should group raw data by location and time period', () => {
      const processed = processCrimeData(mockRawData)

      expect(processed.length).toBeGreaterThan(0)

      // Should have separate records for Q1 and Q2
      const testDistrictQ1 = processed.find(p =>
        p.location === 'Test District' && p.reportPeriod.startDate.includes('2022-12-31')
      )
      const testDistrictQ2 = processed.find(p =>
        p.location === 'Test District' && p.reportPeriod.startDate.includes('2023-03-31')
      )

      expect(testDistrictQ1).toBeDefined()
      expect(testDistrictQ2).toBeDefined()
    })

    it('should correctly aggregate offences by category', () => {
      const processed = processCrimeData(mockRawData)

      const testDistrictQ1 = processed.find(p =>
        p.location === 'Test District' && p.reportPeriod.startDate.includes('2022-12-31')
      )

      expect(testDistrictQ1).toBeDefined()
      expect(testDistrictQ1!.totalOffences).toBe(150) // 100 assault + 50 burglary
      expect(testDistrictQ1!.offencesByCategory['Violent Crime']).toBe(100)
      expect(testDistrictQ1!.offencesByCategory['Property Crime']).toBe(50)
    })

    it('should calculate proper time periods for quarterly data', () => {
      const processed = processCrimeData(mockRawData)

      const q1Record = processed.find(p =>
        p.location === 'Test District' && p.reportPeriod.startDate.includes('2022-12-31')
      )

      expect(q1Record).toBeDefined()
      expect(q1Record!.reportPeriod.periodType).toBe('quarterly')
      expect(q1Record!.reportPeriod.startDate).toBe('2022-12-31')
      expect(q1Record!.reportPeriod.endDate).toBe('2023-03-30')
    })

    it('should determine correct location levels', () => {
      const mockDataWithLevels: RawCrimeDataRecord[] = [
        { location: 'Western Australia', offenceType: 'Assault', year: 2023, offenceCount: 1000 },
        { location: 'Metropolitan Region', offenceType: 'Assault', year: 2023, offenceCount: 500 },
        { location: 'Perth City Police District', offenceType: 'Assault', year: 2023, offenceCount: 100 },
        { location: 'Fremantle', offenceType: 'Assault', year: 2023, offenceCount: 50 }
      ]

      const processed = processCrimeData(mockDataWithLevels)

      const stateRecord = processed.find(p => p.location === 'Western Australia')
      const regionRecord = processed.find(p => p.location === 'Metropolitan Region')
      const districtRecord = processed.find(p => p.location === 'Perth City Police District')
      const localityRecord = processed.find(p => p.location === 'Fremantle')

      expect(stateRecord?.locationLevel).toBe('state')
      expect(regionRecord?.locationLevel).toBe('region')
      expect(districtRecord?.locationLevel).toBe('district')
      expect(localityRecord?.locationLevel).toBe('locality')
    })
  })

  describe('validateCrimeData', () => {
    const mockProcessedData: ProcessedCrimeData[] = [
      {
        id: 'test-1',
        location: 'Test District 1',
        locationLevel: 'district',
        totalOffences: 100,
        offencesByCategory: { 'Violent Crime': 50, 'Property Crime': 50 },
        crimeRate: 500,
        ratesByCategory: { 'Violent Crime': 250, 'Property Crime': 250 },
        reportPeriod: {
          startDate: '2023-01-01',
          endDate: '2023-03-31',
          periodType: 'quarterly'
        },
        dataQuality: {
          completeness: 0.95,
          lastUpdated: '2023-01-01T00:00:00Z',
          sourceVersion: 'test'
        }
      },
      {
        id: 'test-2',
        location: 'Test District 2',
        locationLevel: 'district',
        totalOffences: 200,
        offencesByCategory: { 'Violent Crime': 100, 'Property Crime': 100 },
        crimeRate: 1000,
        ratesByCategory: { 'Violent Crime': 500, 'Property Crime': 500 },
        reportPeriod: {
          startDate: '2023-01-01',
          endDate: '2023-03-31',
          periodType: 'quarterly'
        },
        dataQuality: {
          completeness: 0.85,
          lastUpdated: '2023-01-01T00:00:00Z',
          sourceVersion: 'test'
        }
      }
    ]

    it('should validate good quality data as valid', () => {
      const validation = validateCrimeData(mockProcessedData)

      expect(validation.isValid).toBe(true)
      expect(validation.errors.length).toBe(0)
      expect(validation.qualityScore).toBeGreaterThan(0.8)
    })

    it('should detect insufficient geographic coverage', () => {
      const limitedData = mockProcessedData.slice(0, 1)
      const validation = validateCrimeData(limitedData)

      expect(validation.warnings.some(w => w.includes('locations found'))).toBe(true)
    })

    it('should detect insufficient temporal coverage', () => {
      const validation = validateCrimeData(mockProcessedData)

      expect(validation.warnings.some(w => w.includes('years of data'))).toBe(true)
    })

    it('should handle empty data gracefully', () => {
      const validation = validateCrimeData([])

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('No crime data found')
      expect(validation.qualityScore).toBe(0)
    })

    it('should calculate quality score correctly', () => {
      const validation = validateCrimeData(mockProcessedData)

      expect(validation.qualityScore).toBeGreaterThan(0)
      expect(validation.qualityScore).toBeLessThanOrEqual(1)
    })
  })

  describe('Integration Tests', () => {
    it('should handle full parse-process-validate pipeline', async () => {
      const mockData = createMockExcelData()

      // Parse
      const parseResult = await parseExcelCrimeData(mockData)
      expect(parseResult.success).toBe(true)

      // Process
      const processedData = processCrimeData(parseResult.data!)
      expect(processedData.length).toBeGreaterThan(0)

      // Validate
      const validation = validateCrimeData(processedData)
      expect(validation.isValid).toBe(true)
    })

    it('should maintain data integrity through pipeline', async () => {
      const mockData = createMockExcelData()

      const parseResult = await parseExcelCrimeData(mockData)
      const processedData = processCrimeData(parseResult.data!)

      // Check that total offences are preserved
      const totalRawOffences = parseResult.data!.reduce((sum, record) => sum + record.offenceCount, 0)
      const totalProcessedOffences = processedData.reduce((sum, record) => sum + record.totalOffences, 0)

      expect(totalProcessedOffences).toBe(totalRawOffences)
    })
  })
})

// Mock fetch for testing download functionality
global.fetch = jest.fn()

describe('Crime Data Download (Mocked)', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  it('should handle download errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    const { downloadCrimeDataFile } = await import('../crime-parser')

    await expect(downloadCrimeDataFile()).rejects.toThrow('Crime data download failed')
  })

  it('should handle HTTP errors appropriately', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })

    const { downloadCrimeDataFile } = await import('../crime-parser')

    await expect(downloadCrimeDataFile()).rejects.toThrow('Failed to download crime data: 404 Not Found')
  })
})