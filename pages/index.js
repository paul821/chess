import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeatureButton from '../components/FeatureButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <Hero />
      <main className="flex-grow flex flex-col items-center pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureButton href="/practice">Practice vs AI</FeatureButton>
          <FeatureButton href="/explorer">Opening Explorer</FeatureButton>
          <FeatureButton href="/review">Game Review</FeatureButton>
          <FeatureButton href="/blunder">Blunder Recall</FeatureButton>
          <FeatureButton href="/endgame">Endgame Trainer</FeatureButton>
          <FeatureButton href="/style">Style Analyzer</FeatureButton>
        </div>
      </main>
    </div>
  );
}