import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Chess from 'chess.js';
import { loadStockfish } from '../lib/stockfish';

// Dynamically load Chessboard.js
const loadChessboard = async () => {
  if (typeof window !== 'undefined' && !window.Chessboard) {
    await import('chessboardjs');
  }
};

export default function EndgameTrainer() {
  const [pgnText, setPgnText] = useState('');
  const [fen, setFen] = useState('start');
  const [legalMoves, setLegalMoves] = useState([]);
  const [analysis, setAnalysis] = useState([]); // { san, uci, evaluation }
  const [loading, setLoading] = useState(false);

  const engineRef = useRef(null);
  const boardRef = useRef(null);
  const boardObj = useRef(null);

  // Initialize engine
  useEffect(() => {
    loadStockfish().then((engine) => {
      engineRef.current = engine;
      engine.postMessage('uci');
      engine.postMessage('isready');
    });
  }, []);

  // Initialize board
  useEffect(() => {
    loadChessboard().then(() => {
      boardObj.current = window.Chessboard(boardRef.current, {
        position: fen,
        draggable: false,
      });
    });
  }, []);

  // Update board when fen changes
  useEffect(() => {
    if (boardObj.current) {
      boardObj.current.position(fen);
    }
  }, [fen]);

  // Analyze final position
  const handleAnalyze = async () => {
    const chess = new Chess();
    if (!chess.load_pgn(pgnText)) {
      alert('Invalid PGN');
      return;
    }
    setLoading(true);
    chess.reset();
    const history = chess.history({ verbose: true });
    // Play all moves
    history.forEach((mv) => chess.move(mv));
    const finalFen = chess.fen();
    setFen(finalFen);

    // Get legal moves at endgame
    const moves = chess.moves({ verbose: true });
    setLegalMoves(moves);

    // Evaluate each legal move
    const results = [];
    for (let m of moves) {
      const fenBefore = finalFen;
      // position after move
      chess.reset(); chess.load(finalFen);
      chess.move(m);
      const fenAfter = chess.fen();

      // Evaluate fenAfter
      const evalCp = await evaluateFen(fenAfter);
      results.push({ san: m.san, uci: m.from + m.to, evaluation: evalCp });
    }
    setAnalysis(results);
    setLoading(false);
  };

  // Evaluate a FEN: returns centipawn score from engine's perspective (positive means advantage for side to move?)
  const evaluateFen = (fen) => {
    return new Promise((resolve) => {
      let lastCp = 0;
      const engine = engineRef.current;
      function onMessage(event) {
        const line = typeof event.data === 'string' ? event.data : '';
        if (line.startsWith('info') && line.includes(' score cp ')) {
          lastCp = parseInt(line.split(' score cp ')[1].split(' ')[0], 10);
        }
        if (line.startsWith('bestmove')) {
          engine.removeEventListener('message', onMessage);
          resolve(lastCp);
        }
      }
      engine.addEventListener('message', onMessage);
      engine.postMessage('position fen ' + fen);
      engine.postMessage('go depth 15');
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Endgame Trainer</h1>
        <textarea
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="Paste PGN of a complete game here"
          className="w-full h-32 p-2 mb-4 text-black rounded"
        />
        <button
          onClick={handleAnalyze}
          className="px-6 py-2 bg-white text-black rounded hover:opacity-90"
        >
          Analyze Endgame Position
        </button>

        {loading && <p className="mt-4">Analyzing endgame moves, please wait...</p>}

        {!loading && analysis.length > 0 && (
          <div className="mt-6 flex flex-col md:flex-row">
            <div className="w-full md:w-2/3">
              <div id="board" ref={boardRef} style={{ width: '100%', maxWidth: '600px' }} />
            </div>
            <div className="w-full md:w-1/3 mt-4 md:mt-0 md:ml-6 overflow-y-auto" style={{ maxHeight: '80vh' }}>
              <h2 className="text-xl font-bold mb-2">Legal Moves & Evaluations</h2>
              <ul className="space-y-2">
                {analysis.map((a, idx) => (
                  <li key={idx} className="p-2 bg-gray-800 rounded flex justify-between">
                    <span>{a.san}</span>
                    <span>{a.evaluation} cp</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}