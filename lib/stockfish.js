// File: lib/stockfish.js

/**
 * Dynamically loads the Stockfish WASM engine.
 * Returns a Promise that resolves to the initialized engine instance (Web Worker).
 */
export async function loadStockfish() {
    // Import the stockfish package which exposes a factory for the engine
    const stockfish = await import('stockfish');
    // stockfish() returns a Worker instance
    const engine = stockfish();
    // Optional: configure any default UCI options here, e.g., hash size
    // engine.postMessage('setoption name Hash value 64');
    return engine;
  }
  