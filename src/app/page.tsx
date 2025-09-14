export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Property Investment Analyzer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Make informed property investment decisions with comprehensive analysis of Australian suburbs using census data and crime statistics.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-secondary p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Census Analysis</h2>
            <p className="text-muted-foreground">
              Analyze demographic and economic data from Australian Census 2011, 2016, and 2021.
            </p>
          </div>

          <div className="bg-secondary p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Crime Statistics</h2>
            <p className="text-muted-foreground">
              Review crime data from 2007-2025 to understand safety trends in different suburbs.
            </p>
          </div>

          <div className="bg-secondary p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Investment Insights</h2>
            <p className="text-muted-foreground">
              Get comprehensive safety ratings and investment recommendations for suburbs.
            </p>
          </div>
        </div>

        <div className="text-center mt-12 space-y-4">
          <a
            href="/suburbs"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity mr-4"
          >
            Start Analysis
          </a>
          <a
            href="/admin"
            className="inline-block bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Import Real Data
          </a>
        </div>
      </div>
    </main>
  )
}