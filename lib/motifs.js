import Chess from 'chess.js';

/**
 * Advanced motif detection for a move in chess.js.
 * @param {Chess} chess - chess.js instance AFTER the move
 * @param {Object} move - move object from chess.js history
 * @param {string} prevFen - FEN before the move
 * @returns {string[]} - array of motif names
 */
export function detectMotifs(chess, move, prevFen) {
  const motifs = [];
  const color = move.color;
  const oppColor = color === 'w' ? 'b' : 'w';
  const from = move.from;
  const to = move.to;
  const piece = move.piece;

  // Helper: get all squares attacked by a color
  function getAttackedSquares(chess, color) {
    const squares = [];
    chess.SQUARES.forEach(sq => {
      const moves = chess.moves({ square: sq, verbose: true });
      moves.forEach(m => {
        if (m.color === color) squares.push(m.to);
      });
    });
    return squares;
  }

  // Fork: moved piece attacks 2+ valuable enemy pieces
  const attackers = chess.moves({ square: to, verbose: true });
  let forkTargets = attackers.filter(m => {
    const t = chess.get(m.to);
    return t && t.color === oppColor && ['q','r','b','n'].includes(t.type);
  });
  if (forkTargets.length >= 2) motifs.push('Fork');

  // Double Attack: moved piece attacks two or more pieces (any value)
  if (attackers.filter(m => {
    const t = chess.get(m.to);
    return t && t.color === oppColor;
  }).length >= 2) motifs.push('Double Attack');

  // Pin: check if any enemy piece is pinned after this move
  chess.SQUARES.forEach(sq => {
    const p = chess.get(sq);
    if (p && p.color === oppColor && isPinned(chess, sq, oppColor)) motifs.push('Pin');
  });

  // Skewer: improved detection
  if (['q','r','b'].includes(piece)) {
    if (detectSkewer(chess, to, color)) motifs.push('Skewer');
  }

  // Discovered Attack/Check: compare attacks before and after
  if (prevFen) {
    const prevChess = new Chess(prevFen);
    const prevAttacks = getAttackedSquares(prevChess, color);
    const afterAttacks = getAttackedSquares(chess, color);
    if (afterAttacks.length > prevAttacks.length) {
      if (afterAttacks.some(sq => {
        const t = chess.get(sq);
        return t && t.color === oppColor && t.type === 'k';
      })) {
        motifs.push('Discovered Check');
      } else {
        motifs.push('Discovered Attack');
      }
    }
  }

  // X-ray Attack: sliding piece attacks through another piece
  if (detectXRay(chess, to, color)) motifs.push('X-ray Attack');

  // Battery: two or more pieces of the same color aligned on a file, rank, or diagonal
  if (detectBattery(chess, color)) motifs.push('Battery');

  // Perpetual Check (simple): if move gives check and the same check was possible last turn
  if (move.san.includes('+') && prevFen) {
    const prevChess = new Chess(prevFen);
    const prevChecks = getAttackedSquares(prevChess, color).filter(sq => {
      const t = prevChess.get(sq);
      return t && t.color === oppColor && t.type === 'k';
    });
    const nowChecks = getAttackedSquares(chess, color).filter(sq => {
      const t = chess.get(sq);
      return t && t.color === oppColor && t.type === 'k';
    });
    if (nowChecks.length && prevChecks.length) motifs.push('Perpetual Check (possible)');
  }

  // Outpost: knight or bishop on a protected square in enemy territory
  if (['n','b'].includes(piece) && isOutpost(chess, to, color)) motifs.push('Outpost');

  // Mating Net (basic): if move gives check and king has 2 or fewer escape squares
  if (move.san.includes('+')) {
    const kingSq = findKing(chess, oppColor);
    if (kingSq && kingEscapeSquares(chess, kingSq).length <= 2) motifs.push('Mating Net (threat)');
  }

  // Hanging Piece: enemy piece attacked and not defended
  chess.SQUARES.forEach(sq => {
    const p = chess.get(sq);
    if (p && p.color === oppColor && isHanging(chess, sq, oppColor)) motifs.push('Hanging Piece');
  });

  // Overloaded Defender: a piece defends multiple important pieces
  chess.SQUARES.forEach(sq => {
    const p = chess.get(sq);
    if (p && p.color === oppColor) {
      const defenders = defendersOf(chess, sq, oppColor);
      if (defenders.length >= 2) motifs.push('Overloaded Defender');
    }
  });

  // Trapped Piece: enemy piece has no safe squares
  chess.SQUARES.forEach(sq => {
    const p = chess.get(sq);
    if (p && p.color === oppColor && isTrapped(chess, sq, oppColor)) motifs.push('Trapped Piece');
  });

  // Pawn Structure: passed, isolated, doubled pawns
  motifs.push(...detectPawnMotifs(chess, color));

  // Back Rank Threat: king on back rank, no escape squares
  if (isBackRankThreat(chess, oppColor)) motifs.push('Back Rank Threat');

  return [...new Set(motifs)].map(formatMotifName);
}

// --- Helper motif functions ---

function isPinned(chess, sq, color) {
  const p = chess.get(sq);
  if (!p) return false;
  const kingSq = findKing(chess, color);
  if (!kingSq) return false;
  const moves = chess.moves({ square: sq, verbose: true });
  for (let m of moves) {
    const test = new Chess(chess.fen());
    test.move({ from: sq, to: m.to, promotion: m.promotion });
    if (test.in_check()) return true;
  }
  return false;
}

function detectSkewer(chess, from, color) {
  // Improved: look for sliding piece attacking two pieces in a line
  // For each direction, check if two pieces (first is more valuable) are aligned
  const piece = chess.get(from);
  if (!piece || !['q','r','b'].includes(piece.type)) return false;
  const directions = piece.type === 'b' ? [[1,1],[1,-1],[-1,1],[-1,-1]] :
    piece.type === 'r' ? [[1,0],[-1,0],[0,1],[0,-1]] :
    [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  const fileIdx = from.charCodeAt(0) - 97;
  const rankIdx = parseInt(from[1],10) - 1;
  for (let [df, dr] of directions) {
    let foundFirst = null, foundSecond = null;
    for (let i = 1; i < 8; i++) {
      const f = fileIdx + df*i;
      const r = rankIdx + dr*i;
      if (f < 0 || f > 7 || r < 0 || r > 7) break;
      const sq = String.fromCharCode(97+f) + (r+1);
      const p = chess.get(sq);
      if (p) {
        if (!foundFirst) foundFirst = p;
        else { foundSecond = p; break; }
      }
    }
    if (foundFirst && foundSecond && pieceValue(foundFirst.type) > pieceValue(foundSecond.type)) return true;
  }
  return false;
}

function detectXRay(chess, from, color) {
  // X-ray: sliding piece attacks through another piece
  // Heuristic: after move, does a rook/bishop/queen attack a piece through another?
  // Not perfect, but checks for direct lines
  return false; // Placeholder for future expansion
}

function detectBattery(chess, color) {
  // Battery: two or more pieces of the same color aligned
  // Heuristic: two rooks/queen on same file/rank, or queen/bishop on same diagonal
  // Not perfect, but checks for common batteries
  return false; // Placeholder for future expansion
}

function isHanging(chess, sq, color) {
  const attackers = attackersOf(chess, sq, color === 'w' ? 'b' : 'w');
  const defenders = defendersOf(chess, sq, color);
  return attackers.length > 0 && defenders.length === 0;
}

function defendersOf(chess, sq, color) {
  return chess.SQUARES.filter(s => {
    const moves = chess.moves({ square: s, verbose: true });
    return moves.some(m => m.to === sq && chess.get(s).color === color);
  });
}

function attackersOf(chess, sq, color) {
  return chess.SQUARES.filter(s => {
    const moves = chess.moves({ square: s, verbose: true });
    return moves.some(m => m.to === sq && chess.get(s).color === color);
  });
}

function isTrapped(chess, sq, color) {
  const moves = chess.moves({ square: sq, verbose: true });
  return moves.every(m => {
    const test = new Chess(chess.fen());
    test.move({ from: sq, to: m.to, promotion: m.promotion });
    return test.get(m.to) && test.get(m.to).color !== color;
  });
}

function detectPawnMotifs(chess, color) {
  const motifs = [];
  const pawns = chess.SQUARES.filter(sq => {
    const p = chess.get(sq);
    return p && p.color === color && p.type === 'p';
  });
  const files = {};
  pawns.forEach(sq => {
    const file = sq[0];
    files[file] = (files[file] || 0) + 1;
  });
  Object.values(files).forEach(count => {
    if (count > 1) motifs.push('Doubled Pawns');
  });
  for (let sq of pawns) {
    const file = sq[0];
    const adjFiles = [String.fromCharCode(file.charCodeAt(0) - 1), String.fromCharCode(file.charCodeAt(0) + 1)];
    const hasNeighbor = adjFiles.some(f => pawns.some(p => p[0] === f));
    if (!hasNeighbor) motifs.push('Isolated Pawn');
  }
  for (let sq of pawns) {
    const file = sq[0];
    const rank = parseInt(sq[1], 10);
    let blocked = false;
    for (let r = rank + 1; r <= 8; r++) {
      const f = file;
      const oppPawn = chess.get(f + r);
      if (oppPawn && oppPawn.type === 'p' && oppPawn.color !== color) blocked = true;
    }
    if (!blocked) motifs.push('Passed Pawn');
  }
  return motifs;
}

function isBackRankThreat(chess, color) {
  const kingSq = findKing(chess, color);
  if (!kingSq) return false;
  const rank = color === 'w' ? '1' : '8';
  if (!kingSq.endsWith(rank)) return false;
  const file = kingSq[0];
  const nextRank = color === 'w' ? '2' : '7';
  const frontSq = file + nextRank;
  return chess.get(frontSq) !== null;
}

function findKing(chess, color) {
  return chess.SQUARES.find(sq => {
    const p = chess.get(sq);
    return p && p.type === 'k' && p.color === color;
  });
}

function isOutpost(chess, sq, color) {
  // Outpost: knight/bishop on protected square in enemy territory
  const rank = parseInt(sq[1], 10);
  if ((color === 'w' && rank < 5) || (color === 'b' && rank > 4)) return false;
  const defenders = defendersOf(chess, sq, color);
  const attackers = attackersOf(chess, sq, color === 'w' ? 'b' : 'w');
  return defenders.length > attackers.length;
}

function kingEscapeSquares(chess, kingSq) {
  const moves = chess.moves({ square: kingSq, verbose: true });
  return moves.filter(m => !m.san.includes('#'));
}

function pieceValue(type) {
  return { k: 100, q: 9, r: 5, b: 3, n: 3, p: 1 }[type] || 0;
}

export function formatMotifName(name) {
  // Make motif names user-friendly
  return name.replace(/_/g, ' ').replace(/\b([a-z])/g, c => c.toUpperCase());
} 