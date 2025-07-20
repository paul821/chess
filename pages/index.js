//pages/index.js
import Head from 'next/head';
import Hero from '../components/Hero';
import FeatureButton from '../components/FeatureButton';

export default function Home() {
  const features = [
    {
      title: 'Practice vs AI',
      description: 'Play against Stockfish with adjustable difficulty levels',
      href: '/practice',
      icon: '♟'
    },
    {
      title: 'Opening Explorer',
      description: 'Explore openings with statistics and interactive drilling',
      href: '/explorer',
      icon: '📖'
    },
    {
      title: 'Game Review',
      description: 'Analyze your games with detailed move-by-move feedback',
      href: '/review',
      icon: '🔍'
    },
    {
      title: 'Blunder Recall',
      description: 'Practice your biggest mistakes with flashcard-style puzzles',
      href: '/blunder',
      icon: '⚡'
    },
    {
      title: 'Endgame Trainer',
      description: 'Master complex endgames from your actual games',
      href: '/endgame',
      icon: '👑'
    },
    {
      title: 'Style Analyzer',
      description: 'Deep analysis of your playing style and patterns',
      href: '/style',
      icon: '📊'
    }
  ];

  return (
    <>
      <Head>
        <title>Chess Trainer - Chess, not checkers.</title>
        <meta name="description" content="Professional chess training platform with AI practice, opening explorer, and comprehensive game analysis tools." />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <Hero />

        {/* Features Grid */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <FeatureButton
                  key={index}
                  title={feature.title}
                  description={feature.description}
                  href={feature.href}
                  icon={feature.icon}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <footer className="border-t border-gray-200 py-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Built for Chess Excellence</h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Our platform combines the power of Stockfish engine analysis with modern web technology 
              to provide comprehensive chess training tools. Whether you're a beginner or master, 
              improve your game with data-driven insights.
            </p>
            
            <div className="flex justify-center items-center space-x-8 text-sm text-gray-500">
              <span>Powered by Stockfish</span>
              <span>•</span>
              <span>Lichess Opening Database</span>
              <span>•</span>
              <span>Modern Web Technologies</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}