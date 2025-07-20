import React, { useEffect, useRef } from 'react';
import Chess from 'chess.js';

// Utility to dynamically load Chessboard.js
const loadChessboard = async () => {
  if (typeof window !== 'undefined' && !window.Chessboard) {
    await import('chessboardjs');
  }
};

export default function ChessBoard({
  game,                  // instance of Chess (from chess.js)
  engine,                // Stockfish engine instance (optional)
  orientation = 'white', // 'white' or 'black'
  draggable = true,      // allow piece dragging
  onMove,                // callback(move) when user makes a move
  onDrop,                // override drop handler: function(source, target)
  width = '400px'        // board width
}) {
  const boardRef = useRef(null);
  const boardObj = useRef(null);

  // Default drop handler: validate move, update engine, call onMove
  const defaultOnDrop = (source, target) => {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (!move) return 'snapback';

    // Update board position
    boardObj.current.position(game.fen());

    // Notify engine
    if (engine) {
      engine.postMessage('position fen ' + game.fen());
      engine.postMessage('go depth 15');
    }

    // Callback
    if (onMove) onMove(move);

    return undefined;
  };

  // Initialize board once
  useEffect(() => {
    loadChessboard().then(() => {
      boardObj.current = window.Chessboard(boardRef.current, {
        position: game.fen(),
        orientation,
        draggable,
        onDrop: onDrop || defaultOnDrop,
      });
    });
  }, []);

  // Update board on game.fen() change or orientation change
  useEffect(() => {
    if (boardObj.current) {
      boardObj.current.orientation(orientation);
      boardObj.current.position(game.fen());
    }
  }, [game.fen(), orientation]);

  return (
    <div
      ref={boardRef}
      id="board"
      style={{ width, maxWidth: '100%' }}
    />
  );
}
