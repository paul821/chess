import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import Chess from 'chess.js';

// Dynamically load Chessboard.js (client-side only)
const loadChessboard = async () => {
  if (typeof window !== 'undefined' && !window.Chessboard) {
    await import('chessboardjs');
  }
};

export default function Explorer() {
  const boardRef = useRef(null);
  const boardObj = useRef(null);
  const [game] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState([]); // [{ san, uci }]
  const [openingMoves, setOpeningMoves] = useState([]); // API moves
  const [explanation, setExplanation] = useState('');
  const [classification, setClassification] = useState('');

  // Initialize board
  useEffect(() => {
    loadChessboard().then(() => {
      boardObj.current = window.Chessboard(boardRef.current, {
        position: game.fen(),
        draggable: false,
      });
    });
  }, []);

  // Fetch opening moves whenever moveHistory changes
  useEffect(() => {
    const fetchOpeningMoves = async () => {
      const uciSeq = moveHistory.map((m) => m.uci).join(',');
      const url = `https://explorer.lichess.ovh/master?moves=${uciSeq}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        setOpeningMoves(data.moves || []);
      } catch (err) {
        console.error('Error fetching opening moves', err);
      }
    };
    fetchOpeningMoves();
    // Clear explanation/class when drilling deeper
    setExplanation('');
    setClassification('');
  }, [moveHistory]);

  // Handle selecting a move from the explorer
  const onSelectMove = (m) => {
    // Apply move to game
    game.move({ from: m.uci.slice(0, 2), to: m.uci.slice(2, 4), promotion: 'q' });
    boardObj.current.position(game.fen());

    // Update history
    setMoveHistory([...moveHistory, { san: m.san, uci: m.uci }]);

    // Generate ELI5 explanation and classification (stub logic)
    const total = m.white + m.draws + m.black;
    const winRate = ((m.white / total) * 100).toFixed(1);
    let style = 'Balanced';
    if (winRate >= 55) style = 'Aggressive';
    else if (winRate <= 45) style = 'Defensive';

    setClassification(style);
    setExplanation(
      `The move ${m.san} leads to about ${winRate}% win rate for White. This typically indicates a ${style.toLowerCase()} game plan.`
    );
  };

  // Reset to starting position
  const onReset = () => {
    game.reset();
    boardObj.current.start();
    setMoveHistory([]);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="p-4 flex flex-col md:flex-row">
        {/* Board Section */}
        <div>
          <div className="mb-4">
            <button
              onClick={onReset}
              className="px-4 py-2 bg-white text-black rounded hover:opacity-90"
            >
              Reset Explorer
            </button>
          </div>
          <div
            id="board"
            ref={boardRef}
            style={{ width: '400px', maxWidth: '100%' }}
          />
        </div>

        {/* Explorer Panel */}
        <div className="mt-6 md:mt-0 md:ml-6 w-full md:w-1/3 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          <h2 className="text-xl font-bold mb-2">Opening Explorer</h2>
          {openingMoves.length === 0 ? (
            <p>No moves available. Reset or start selecting.</p>
          ) : (
            <ul className="space-y-2">
              {openingMoves.map((m, i) => {
                const total = m.white + m.draws + m.black;
                const whitePct = ((m.white / total) * 100).toFixed(1);
                const drawPct = ((m.draws / total) * 100).toFixed(1);
                const blackPct = ((m.black / total) * 100).toFixed(1);
                return (
                  <li
                    key={i}
                    className="p-2 bg-gray-800 rounded flex justify-between items-center hover:bg-gray-700 cursor-pointer"
                    onClick={() => onSelectMove(m)}
                  >
                    <div>
                      <span className="font-semibold mr-2">{m.san}</span>
                      <span className="text-sm">({total} games)</span>
                    </div>
                    <div className="text-xs">
                      W:{whitePct}% D:{drawPct}% B:{blackPct}%
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Explanation & Classification */}
          {explanation && (
            <div className="mt-6 bg-gray-900 p-4 rounded">
              <h3 className="text-lg font-bold mb-2">Style: {classification}</h3>
              <p>{explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
