import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Chess from 'chess.js';
import { loadStockfish } from '../lib/stockfish';

// Dynamically load Chessboard.js (client-side only)
const loadChessboard = async () => {
  if (typeof window !== 'undefined' && !window.Chessboard) {
    await import('chessboardjs');
  }
};

export default function BlunderRecall() {
  const [phase, setPhase] = useState('input'); // 'input', 'analyzing', 'flashcards'
  const [pgnText, setPgnText] = useState('');
  const [blunders, setBlunders] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userGuess, setUserGuess] = useState(null);
  const [feedback, setFeedback] = useState('');
  const engineRef = useRef(null);
  const boardRef = useRef(null);
  const boardObj = useRef(null);

  // Load Stockfish engine
  useEffect(() => {
    loadStockfish().then((engine) => {
      engineRef.current = engine;
      engineRef.current.postMessage('uci');
      engineRef.current.postMessage('isready');
    });
  }, []);

  // Analyze PGN for blunders
  const handleAnalyze = async () => {
    const chess = new Chess();
    if (!chess.load_pgn(pgnText)) {
      alert('Invalid PGN');
      return;
    }

    setPhase('analyzing');
    const history = chess.history({ verbose: true });
    chess.reset();

    const detected = [];
    // Sequentially analyze each move
    for (let mv of history) {
      const fenBefore = chess.fen();
      // Get best move and eval
      const { bestMove, bestEval } = await analyzePosition(fenBefore);
      // Apply user move
      chess.move(mv);
      const fenAfter = chess.fen();
      // Get eval of user move
      const { evaluation: userEval } = await analyzePosition(fenAfter);
      const loss = Math.abs(bestEval - userEval);
      if (loss >= 100) {
        detected.push({ fen: fenBefore, bestMove, loss });
      }
    }
    setBlunders(detected);
    setPhase('flashcards');
  };

  // Analyze a FEN: return best move and/or evaluation
  const analyzePosition = (fen) => {
    return new Promise((resolve) => {
      const engine = engineRef.current;
      let lastCp = 0;
      function onMessage(event) {
        const line = typeof event.data === 'string' ? event.data : '';
        if (line.startsWith('info') && line.includes(' score cp ')) {
          lastCp = parseInt(line.split(' score cp ')[1].split(' ')[0], 10);
        }
        if (line.startsWith('bestmove')) {
          const best = line.split(' ')[1];
          engine.removeEventListener('message', onMessage);
          resolve({ bestMove: best, bestEval: lastCp, evaluation: lastCp });
        }
      }
      engine.addEventListener('message', onMessage);
      engine.postMessage('position fen ' + fen);
      engine.postMessage('go depth 15');
    });
  };

  // Setup flashcard board when reaching flashcards phase or changing index
  useEffect(() => {
    if (phase === 'flashcards' && blunders.length > 0) {
      loadChessboard().then(() => {
        const { fen } = blunders[currentIndex];
        boardObj.current = window.Chessboard(boardRef.current, {
          position: fen,
          draggable: true,
          onDrop: onDropFlashcard,
        });
      });
    }
  }, [phase, currentIndex]);

  // Handle user's flashcard guess
  const onDropFlashcard = (source, target) => {
    const guess = source + target;
    setUserGuess(guess);
    const { bestMove } = blunders[currentIndex];
    if (guess === bestMove) setFeedback('Correct!');
    else setFeedback(`Incorrect. Best move was ${bestMove}.`);
    // Snap back piece
    return 'snapback';
  };

  // Move to next flashcard or restart
  const handleNextCard = () => {
    if (currentIndex + 1 < blunders.length) {
      setCurrentIndex(currentIndex + 1);
      setUserGuess(null);
      setFeedback('');
    } else {
      // All done
      setPhase('input');
      setCurrentIndex(0);
      setBlunders([]);
      setUserGuess(null);
      setFeedback('');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <Navbar />

      {phase === 'input' && (
        <div className="max-w-xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Blunder Recall</h1>
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
            Analyze for Blunders
          </button>
        </div>
      )}

      {phase === 'analyzing' && (
        <p className="mt-6 text-center">Analyzing for blunders, please wait...</p>
      )}

      {phase === 'flashcards' && (
        <div className="flex flex-col items-center">
          {blunders.length === 0 ? (
            <p className="mt-6">No major blunders found.</p>
          ) : (
            <>
              <p className="mb-4">
                Card {currentIndex + 1} of {blunders.length} (Loss ≥ 100 cp)
              </p>
              <div id="board" ref={boardRef} style={{ width: '400px', maxWidth: '100%' }} />
              {userGuess ? (
                <div className="mt-4 text-center">
                  <p className="mb-2">{feedback}</p>
                  <button
                    onClick={handleNextCard}
                    className="px-4 py-2 bg-white text-black rounded hover:opacity-90"
                  >
                    {currentIndex + 1 < blunders.length ? 'Next Card' : 'Restart'}
                  </button>
                </div>
              ) : (
                <p className="mt-4">Guess the better move by dragging a piece.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
