import { createRequire } from 'module';
import { BattleLine } from './src/Game.js';

const require = createRequire(import.meta.url);
const { Server, Origins } = require('boardgame.io/server');

// Validation helper function
const IDENTIFIER_PATTERN = /^[a-zA-Z0-9_]{1,8}$/;

function validateIdentifier(value, fieldName) {
  if (value && !IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`Invalid ${fieldName}. Use 1-8 alphanumeric characters or underscores.`);
  }
}

class CustomInMemoryDB {
  constructor() {
    this.matches = new Map();
  }

  async connect() {
    // No-op for in-memory
  }

  type() {
    return 'SYNC';
  }

  async createMatch(matchID, opts) {
    this.matches.set(matchID, {
      matchID,
      initialState: opts.initialState,
      state: opts.initialState,
      metadata: opts.metadata,
      log: [],
    });
  }

  async setState(matchID, state, deltalog) {
    const match = this.matches.get(matchID);
    if (!match) return;
    match.state = state;
    match.log = [...match.log, ...deltalog];
  }

  async setMetadata(matchID, metadata) {
    const players = metadata.players || [];
    const playerList = Array.isArray(players) ? players : Object.values(players);

    for (const player of playerList) {
      if (player.name) {
        validateIdentifier(player.name, 'Player Name');
      }
    }

    const match = this.matches.get(matchID);
    if (!match) return;
    match.metadata = metadata;
  }

  async fetch(matchID, opts) {
    const match = this.matches.get(matchID);
    if (!match) return {};
    return match;
  }

  async wipe(matchID) {
    this.matches.delete(matchID);
  }

  async listMatches(opts) {
    return Array.from(this.matches.keys());
  }
}

const server = Server({
  games: [BattleLine],
  db: new CustomInMemoryDB(),
  origins: [
    Origins.LOCALHOST,
    process.env.ALLOWED_ORIGIN || 'https://myapp.vercel.app'
  ],
});

// Error Handling Middleware
server.app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (err.message && (
      err.message.startsWith('Invalid Room Name') ||
      err.message.startsWith('Invalid Player Name')
    )) {
      ctx.status = 400;
      ctx.body = { error: err.message };
    } else {
      throw err;
    }
  }
});

const PORT = parseInt(process.env.PORT || '8000', 10);
server.run(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});