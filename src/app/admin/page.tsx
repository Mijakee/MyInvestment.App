'use client'

import { useState } from 'react'

interface ImportResult {
  success: boolean
  data?: any
  error?: string
}

export default function AdminPage() {
  const [g01File, setG01File] = useState<File | null>(null)
  const [g02File, setG02File] = useState<File | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [validationResult, setValidationResult] = useState<ImportResult | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleValidate = async () => {
    if (!g01File) {
      alert('Please select a G01 file')
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const formData = new FormData()
      formData.append('g01', g01File)
      if (g02File) {
        formData.append('g02', g02File)
      }
      formData.append('type', 'validate')

      const response = await fetch('/api/data/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      setValidationResult(result)
    } catch (error) {
      setValidationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleImport = async () => {
    if (!g01File) {
      alert('Please select a G01 file')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('g01', g01File)
      if (g02File) {
        formData.append('g02', g02File)
      }
      formData.append('type', 'process')

      const response = await fetch('/api/data/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      setImportResult(result)
    } catch (error) {
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin - Census Data Import
        </h1>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            📋 How to Import Census Data
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>
              Download Census DataPacks from{' '}
              <a
                href="https://www.abs.gov.au/census/find-census-data/datapacks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                ABS website
              </a>
            </li>
            <li>Select the <strong>G01</strong> file (Selected Person Characteristics by Sex)</li>
            <li>Optionally select the <strong>G02</strong> file (Selected Medians and Averages)</li>
            <li>Click "Validate Files" to check the structure</li>
            <li>Click "Import Data" to process and import the data</li>
          </ol>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload Census Files</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* G01 File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                G01 - Selected Person Characteristics by Sex *
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setG01File(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-md file:border-0
                           file:text-sm file:font-semibold
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100"
              />
              {g01File && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {g01File.name} ({Math.round(g01File.size / 1024)}KB)
                </p>
              )}
            </div>

            {/* G02 File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                G02 - Selected Medians and Averages (Optional)
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setG02File(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-md file:border-0
                           file:text-sm file:font-semibold
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100"
              />
              {g02File && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {g02File.name} ({Math.round(g02File.size / 1024)}KB)
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleValidate}
              disabled={!g01File || isValidating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validating...
                </>
              ) : (
                'Validate Files'
              )}
            </button>

            <button
              onClick={handleImport}
              disabled={!g01File || isImporting || (validationResult && !validationResult.success)}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors flex items-center"
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </>
              ) : (
                'Import Data'
              )}
            </button>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className={`rounded-lg p-6 mb-8 ${
            validationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              validationResult.success ? 'text-green-900' : 'text-red-900'
            }`}>
              Validation Results
            </h3>

            {validationResult.success ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium text-gray-900 mb-2">G01 File</h4>
                  <p className="text-sm text-gray-600">
                    ✓ Valid structure with {validationResult.data?.g01?.rowCount} rows
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Headers: {validationResult.data?.g01?.headers?.slice(0, 5).join(', ')}...
                  </p>
                </div>

                {validationResult.data?.g02 && (
                  <div className="bg-white p-4 rounded border">
                    <h4 className="font-medium text-gray-900 mb-2">G02 File</h4>
                    <p className="text-sm text-gray-600">
                      {validationResult.data.g02.valid ? '✓' : '✗'} Structure check: {validationResult.data.g02.valid ? 'Valid' : 'Invalid'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Rows: {validationResult.data.g02.rowCount}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-800">{validationResult.error}</p>
            )}
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className={`rounded-lg p-6 ${
            importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              importResult.success ? 'text-green-900' : 'text-red-900'
            }`}>
              Import Results
            </h3>

            {importResult.success ? (
              <div>
                <p className="text-green-800 mb-4">
                  ✅ {importResult.data?.message}
                </p>
                <div className="bg-white p-4 rounded border">
                  <p><strong>Total suburbs processed:</strong> {importResult.data?.total}</p>
                  <p><strong>Sample suburbs imported:</strong> {importResult.data?.imported}</p>
                  {importResult.data?.sample && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Sample suburbs:</p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {importResult.data.sample.slice(0, 5).map((suburb: any, index: number) => (
                          <li key={index}>
                            {suburb.name} - Population: {suburb.population}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-red-800">{importResult.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}