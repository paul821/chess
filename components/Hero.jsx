//components/Hero.jsx
export default function Hero() {
    return (
      <section className="relative min-h-screen flex items-center justify-center bg-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
  
        {/* Main Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* Chess piece icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 border-black">
              <span className="text-4xl">♔</span>
            </div>
          </div>
  
          {/* Main heading */}
          <h1 className="text-6xl md:text-8xl font-bold text-black mb-6 tracking-tight">
            Chess, not checkers.
          </h1>
  
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Master the royal game with AI-powered analysis, opening exploration, 
            and personalized training tailored to your playing style.
          </p>
  
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/practice"
              className="btn-primary text-lg px-8 py-4 inline-flex items-center justify-center"
            >
              Start Training
              <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
            <a
              href="/explorer"
              className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
            >
              Explore Openings
            </a>
          </div>
  
          {/* Feature highlights */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mx-auto mb-4 text-xl">
                ⚡
              </div>
              <h3 className="font-semibold text-lg mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-600">
                Get instant feedback on your moves with Stockfish engine analysis and detailed explanations.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mx-auto mb-4 text-xl">
                📚
              </div>
              <h3 className="font-semibold text-lg mb-2">Opening Mastery</h3>
              <p className="text-gray-600">
                Learn openings with interactive drilling, statistics, and strategic insights from the masters.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mx-auto mb-4 text-xl">
                📊
              </div>
              <h3 className="font-semibold text-lg mb-2">Style Analysis</h3>
              <p className="text-gray-600">
                Understand your playing patterns and receive personalized training recommendations.
              </p>
            </div>
          </div>
        </div>
  
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>
    );
  }