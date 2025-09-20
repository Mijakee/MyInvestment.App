import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10"></div>
        <div className="relative container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-6">
                <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V9a5 5 0 0110 0v8m0 0v4m0-4h4m0 0V9a5 5 0 0110 0v8m-10 0h10m-9-4h8m-8-8V5a2 2 0 012-2h4a2 2 0 012 2v1" />
                </svg>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6">
                Smart Property
                <span className="text-primary block">Investment Analysis</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Discover the perfect Australian suburb for your next property investment with comprehensive analysis of
                <span className="text-primary font-semibold"> 1,701 WA suburbs</span> using real government data
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/suburbs"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Explore 1,701 Suburbs →
              </Link>
              <Link
                href="/heatmap"
                className="bg-success hover:bg-success/90 text-success-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Interactive Heat Map
              </Link>
              <Link
                href="/how-it-works"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">1,701</div>
              <div className="text-muted-foreground">WA Suburbs</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-success mb-2">99.9%</div>
              <div className="text-muted-foreground">Data Coverage</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-primary mb-2">15</div>
              <div className="text-muted-foreground">Police Districts</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-3xl font-bold text-success mb-2">Real-Time</div>
              <div className="text-muted-foreground">Analysis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Powered by Real Government Data
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our analysis combines multiple authentic data sources to give you the most comprehensive suburb insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">ABS Census Data</h3>
              <p className="text-muted-foreground mb-4">
                Comprehensive demographic and economic analysis from the 2021 Australian Census, including income, age, education, and employment data.
              </p>
              <div className="text-sm text-primary font-medium">
                Source: Australian Bureau of Statistics
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border">
              <div className="w-12 h-12 bg-danger/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Crime Statistics</h3>
              <p className="text-muted-foreground mb-4">
                Official crime data from WA Police Force covering 15 districts with detailed offense categories and historical trends from 2007-2024.
              </p>
              <div className="text-sm text-danger font-medium">
                Source: WA Police Force
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-border">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Smart Safety Rating</h3>
              <p className="text-muted-foreground mb-4">
                Multi-factor algorithm combining crime data (50%), demographics (25%), neighborhood analysis (15%), and trends (10%) for accurate ratings.
              </p>
              <div className="text-sm text-success font-medium">
                90%+ Confidence Ratings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Ready to Find Your Perfect Investment Property?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of investors using data-driven insights to make smarter property decisions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/suburbs"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Your Analysis
              </Link>
              <Link
                href="/heatmap"
                className="bg-success hover:bg-success/90 text-success-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Interactive Heat Map
              </Link>
              <Link
                href="/how-it-works"
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}