//lib/stockfish.js
class StockfishEngine {
    constructor() {
      this.worker = null;
      this.isReady = false;
      this.callbacks = new Map();
      this.messageId = 0;
    }
  
    async init() {
      if (this.worker) {
        return;
      }
  
      try {
        // Load Stockfish WASM worker
        this.worker = new Worker('/stockfish.js');
        
        this.worker.onmessage = (event) => {
          this.handleMessage(event.data);
        };
  
        await this.sendCommand('uci');
        await this.waitForReady();
        
        this.isReady = true;
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
        throw new Error('Failed to initialize chess engine');
      }
    }
  
    handleMessage(data) {
      const message = data.toString();
      
      if (message.includes('uciok')) {
        this.resolveCallback('uci', 'ready');
      } else if (message.includes('readyok')) {
        this.resolveCallback('isready', 'ready');
      } else if (message.startsWith('bestmove')) {
        const match = message.match(/bestmove (\w+)/);
        if (match) {
          this.resolveCallback('bestmove', match[1]);
        }
      } else if (message.startsWith('info')) {
        this.handleInfoMessage(message);
      }
    }
  
    handleInfoMessage(message) {
      // Parse evaluation info
      const depthMatch = message.match(/depth (\d+)/);
      const scoreMatch = message.match(/score cp (-?\d+)/);
      const mateMatch = message.match(/score mate (-?\d+)/);
      const pvMatch = message.match(/pv (.+)/);
  
      if (depthMatch && (scoreMatch || mateMatch)) {
        const evaluation = {
          depth: parseInt(depthMatch[1]),
          score: scoreMatch ? parseInt(scoreMatch[1]) : null,
          mate: mateMatch ? parseInt(mateMatch[1]) : null,
          bestLine: pvMatch ? pvMatch[1].split(' ') : []
        };
  
        this.resolveCallback('evaluation', evaluation);
      }
    }
  
    async sendCommand(command) {
      if (!this.worker) {
        throw new Error('Stockfish not initialized');
      }
  
      return new Promise((resolve) => {
        const callbackKey = command.split(' ')[0];
        this.callbacks.set(callbackKey, resolve);
        this.worker.postMessage(command);
      });
    }
  
    resolveCallback(key, data) {
      const callback = this.callbacks.get(key);
      if (callback) {
        callback(data);
        this.callbacks.delete(key);
      }
    }
  
    async waitForReady() {
      return this.sendCommand('isready');
    }
  
    async setPosition(fen) {
      await this.sendCommand(`position fen ${fen}`);
    }
  
    async setBoardPosition(moves = []) {
      if (moves.length === 0) {
        await this.sendCommand('position startpos');
      } else {
        await this.sendCommand(`position startpos moves ${moves.join(' ')}`);
      }
    }
  
    async getBestMove(timeMs = 1000, depth = null) {
      const searchCommand = depth 
        ? `go depth ${depth}`
        : `go movetime ${timeMs}`;
      
      return this.sendCommand(searchCommand);
    }
  
    async getEvaluation(fen, depth = 15) {
      await this.setPosition(fen);
      
      return new Promise((resolve) => {
        this.callbacks.set('evaluation', resolve);
        this.worker.postMessage(`go depth ${depth}`);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.callbacks.has('evaluation')) {
            this.callbacks.delete('evaluation');
            resolve({ score: 0, depth: 0, mate: null, bestLine: [] });
          }
        }, 5000);
      });
    }
  
    async setSkillLevel(level) {
      // Level 0-20, where 20 is strongest
      await this.sendCommand(`setoption name Skill Level value ${level}`);
      
      // Add some randomness for lower levels
      if (level < 15) {
        await this.sendCommand(`setoption name MultiPV value 1`);
        await this.sendCommand(`setoption name UCI_LimitStrength value true`);
        await this.sendCommand(`setoption name UCI_Elo value ${800 + (level * 100)}`);
      }
    }
  
    async analyzePosition(fen, depth = 20) {
      await this.setPosition(fen);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Analysis timeout'));
        }, 10000);
  
        this.callbacks.set('evaluation', (evaluation) => {
          clearTimeout(timeout);
          resolve(evaluation);
        });
  
        this.worker.postMessage(`go depth ${depth}`);
      });
    }
  
    terminate() {
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
        this.isReady = false;
        this.callbacks.clear();
      }
    }
  }
  
  // Singleton instance
  let stockfishEngine = null;
  
  export const getStockfishEngine = async () => {
    if (!stockfishEngine) {
      stockfishEngine = new StockfishEngine();
      await stockfishEngine.init();
    }
    return stockfishEngine;
  };
  
  export const evaluatePosition = async (fen, depth = 15) => {
    const engine = await getStockfishEngine();
    return engine.getEvaluation(fen, depth);
  };
  
  export const getBestMove = async (fen, timeMs = 1000) => {
    const engine = await getStockfishEngine();
    await engine.setPosition(fen);
    return engine.getBestMove(timeMs);
  };
  
  export const setEngineSkill = async (level) => {
    const engine = await getStockfishEngine();
    return engine.setSkillLevel(level);
  };
  
  export default StockfishEngine;