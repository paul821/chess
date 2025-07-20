import React from 'react';

/**
 * NotationPanel
 * Displays a list of moves and handles selection.
 * Props:
 * - moves: array of move objects (e.g., { san, uci, ply })
 * - onSelect: callback receiving the move object when clicked
 * - title: optional title label
 */
export default function NotationPanel({ moves = [], onSelect = null, title = 'Moves' }) {
  return (
    <div className="p-4 overflow-y-auto h-screen bg-black text-white">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      {moves.length === 0 ? (
        <p className="text-gray-400">No moves to display.</p>
      ) : (
        <ol className="list-decimal list-inside space-y-1">
          {moves.map((m, i) => (
            <li
              key={i}
              onClick={() => onSelect && onSelect(m)}
              className="cursor-pointer hover:text-gray-300"
            >
              {m.san}
              {m.motifs && m.motifs.length > 0 && (
                <div className="text-xs text-yellow-300 mt-0.5">{m.motifs.join(', ')}</div>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
