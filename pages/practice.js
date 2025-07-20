//pages/practice.js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import ChessBoard from '../components/ChessBoard';
import NotationPanel from '../components/NotationPanel';
import HypotheticalToggle from '../components/HypotheticalToggle';
import { getStockfishEngine, setEngineSkill } from '../lib/stockfish';
import { useAuth } from './_app';
import { saveGame } from '../lib/firebase';
import { detectMotifs } from '../lib/motifs';

export default function Practice() {
  const { user } = useAuth();
  const [game, setGame] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [playerColor, setPlayerColor] = useState('white');
  const [aiLevel, setAiLevel] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState('');
  const [thinking, setThinking] = useState(false);
  const [hypotheticalMode, setHypotheticalMode] = useState(false);
  const [evaluation, setEvaluation] = useState({ score: 0, mate: null });
  const engineRef = useRef(null);

  useEffect(() => {
    const initializeGame = async () => {
      if (typeof window !== 'undefined' && window.Chess) {
        const newGame = new window.Chess();
        setGame(newGame);
      }
    };

    initializeGame();
  }, []);

  useEffect(() => {
    const initEngine = async () => {
      try {
        engineRef.current = await getStockfishEngine();
        await setEngineSkill(aiLevel);
      } catch (error) {
        console.error('Failed to initialize engine:', error);
      }
    };

    initEngine();
  }, [aiLevel]);

  const startNewGame = async (color) => {
    if (!game) return;
    
    game.reset();
    setPlayerColor(color);
    setIsPlayerTurn(color === 'white');
    setGameStarted(true);
    setGameOver(false);
    setGameResult('');
    setGameHistory([]);
    setEvaluation({ score: 0, mate: null });

    if (color === 'black') {
      // AI plays first move as white
      setTimeout(() => makeAiMove(), 1000);
    }
  };

  const makeAiMove = async () => {
    if (!game || !engineRef.current || gameOver) return;

    setThinking(true);
    try {
      const fenBefore = game.fen();
      const bestMove = await engineRef.current.getBestMove(2000);
      
      if (bestMove && bestMove !== '(none)') {
        const move = game.move({
          from: bestMove.substring(0, 2),
          to: bestMove.substring(2, 4),
          promotion: bestMove.length > 4 ? bestMove.substring(4) : undefined
        });

        if (move) {
          // Motif detection
          const motifs = detectMotifs(game, move, fenBefore);
          const newHistory = [...gameHistory, {
            move: move,
            fen: game.fen(),
            san: move.san,
            evaluation: null,
            motifs
          }];
          
          setGameHistory(newHistory);
          setIsPlayerTurn(true);
          
          checkGameEnd();
          evaluatePosition();
        }
      }
    } catch (error) {
      console.error('AI move error:', error);
    } finally {
      setThinking(false);
    }
  };

  const onMove = async (move) => {
    if (!game || !isPlayerTurn || gameOver || hypotheticalMode) return;

    const gameMove = game.move(move);
    if (!gameMove) return false;

    // Motif detection
    const fenBefore = game.fen();
    const motifs = detectMotifs(game, gameMove, fenBefore);

    const newHistory = [...gameHistory, {
      move: gameMove,
      fen: game.fen(),
      san: gameMove.san,
      evaluation: null,
      motifs
    }];
    
    setGameHistory(newHistory);
    setIsPlayerTurn(false);

    if (checkGameEnd()) return true;
    
    evaluatePosition();
    
    // AI responds after a short delay
    setTimeout(() => makeAiMove(), 500);
    
    return true;
  };

  const evaluatePosition = async () => {
    if (!engineRef.current) return;
    
    try {
      const evaluation = await engineRef.current.getEvaluation(game.fen(), 12);
      setEvaluation(evaluation);
    } catch (error) {
      console.error('Evaluation error:', error);
    }
  };

  const checkGameEnd = () => {
    if (game.game_over()) {
      setGameOver(true);
      setIsPlayerTurn(false);
      
      let result = '';
      if (game.in_checkmate()) {
        result = game.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
      } else if (game.in_stalemate()) {
        result = 'Draw by stalemate';
      } else if (game.in_threefold_repetition()) {
        result = 'Draw by repetition';
      } else if (game.insufficient_material()) {
        result = 'Draw by insufficient material';
      } else {
        result = 'Draw by 50-move rule';
      }
      
      setGameResult(result);
      saveGameData();
      return true;
    }
    return false;
  };

  const saveGameData = async () => {
    if (!user || !game) return;

    try {
      const gameData = {
        pgn: game.pgn(),
        result: gameResult,
        playerColor,
        aiLevel,
        moves: gameHistory,
        startTime: new Date(),
        endTime: new Date()
      };

      await saveGame(user.uid, gameData);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  };

  const formatEvaluation = (evaluation) => {
    if (!evaluation) return '0.0';
    
    if (evaluation.mate !== null) {
      return `#${evaluation.mate}`;
    }
    
    const centipawns = evaluation.score || 0;
    const pawns = (centipawns / 100).toFixed(1);
    return pawns > 0 ? `+${pawns}` : pawns.toString();
  };

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p>Loading chess engine...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Practice vs AI - Chess Trainer</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Game Setup & Board */}
          <div className="lg:w-2/3">
            {!gameStarted ? (
              <div className="card mb-6">
                <div className="card-header">
                  <h1 className="text-2xl font-bold">Practice vs AI</h1>
                  <p className="text-gray-600 mt-1">Play against Stockfish with adjustable difficulty</p>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose Your Color
                      </label>
                      <div className="space-y-2">
                        <button
                          onClick={() => startNewGame('white')}
                          className="w-full btn-primary"
                        >
                          Play as White
                        </button>
                        <button
                          onClick={() => startNewGame('black')}
                          className="w-full btn-secondary"
                        >
                          Play as Black
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI Difficulty: Level {aiLevel}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={aiLevel}
                        onChange={(e) => setAiLevel(parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Beginner</span>
                        <span>Master</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Practice Game</h1>
                    <p className="text-gray-600">
                      You are {playerColor} vs AI Level {aiLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-mono">
                      Eval: {formatEvaluation(evaluation)}
                    </div>
                    {thinking && (
                      <div className="text-sm text-gray-600 flex items-center">
                        <div className="spinner mr-2"></div>
                        AI thinking...
                      </div>
                    )}
                  </div>
                </div>
                
                {gameOver && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
                    <h3 className="font-bold text-green-800">Game Over</h3>
                    <p className="text-green-700">{gameResult}</p>
                    <button
                      onClick={() => setGameStarted(false)}
                      className="btn-primary mt-2"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {gameStarted && (
              <>
                <HypotheticalToggle 
                  enabled={hypotheticalMode} 
                  onToggle={setHypotheticalMode} 
                />
                
                <ChessBoard
                  game={game}
                  onMove={onMove}
                  playerColor={playerColor}
                  disabled={!isPlayerTurn || gameOver}
                  hypotheticalMode={hypotheticalMode}
                />
              </>
            )}
          </div>

          {/* Right Column - Notation & Analysis */}
          {gameStarted && (
            <div className="lg:w-1/3">
              <NotationPanel
                moves={gameHistory.map(m => ({ san: m.san, motifs: m.motifs }))}
                currentGame={game}
                evaluation={evaluation}
                onMoveClick={(moveIndex) => {
                  // Navigate to specific position
                  console.log('Navigate to move:', moveIndex);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}