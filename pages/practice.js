import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Chess from 'chess.js';
import { loadStockfish } from '../lib/stockfish';

// Dynamically import Chessboard.js (client-side only)
const loadChessboard = async () => {
  if (typeof window !== 'undefined') {
    await import('chessboardjs');
  }
};

export default function Practice() {
  const boardRef = useRef(null);
  const engineRef = useRef(null);
  const boardObj = useRef(null);
  const [game] = useState(new Chess());
  const [moves, setMoves] = useState([]);
  const [skill, setSkill] = useState(10);
  const [playerColor, setPlayerColor] = useState('white');

  // Initialize Stockfish
  useEffect(() => {
    loadStockfish().then((engine) => {
      engineRef.current = engine;
      engine.postMessage('uci');
      engine.postMessage('setoption name Skill Level value ' + skill);
      engine.postMessage('isready');
      engine.onmessage = handleEngineMessage;
      startNewGame();
    });
  }, []);

  // Update Skill Level on change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.postMessage('setoption name Skill Level value ' + skill);
    }
  }, [skill]);

  // Re-render board when orientation changes
  useEffect(() => {
    if (boardRef.current && engineRef.current) {
      loadChessboard().then(() => {
        boardObj.current = window.Chessboard(boardRef.current, {
          position: game.fen(),
          draggable: true,
          orientation: playerColor,
          onDrop: onDrop,
        });
      });
    }
  }, [playerColor]);

  // Handle engine bestmove
  const handleEngineMessage = (event) => {
    const line = typeof event === 'string' ? event : event.data;
    if (line.startsWith('bestmove')) {
      const parts = line.split(' ');
      const best = parts[1];
      if (best && best !== '(none)') {
        game.move({ from: best.slice(0, 2), to: best.slice(2, 4), promotion: 'q' });
        updateBoard();
      }
    }
  };

  // Called after user move
  const onDrop = (source, target) => {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (!move) return 'snapback';
    updateBoard();
    // Ask engine for its move
    setTimeout(() => {
      engineRef.current.postMessage('position fen ' + game.fen());
      engineRef.current.postMessage('go depth 15');
    }, 200);
    return undefined;
  };

  // Update both board and moves list
  const updateBoard = () => {
    boardObj.current.position(game.fen());
    const hist = game.history();
    setMoves(hist.map((m, i) => ({ san: m, ply: i + 1 })));  
  };

  // Reset game state
  const startNewGame = () => {
    game.reset();
    if (boardObj.current) boardObj.current.start();
    updateBoard();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="p-4 flex flex-col md:flex-row">
        {/* Controls + Board */}
        <div>
          <div className="mb-4 flex flex-wrap space-x-4 items-end">
            <div>
              <label className="block mb-1">Skill Level</label>
              <select
                value={skill}
                onChange={(e) => setSkill(parseInt(e.target.value))}
                className="p-2 text-black rounded"
              >
                {Array.from({ length: 21 }).map((_, i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1">Your Color</label>
              <select
                value={playerColor}
                onChange={(e) => setPlayerColor(e.target.value)}
                className="p-2 text-black rounded"
              >
                <option value="white">White</option>
                <option value="black">Black</option>
              </select>
            </div>
            <button
              onClick={startNewGame}
              className="px-4 py-2 bg-white text-black rounded hover:opacity-90"
            >
              New Game
            </button>
          </div>
          <div id="board" ref={boardRef} style={{ width: '400px', maxWidth: '100%' }} />
        </div>
        {/* Moves List */}
        <div className="mt-6 md:mt-0 md:ml-6 w-full md:w-1/3 overflow-y-auto" style={{ maxHeight: '600px' }}>
          <h2 className="text-xl font-bold mb-2">Move List</h2>
          <ol className="list-decimal list-inside space-y-1">
            {moves.map(({ san, ply }) => (
              <li key={ply}>
                {ply % 2 === 1 ? `${Math.ceil(ply / 2)}.` : ''} {san}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
