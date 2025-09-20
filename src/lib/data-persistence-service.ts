/**
 * Data Persistence Service
 * Provides caching and database functionality to store last known values
 * Prevents fallback to mock data by persisting real API responses
 */

import * as fs from 'fs'
import * as path from 'path'

export interface CachedData<T> {
  data: T
  timestamp: number
  source: 'api' | 'file' | 'service'
  expiresAt?: number
}

export interface DataPersistenceConfig {
  cacheDirectory: string
  defaultTTL: number // Time to live in milliseconds
  enableFileSystem: boolean
}

class DataPersistenceService {
  private config: DataPersistenceConfig
  private memoryCache = new Map<string, CachedData<any>>()

  constructor(config?: Partial<DataPersistenceConfig>) {
    this.config = {
      cacheDirectory: path.join(process.cwd(), 'src', 'data', 'cache'),
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      enableFileSystem: true,
      ...config
    }

    // Ensure cache directory exists
    if (this.config.enableFileSystem) {
      this.ensureCacheDirectory()
    }
  }

  /**
   * Store data with automatic persistence
   */
  async setData<T>(
    key: string,
    data: T,
    source: 'api' | 'file' | 'service' = 'api',
    ttl?: number
  ): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl : Date.now() + this.config.defaultTTL

    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
      source,
      expiresAt
    }

    // Store in memory
    this.memoryCache.set(key, cachedData)

    // Persist to filesystem
    if (this.config.enableFileSystem) {
      await this.persistToFile(key, cachedData)
    }
  }

  /**
   * Retrieve data with fallback chain: memory -> file -> null
   */
  async getData<T>(key: string): Promise<T | null> {
    // 1. Check memory cache first
    const memoryCached = this.memoryCache.get(key)
    if (memoryCached && this.isValid(memoryCached)) {
      console.log(`Cache hit (memory): ${key}`)
      return memoryCached.data as T
    }

    // 2. Check file cache
    if (this.config.enableFileSystem) {
      const fileCached = await this.loadFromFile<T>(key)
      if (fileCached && this.isValid(fileCached)) {
        console.log(`Cache hit (file): ${key}`)
        // Restore to memory cache
        this.memoryCache.set(key, fileCached)
        return fileCached.data
      }
    }

    console.log(`Cache miss: ${key}`)
    return null
  }

  /**
   * Store transport stops to prevent fallback to mock data
   */
  async cacheTransportStops(
    latitude: number,
    longitude: number,
    radius: number,
    stops: any[]
  ): Promise<void> {
    const key = `transport_${latitude}_${longitude}_${radius}`
    await this.setData(key, stops, 'api', 7 * 24 * 60 * 60 * 1000) // 7 days
  }

  /**
   * Get cached transport stops
   */
  async getCachedTransportStops(
    latitude: number,
    longitude: number,
    radius: number
  ): Promise<any[] | null> {
    const key = `transport_${latitude}_${longitude}_${radius}`
    return await this.getData<any[]>(key)
  }

  /**
   * Store crime data to prevent fallback to synthetic data
   */
  async cacheCrimeData(district: string, crimeData: any): Promise<void> {
    const key = `crime_${district}`
    await this.setData(key, crimeData, 'api', 30 * 24 * 60 * 60 * 1000) // 30 days
  }

  /**
   * Get cached crime data
   */
  async getCachedCrimeData(district: string): Promise<any | null> {
    const key = `crime_${district}`
    return await this.getData(key)
  }

  /**
   * Store school data
   */
  async cacheSchoolData(latitude: number, longitude: number, schoolData: any): Promise<void> {
    const key = `schools_${latitude}_${longitude}`
    await this.setData(key, schoolData, 'api', 7 * 24 * 60 * 60 * 1000) // 7 days
  }

  /**
   * Get cached school data
   */
  async getCachedSchoolData(latitude: number, longitude: number): Promise<any | null> {
    const key = `schools_${latitude}_${longitude}`
    return await this.getData(key)
  }

  /**
   * Clear expired entries from cache
   */
  async cleanupExpired(): Promise<void> {
    const now = Date.now()

    // Clean memory cache
    for (const [key, value] of this.memoryCache.entries()) {
      if (!this.isValid(value)) {
        this.memoryCache.delete(key)
      }
    }

    // Clean file cache
    if (this.config.enableFileSystem) {
      const cacheDir = this.config.cacheDirectory
      if (fs.existsSync(cacheDir)) {
        const files = fs.readdirSync(cacheDir)
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(cacheDir, file)
            try {
              const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
              if (!this.isValid(content)) {
                fs.unlinkSync(filePath)
                console.log(`Cleaned expired cache file: ${file}`)
              }
            } catch (error) {
              // Remove corrupted cache files
              fs.unlinkSync(filePath)
              console.log(`Removed corrupted cache file: ${file}`)
            }
          }
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    memoryEntries: number
    fileEntries: number
    totalSize: string
  } {
    const memoryEntries = this.memoryCache.size
    let fileEntries = 0
    let totalSize = 0

    if (this.config.enableFileSystem && fs.existsSync(this.config.cacheDirectory)) {
      const files = fs.readdirSync(this.config.cacheDirectory)
      fileEntries = files.filter(f => f.endsWith('.json')).length

      files.forEach(file => {
        const filePath = path.join(this.config.cacheDirectory, file)
        try {
          const stats = fs.statSync(filePath)
          totalSize += stats.size
        } catch (error) {
          // Ignore errors for individual files
        }
      })
    }

    return {
      memoryEntries,
      fileEntries,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    }
  }

  /**
   * Clear all cache data
   */
  async clearAll(): Promise<void> {
    // Clear memory
    this.memoryCache.clear()

    // Clear files
    if (this.config.enableFileSystem && fs.existsSync(this.config.cacheDirectory)) {
      const files = fs.readdirSync(this.config.cacheDirectory)
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.config.cacheDirectory, file))
        }
      }
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isValid(cachedData: CachedData<any>): boolean {
    const now = Date.now()
    return !cachedData.expiresAt || cachedData.expiresAt > now
  }

  /**
   * Persist data to file system
   */
  private async persistToFile(key: string, data: CachedData<any>): Promise<void> {
    try {
      const fileName = `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`
      const filePath = path.join(this.config.cacheDirectory, fileName)

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (error) {
      console.warn(`Failed to persist cache data for key ${key}:`, error)
    }
  }

  /**
   * Load data from file system
   */
  private async loadFromFile<T>(key: string): Promise<CachedData<T> | null> {
    try {
      const fileName = `${key.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`
      const filePath = path.join(this.config.cacheDirectory, fileName)

      if (!fs.existsSync(filePath)) {
        return null
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(content) as CachedData<T>
    } catch (error) {
      console.warn(`Failed to load cache data for key ${key}:`, error)
      return null
    }
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.config.cacheDirectory)) {
      fs.mkdirSync(this.config.cacheDirectory, { recursive: true })
      console.log(`Created cache directory: ${this.config.cacheDirectory}`)
    }
  }
}

// Export singleton instance
export const dataPersistenceService = new DataPersistenceService()
export default dataPersistenceService