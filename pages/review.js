import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Chess from 'chess.js';
import { loadStockfish } from '../lib/stockfish';
import FileSaver from 'file-saver';
import JSZip from 'jszip';
import { useContext } from 'react';
import { AuthContext } from './_app';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { detectMotifs } from '../lib/motifs';

// Dynamically import Chessboard.js
const loadChessboard = async () => {
  if (typeof window !== 'undefined' && !window.Chessboard) {
    await import('chessboardjs');
  }
};

// Enhanced GPT-style explanation generator
function generateNuancedExplanation(move, bestMove, evaluation, loss, idx, history, chess) {
  let explanation = '';
  // Phase detection
  let phase = 'middlegame';
  if (idx < 10) phase = 'opening';
  else if (idx > history.length - 10) phase = 'endgame';

  // Opening
  if (phase === 'opening') {
    explanation += 'In the opening, it’s important to develop pieces and control the center. ';
  } else if (phase === 'endgame') {
    explanation += 'In the endgame, king activity and pawn promotion are crucial. ';
  }

  // Move quality
  if (loss >= 300) {
    explanation += `This move is a blunder (loss: ${loss} cp). `;
    explanation += 'It significantly worsens your position. ';
  } else if (loss >= 100) {
    explanation += `This move is an inaccuracy (loss: ${loss} cp). `;
    explanation += 'There was a better option available. ';
  } else if (loss <= 30) {
    explanation += `Excellent move! (loss: ${loss} cp). `;
  } else {
    explanation += `This move is reasonable. (loss: ${loss} cp). `;
  }

  // Tactical/strategic motifs
  if (move.flags && move.flags.includes('c')) {
    explanation += 'You captured a piece. ';
  }
  if (move.san.includes('+')) {
    explanation += 'You gave check, putting pressure on the king. ';
  }
  if (move.san.includes('#')) {
    explanation += 'Checkmate! Well done. ';
  }
  if (move.flags && move.flags.includes('p')) {
    explanation += 'Pawn promotion! Advancing pawns in the endgame is key. ';
  }
  if (move.san.toLowerCase().includes('x')) {
    explanation += 'This is a capture. ';
  }

  // King safety
  const fen = chess.fen();
  if (fen.includes('k') && fen.split('k').length - 1 === 1 && phase !== 'endgame') {
    explanation += 'Be cautious: your king may be exposed. ';
  }

  // Center control
  if (['e4','d4','e5','d5'].some(sq => move.to === sq)) {
    explanation += 'This move helps control the center. ';
  }

  // Piece activity
  if (['N','B','R','Q'].includes(move.piece?.toUpperCase())) {
    explanation += `Activating your ${move.piece?.toUpperCase()} can increase pressure. `;
  }

  // Missed tactics (simple heuristic)
  if (loss >= 200 && bestMove && bestMove !== move.san) {
    explanation += `You missed a tactical opportunity: Stockfish suggests ${bestMove}. `;
  }

  // Conversational wrap-up
  if (move.san === bestMove) {
    explanation += 'This matches Stockfish’s top choice. ';
  } else {
    explanation += `Consider ${bestMove} next time for a stronger position. `;
  }

  return explanation.trim();
}

export default function Review() {
  const [pgnText, setPgnText] = useState('');
  const [movesData, setMovesData] = useState([]); // [{ san, fenBefore, fenAfter, bestMove, evaluation, explanation }]
  const [loading, setLoading] = useState(false);
  const engineRef = useRef(null);
  const chessRef = useRef(new Chess());
  const boardRef = useRef(null);
  const boardObj = useRef(null);
  const { user } = useContext(AuthContext);

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

      // Calculate centipawn loss
      const loss = Math.abs(evaluation - (movesData.length > 0 ? movesData[movesData.length - 1].evaluation : 0));
      // Generate nuanced explanation
      const explanation = generateNuancedExplanation(move, bestMove, evaluation, loss, i, history, chess);
      // Detect motifs
      const motifs = detectMotifs(chess, move, fenBefore);
      // Save data
      setMovesData((prev) => [
        ...prev,
        { san: move.san, fenBefore, fenAfter, bestMove, evaluation, explanation, motifs },
      ]);
    }

    setLoading(false);
  };

  // Jump to move
  const handleMoveClick = (idx) => {
    const m = movesData[idx];
    boardObj.current.position(m.fenAfter);
  };

  // Export annotated PGN
  const handleExportPGN = () => {
    if (!movesData.length) return;
    let pgn = '';
    movesData.forEach((m, idx) => {
      pgn += `${idx % 2 === 0 ? (idx / 2 + 1) + '. ' : ''}${m.san} `;
      pgn += `{ [%eval ${m.evaluation}] [%best ${m.bestMove}] ${m.explanation} } `;
    });
    const blob = new Blob([pgn], { type: 'text/plain;charset=utf-8' });
    FileSaver.saveAs(blob, 'annotated_game.pgn');
  };

  // Export JSON summary
  const handleExportJSON = () => {
    if (!movesData.length) return;
    const blob = new Blob([JSON.stringify(movesData, null, 2)], { type: 'application/json' });
    FileSaver.saveAs(blob, 'game_summary.json');
  };

  // Export all games as ZIP (for logged-in users)
  const handleExportZIP = async () => {
    if (!user) return;
    const zip = new JSZip();
    const gamesCol = collection(db, 'users', user.uid, 'games');
    const snapshot = await getDocs(gamesCol);
    const games = snapshot.docs.map(doc => doc.data());
    games.forEach((game, idx) => {
      zip.file(`game_${idx + 1}.pgn`, game.pgn || '');
      zip.file(`game_${idx + 1}.json`, JSON.stringify(game, null, 2));
    });
    const content = await zip.generateAsync({ type: 'blob' });
    FileSaver.saveAs(content, 'all_games.zip');
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
        {/* Export Buttons */}
        <div className="flex flex-wrap gap-4 mt-4">
          <button
            onClick={handleExportPGN}
            className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
            disabled={!movesData.length}
          >
            Export PGN
          </button>
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
            disabled={!movesData.length}
          >
            Export JSON
          </button>
          {user && (
            <button
              onClick={handleExportZIP}
              className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
            >
              Export All (ZIP)
            </button>
          )}
        </div>
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
                    {m.motifs && m.motifs.length > 0 && (
                      <p className="mt-1 text-yellow-300">Motifs: {m.motifs.join(', ')}</p>
                    )}
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
