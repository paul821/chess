import React, { useContext, useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { AuthContext } from './_app';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Chess from 'chess.js';
import { loadStockfish } from '../lib/stockfish';
import { detectMotifs } from '../lib/motifs';

export default function StyleAnalyzer() {
  const { user } = useContext(AuthContext);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const analyzeGames = async () => {
      setLoading(true);
      // Load user games from Firestore
      const gamesCol = collection(db, 'users', user.uid, 'games');
      const snapshot = await getDocs(gamesCol);
      const games = snapshot.docs.map(doc => doc.data());

      // Initialize engine for evaluations
      const engine = await loadStockfish();
      engine.postMessage('uci');
      engine.postMessage('isready');

      // Helper: evaluate fen
      const evalFen = (fen) => new Promise(resolve => {
        let lastCp = 0;
        const onMsg = (e) => {
          const line = typeof e.data === 'string' ? e.data : '';
          if (line.startsWith('info') && line.includes(' score cp ')) {
            lastCp = parseInt(line.split(' score cp ')[1].split(' ')[0], 10);
          }
          if (line.startsWith('bestmove')) {
            engine.removeEventListener('message', onMsg);
            resolve(lastCp);
          }
        };
        engine.addEventListener('message', onMsg);
        engine.postMessage('position fen ' + fen);
        engine.postMessage('go depth 12');
      });

      // Aggregators
      let totalCentipawnLoss = 0;
      let totalMoves = 0;
      let tacticalCount = 0;
      let blunderList = new Map();
      const motifCounts = new Map();
      const timeControlStats = {};
      const phaseStats = { opening: [], middlegame: [], endgame: [] };

      // Analyze each game
      for (let gameData of games) {
        const { pgn, timeControl } = gameData;
        // Time control breakdown
        timeControlStats[timeControl] = (timeControlStats[timeControl] || 0) + 1;

        const chess = new Chess();
        chess.load_pgn(pgn);
        const history = chess.history({ verbose: true });
        chess.reset();

        for (let i = 0; i < history.length; i++) {
          const mv = history[i];
          const fenBefore = chess.fen();
          // Engine evaluation before move
          const cpBefore = await evalFen(fenBefore);
          chess.move(mv);
          const fenAfter = chess.fen();
          const cpAfter = await evalFen(fenAfter);
          const loss = Math.abs(cpBefore - cpAfter);

          // Motif detection
          const motifs = detectMotifs(chess, mv, fenBefore);
          motifs.forEach(motif => {
            motifCounts.set(motif, (motifCounts.get(motif) || 0) + 1);
          });

          totalCentipawnLoss += loss;
          totalMoves++;

          // Count tactical swings > 200 cp
          if (Math.abs(cpAfter - cpBefore) >= 200) tacticalCount++;

          // Record blunder moves > 150 cp
          if (loss >= 150) {
            const key = mv.san;
            blunderList.set(key, (blunderList.get(key) || 0) + 1);
          }

          // Phase classification
          const phase = i < 10 ? 'opening' : i < history.length - 10 ? 'middlegame' : 'endgame';
          phaseStats[phase].push(loss);
        }
      }

      // Compute metrics
      const avgLoss = (totalCentipawnLoss / totalMoves).toFixed(1);
      const tacticalPct = ((tacticalCount / totalMoves) * 100).toFixed(1);
      // Top 5 blunders
      const commonBlunders = [...blunderList.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([san, count]) => `${san} (${count} times)`);

      // Most frequent motifs
      const motifArr = Array.from(motifCounts.entries());
      motifArr.sort((a, b) => b[1] - a[1]);
      const topMotifs = motifArr.slice(0, 5);

      // Time control distribution
      const timeDist = Object.entries(timeControlStats).map(([tc, cnt]) => `${tc}: ${cnt} games`);

      // Phase performance
      const phasePerf = {
        opening: (phaseStats.opening.reduce((a, b) => a + b, 0) / phaseStats.opening.length).toFixed(1),
        middlegame: (phaseStats.middlegame.reduce((a, b) => a + b, 0) / phaseStats.middlegame.length).toFixed(1),
        endgame: (phaseStats.endgame.reduce((a, b) => a + b, 0) / phaseStats.endgame.length).toFixed(1),
      };

      // Suggest openings by style
      const suggestions = [];
      if (tacticalPct > 20) suggestions.push('King\'s Gambit', 'Sicilian Defense');
      else suggestions.push('Ruy Lopez', 'Queen\'s Gambit Declined');

      setReport({
        avgLoss,
        tacticalPct,
        commonBlunders,
        timeDist,
        phasePerf,
        suggestions,
        topMotifs
      });
      setLoading(false);
    };

    analyzeGames();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Please sign in to view your Style Analysis.</p>
      </div>
    );
  }
  if (loading || !report) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Generating style report...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 space-y-8">
      <Navbar />
      <h1 className="text-3xl font-bold">Style Analyzer Report</h1>

      <section>
        <h2 className="text-2xl font-semibold">Aggression vs. Passivity</h2>
        <p>Average centipawn loss per move: {report.avgLoss} cp (lower is more precise).</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Tactical vs. Positional</h2>
        <p>{report.tacticalPct}% of moves involved tactical swings (≥200 cp).</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Common Blunders</h2>
        <ul className="list-disc list-inside">
          {report.commonBlunders.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Time Control Performance</h2>
        <ul className="list-inside list-disc">
          {report.timeDist.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Performance by Phase</h2>
        <p>Opening avg loss: {report.phasePerf.opening} cp</p>
        <p>Middlegame avg loss: {report.phasePerf.middlegame} cp</p>
        <p>Endgame avg loss: {report.phasePerf.endgame} cp</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Suggested Openings</h2>
        <ul className="list-disc list-inside">
          {report.suggestions.map((o, i) => <li key={i}>{o}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Most Frequent Motifs</h2>
        <ul className="list-disc list-inside">
          {report.topMotifs.map(([motif, count], i) => (
            <li key={i}>{motif}: {count} times</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
