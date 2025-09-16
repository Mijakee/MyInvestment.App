'use client'

import { useState } from 'react'
import Link from 'next/link'

const classificationData = [
  {
    type: 'Urban',
    criteria: 'Perth Metro (lat -32.5° to -31.4°) + Area <10 km²',
    description: 'Dense city areas, CBD, inner suburbs',
    examples: 'Perth CBD, Northbridge, East Perth',
    color: 'bg-blue-100 text-blue-700',
    safety: 7.0
  },
  {
    type: 'Suburban',
    criteria: 'Perth Metro (lat -32.5° to -31.4°) + Area ≥10 km²',
    description: 'Family residential areas, outer suburbs',
    examples: 'Joondalup, Rockingham, Wanneroo',
    color: 'bg-green-100 text-green-700',
    safety: 8.5
  },
  {
    type: 'Coastal',
    criteria: 'Name contains: beach, bay, island, harbour',
    description: 'Tourism, fishing, coastal lifestyle',
    examples: 'Cottesloe, Mandurah, Rottnest Island',
    color: 'bg-cyan-100 text-cyan-700',
    safety: 8.0
  },
  {
    type: 'Regional Town',
    criteria: 'Mid-sized towns, service centers',
    description: 'Commercial hubs for surrounding areas',
    examples: 'Albany, Bunbury, Geraldton',
    color: 'bg-purple-100 text-purple-700',
    safety: 7.5
  },
  {
    type: 'Rural',
    criteria: 'Large area >1000 km²',
    description: 'Agriculture, farming communities',
    examples: 'Narrogin, Katanning, Merredin',
    color: 'bg-yellow-100 text-yellow-700',
    safety: 8.0
  },
  {
    type: 'Remote',
    criteria: 'Far North WA (latitude <-26°)',
    description: 'Isolated areas, low population density',
    examples: 'Broome, Derby, Kununurra',
    color: 'bg-orange-100 text-orange-700',
    safety: 6.5
  },
  {
    type: 'Mining',
    criteria: 'Name contains: mine, mining, goldfield',
    description: 'Resource extraction, FIFO workforce',
    examples: 'Kalgoorlie, Newman, Tom Price',
    color: 'bg-red-100 text-red-700',
    safety: 6.0
  }
]

const safetyComponents = [
  {
    name: 'Crime Rating',
    weight: '50%',
    description: 'Crime rate per 1,000 population with violence weighting',
    calculation: 'WA baseline: 30-50 crimes/1000 = average (5-7/10)',
    factors: ['Total crime rate', 'Violent crime percentage', 'Crime severity weighting']
  },
  {
    name: 'Demographic Rating',
    weight: '25%',
    description: 'Socioeconomic indicators and stability factors',
    calculation: 'Income + Age + Education + Employment + Housing',
    factors: ['Median household income', 'Age stability (35-55)', 'Education levels', 'Unemployment rate', 'Housing stability']
  },
  {
    name: 'Neighborhood Rating',
    weight: '15%',
    description: 'Influence from surrounding suburbs within 20km',
    calculation: '70% neighbor average + 30% own characteristics',
    factors: ['Economic base of neighbors', 'Classification of neighbors', 'Distance weighting', 'Geographic analysis']
  },
  {
    name: 'Trend Rating',
    weight: '10%',
    description: 'Historical crime trend analysis',
    calculation: 'Decreasing=8.5, Stable=7.0, Increasing=4.5',
    factors: ['Crime trend direction', 'Historical data analysis', 'Recent changes', 'Improvement trajectory']
  }
]

const DemoChart = ({ title, data, color = 'blue' }) => {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-24 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1 mx-3">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`bg-${color}-500 h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="w-16 text-sm font-medium text-gray-800">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const TrendChart = () => {
  const trendData = [
    { year: '2020', crime: 42, color: 'red' },
    { year: '2021', crime: 38, color: 'orange' },
    { year: '2022', crime: 35, color: 'yellow' },
    { year: '2023', crime: 32, color: 'green' },
    { year: '2024', crime: 29, color: 'green' }
  ]

  const maxCrime = Math.max(...trendData.map(d => d.crime))

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-4">Sample Crime Trend Analysis</h4>
      <div className="flex items-end space-x-4 h-32">
        {trendData.map((data, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`w-8 bg-${data.color}-400 rounded-t transition-all duration-700`}
              style={{ height: `${(data.crime / maxCrime) * 100}%` }}
            ></div>
            <div className="text-xs text-gray-600 mt-2">{data.year}</div>
            <div className="text-xs font-medium text-gray-800">{data.crime}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded"></div>
          <span className="text-sm text-gray-600">Decreasing Trend (+8.5/10 rating)</span>
        </div>
      </div>
    </div>
  )
}

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState('classifications')

  const demoGraphics = [
    { label: 'Bachelor+', value: 45 },
    { label: 'High School', value: 35 },
    { label: 'Trade Cert', value: 15 },
    { label: 'Other', value: 5 }
  ]

  const economicData = [
    { label: 'Median Income', value: 85000 },
    { label: 'Unemployment', value: 3.2 },
    { label: 'Couples %', value: 68 },
    { label: 'Houses %', value: 78 }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80 mb-4 transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            How Our Safety Ratings Work
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Understanding the science behind suburb classifications, safety calculations, and investment insights
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'classifications', label: 'Classifications', icon: '🏘️' },
            { id: 'safety-algorithm', label: 'Safety Algorithm', icon: '🔢' },
            { id: 'data-sources', label: 'Data Sources', icon: '📊' },
            { id: 'visualizations', label: 'Charts & Trends', icon: '📈' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* Classifications Tab */}
          {activeTab === 'classifications' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Suburb Classification System</h2>
              <p className="text-gray-600 mb-8">
                Our automated algorithm classifies all 1,701 WA suburbs using geographic location, area size, and name patterns.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {classificationData.map((classification, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">{classification.type}</h3>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${classification.color}`}>
                          {classification.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {classification.safety}/10 avg
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Criteria:</span>
                        <p className="text-sm text-gray-600 font-mono">{classification.criteria}</p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">Description:</span>
                        <p className="text-sm text-gray-600">{classification.description}</p>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">Examples:</span>
                        <p className="text-sm text-gray-600">{classification.examples}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-800 mb-2">Classification Priority Order</h4>
                <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
                  <li><strong>Perth Metro</strong> → Urban/Suburban (by area)</li>
                  <li><strong>Name Mining</strong> → Mining</li>
                  <li><strong>Name Coastal</strong> → Coastal</li>
                  <li><strong>Far North</strong> → Remote</li>
                  <li><strong>Large Area</strong> → Rural</li>
                  <li><strong>Default</strong> → Regional Town</li>
                </ol>
              </div>
            </div>
          )}

          {/* Safety Algorithm Tab */}
          {activeTab === 'safety-algorithm' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Multi-Factor Safety Algorithm</h2>
              <p className="text-gray-600 mb-8">
                Our comprehensive safety rating combines four key components, weighted by their impact on property investment safety.
              </p>

              <div className="space-y-6">
                {safetyComponents.map((component, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">{component.name}</h3>
                      <div className="flex items-center space-x-4">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                          {component.weight}
                        </span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-primary rounded-full"
                            style={{ width: component.weight }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{component.description}</p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <span className="text-sm font-medium text-gray-700">Calculation Method:</span>
                      <p className="text-sm text-gray-600 font-mono mt-1">{component.calculation}</p>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Key Factors:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {component.factors.map((factor, factorIndex) => (
                          <span key={factorIndex} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-orange-50 border border-orange-200 rounded-xl p-6">
                <h4 className="font-semibold text-orange-800 mb-3">Crime Data Allocation Methodology</h4>
                <p className="text-sm text-orange-700 mb-4">
                  Since WA Police data is provided by district (not individual suburbs), we use sophisticated mapping to allocate crime statistics:
                </p>
                <div className="space-y-3 text-sm">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <strong className="text-orange-800">1. Primary Mapping:</strong>
                    <p className="text-orange-700">Use existing police_district field from suburb data when available</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <strong className="text-orange-800">2. Geographic Estimation:</strong>
                    <p className="text-orange-700">Coordinate-based assignment using latitude/longitude boundaries:</p>
                    <ul className="list-disc list-inside mt-1 text-orange-600">
                      <li>Perth Metro: lat -32.5° to -31.4°, lng 115.5° to 116.2°</li>
                      <li>Regional mapping: lat/lng ranges for 15 districts</li>
                      <li>Name pattern matching (e.g., "fremantle" → Fremantle District)</li>
                    </ul>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <strong className="text-orange-800">3. District Crime Profiles:</strong>
                    <p className="text-orange-700">Each district has characteristic crime rates based on real WA Police data patterns</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
                <h4 className="font-semibold text-green-800 mb-3">Final Calculation Formula</h4>
                <div className="font-mono text-sm text-green-700 bg-green-100 p-4 rounded-lg">
                  Overall Rating = (Crime × 0.50) + (Demographics × 0.25) + (Neighborhood × 0.15) + (Trends × 0.10)
                </div>
                <p className="text-sm text-green-600 mt-2">
                  Result is normalized to a 1-10 scale where 10 represents the safest investment environment.
                </p>
              </div>
            </div>
          )}

          {/* Data Sources Tab */}
          {activeTab === 'data-sources' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Authentic Government Data Sources</h2>
              <p className="text-gray-600 mb-8">
                We use only official government data sources to ensure accuracy and reliability of our safety ratings.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">ABS Census Data</h3>
                      <p className="text-sm text-blue-600">Australian Bureau of Statistics</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Coverage:</span>
                      <p className="text-sm text-gray-600">2021 Australian Census - complete demographic data</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Includes:</span>
                      <p className="text-sm text-gray-600">Income, education, employment, age, household composition</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Mapping:</span>
                      <p className="text-sm text-gray-600">99.9% SA2 coverage for accurate geographic boundaries</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">WA Police Force Data</h3>
                      <p className="text-sm text-red-600">Official Crime Statistics</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Coverage:</span>
                      <p className="text-sm text-gray-600">2007-2025 comprehensive crime statistics by police district</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Allocation Method:</span>
                      <p className="text-sm text-gray-600">District-to-suburb mapping using geographic coordinates and name patterns</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Districts:</span>
                      <p className="text-sm text-gray-600">15 WA Police Districts mapped to 1,701 suburbs via spatial analysis</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Data Processing:</span>
                      <p className="text-sm text-gray-600">40+ offense categories with severity weighting and historical trends</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Geographic Boundaries</h3>
                      <p className="text-sm text-green-600">ABS Statistical Areas</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Source:</span>
                      <p className="text-sm text-gray-600">Official ABS SAL (Suburb and Locality) boundaries 2021</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Accuracy:</span>
                      <p className="text-sm text-gray-600">Precise coordinate calculations with proper CRS transformation</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Analysis:</span>
                      <p className="text-sm text-gray-600">Neighborhood influence using Turf.js spatial analysis</p>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Real-Time Processing</h3>
                      <p className="text-sm text-purple-600">Live Calculations</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Performance:</span>
                      <p className="text-sm text-gray-600">Sub-50ms API response times with high confidence</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Coverage:</span>
                      <p className="text-sm text-gray-600">All 1,701 WA suburbs with state-wide analysis</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Confidence:</span>
                      <p className="text-sm text-gray-600">90%+ confidence ratings based on data completeness</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visualizations Tab */}
          {activeTab === 'visualizations' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Visualizations & Trends</h2>
              <p className="text-gray-600 mb-8">
                Interactive charts and graphs help you understand the data behind each suburb's safety rating.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <DemoChart
                  title="Education Levels (Sample Suburb)"
                  data={demoGraphics}
                  color="blue"
                />

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Economic Indicators</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {economicData.map((item, index) => (
                      <div key={index} className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {item.label.includes('Income') ? `$${item.value.toLocaleString()}` :
                           item.label.includes('Unemployment') ? `${item.value}%` :
                           `${item.value}%`}
                        </div>
                        <div className="text-sm text-green-600">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <TrendChart />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">1,701</div>
                  <div className="text-gray-600">Total WA Suburbs</div>
                  <div className="text-sm text-gray-500 mt-1">Complete coverage</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
                  <div className="text-gray-600">Data Accuracy</div>
                  <div className="text-sm text-gray-500 mt-1">SA2 mapping success</div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">&lt;50ms</div>
                  <div className="text-gray-600">Response Time</div>
                  <div className="text-sm text-gray-500 mt-1">Real-time calculations</div>
                </div>
              </div>

              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h4 className="font-semibold text-yellow-800 mb-2">Understanding Chart Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong className="text-yellow-800">Bar Charts:</strong>
                    <p className="text-yellow-700">Compare demographic percentages, education levels, employment rates</p>
                  </div>
                  <div>
                    <strong className="text-yellow-800">Trend Lines:</strong>
                    <p className="text-yellow-700">Historical crime data, showing improvement or deterioration over time</p>
                  </div>
                  <div>
                    <strong className="text-yellow-800">Heatmaps:</strong>
                    <p className="text-yellow-700">Geographic visualization of safety ratings across different areas</p>
                  </div>
                  <div>
                    <strong className="text-yellow-800">Scatter Plots:</strong>
                    <p className="text-yellow-700">Correlation between factors like income and safety ratings</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-primary/5 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Explore Suburbs?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Use our comprehensive data and analysis to make informed property investment decisions across all 1,701 WA suburbs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/suburbs"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Browse All Suburbs →
              </Link>
              <Link
                href="/demo"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 rounded-xl font-semibold transition-all duration-300"
              >
                Try Interactive Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}