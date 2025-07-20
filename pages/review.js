import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Chess from 'chess.js';
import { loadStockfish } from '../lib/stockfish';

// Dynamically import Chessboard.js
const loadChessboard = async () => {
  if (typeof window !== 'undefined' && !window.Chessboard) {
    await import('chessboardjs');
  }
};

export default function Review() {
  const [pgnText, setPgnText] = useState('');
  const [movesData, setMovesData] = useState([]); // [{ san, fenBefore, fenAfter, bestMove, evaluation, explanation }]
  const [loading, setLoading] = useState(false);
  const engineRef = useRef(null);
  const chessRef = useRef(new Chess());
  const boardRef = useRef(null);
  const boardObj = useRef(null);

  // Initialize Stockfish engine
  useEffect(() => {
    loadStockfish().then((engine) => {
      engineRef.current = engine(); // stockfish() returns a Worker
      engineRef.current.postMessage('uci');
      engineRef.current.postMessage('isready');
    });
  }, []);

  // Initialize board
  useEffect(() => {
    loadChessboard().then(() => {
      boardObj.current = window.Chessboard(boardRef.current, {
        position: 'start',
        draggable: false,
      });
    });
  }, []);

  // Analyze PGN
  const handleAnalyze = async () => {
    const chess = new Chess();
    if (!chess.load_pgn(pgnText)) {
      alert('Invalid PGN');
      return;
    }
    const history = chess.history({ verbose: true });
    chess.reset();
    setMovesData([]);
    setLoading(true);

    for (let i = 0; i < history.length; i++) {
      const move = history[i];
      const fenBefore = chess.fen();
      // Query engine
      const { bestMove, evaluation } = await new Promise((resolve) => {
        let lastCp = 0;
        const onMessage = (event) => {
          const line = event.data;
          if (line.startsWith('info') && line.includes(' score cp ')) {
            const cpParts = line.split(' score cp ')[1].split(' ')[0];
            lastCp = parseInt(cpParts, 10);
          }
          if (line.startsWith('bestmove')) {
            const best = line.split(' ')[1];
            engineRef.current.removeEventListener('message', onMessage);
            resolve({ bestMove: best, evaluation: lastCp });
          }
        };
        engineRef.current.addEventListener('message', onMessage);
        engineRef.current.postMessage('position fen ' + fenBefore);
        engineRef.current.postMessage('go depth 15');
      });

      // Play actual move
      chess.move(move);
      const fenAfter = chess.fen();

      // Update board to current state
      boardObj.current.position(fenAfter);

      // Generate basic explanation
      const explanation = `You played ${move.san}. Stockfish suggests ${bestMove}, and evaluation before this move was ${evaluation} centipawns.`;

      // Save data
      setMovesData((prev) => [
        ...prev,
        { san: move.san, fenBefore, fenAfter, bestMove, evaluation, explanation },
      ]);
    }

    setLoading(false);
  };

  // Jump to move
  const handleMoveClick = (idx) => {
    const m = movesData[idx];
    boardObj.current.position(m.fenAfter);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Game Review</h1>
        <textarea
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="Paste PGN here"
          className="w-full h-32 p-2 mb-4 text-black rounded"
        />
        <button
          onClick={handleAnalyze}
          className="px-6 py-2 bg-white text-black rounded hover:opacity-90"
        >
          Analyze Game
        </button>
        {loading && <p className="mt-4">Analyzing game, please wait...</p>}

        {!loading && movesData.length > 0 && (
          <div className="flex flex-col md:flex-row mt-6">
            <div className="w-full md:w-2/3">
              <div id="board" ref={boardRef} style={{ width: '100%', maxWidth: '600px' }} />
            </div>
            <div
              className="w-full md:w-1/3 mt-4 md:mt-0 md:ml-6 overflow-y-auto"
              style={{ maxHeight: '80vh' }}
            >
              <ol className="list-decimal list-inside space-y-4">
                {movesData.map((m, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleMoveClick(idx)}
                    className="p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer"
                  >
                    <p className="font-semibold">Move {idx + 1}: {m.san}</p>
                    <p>Best Move: <span className="font-medium">{m.bestMove}</span></p>
                    <p>Evaluation: <span className="font-medium">{m.evaluation} cp</span></p>
                    <p>{m.explanation}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
