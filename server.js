import { createRequire } from 'module';
import { BattleLine } from './src/Game.js';
import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

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
  constructor(redisClient = null) {
    this.matches = new Map();
    this.redisClient = redisClient;
  }

  async connect() {
    if (!this.redisClient) return;

    try {
      // Restore all match data from Redis
      const matchIDs = await this.redisClient.sMembers('matches');
      for (const matchID of matchIDs) {
        const key = `match:${matchID}`;
        const dataStr = await this.redisClient.get(key);
        if (dataStr) {
          const data = JSON.parse(dataStr);
          this.matches.set(matchID, data);
        }
      }

      console.log(`✅ Restored ${matchIDs.length} matches from Redis`);
    } catch (error) {
      console.error('Failed to restore from Redis:', error);
    }
  }

  type() {
    return 'SYNC';
  }

  async createMatch(matchID, opts) {
    const matchData = {
      matchID,
      initialState: opts.initialState,
      state: opts.initialState,
      metadata: opts.metadata,
      log: [],
    };

    this.matches.set(matchID, matchData);

    // Backup to Redis asynchronously
    this._backupToRedis(matchID, matchData);
  }

  async setState(matchID, state, deltalog) {
    const match = this.matches.get(matchID);
    if (!match) return;
    match.state = state;
    match.log = [...match.log, ...deltalog];

    // Backup to Redis asynchronously
    this._backupToRedis(matchID, match);
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

    // Backup to Redis asynchronously
    this._backupToRedis(matchID, match);
  }

  async fetch(matchID, opts) {
    const match = this.matches.get(matchID);
    if (!match) return {};
    return match;
  }

  async wipe(matchID) {
    this.matches.delete(matchID);

    // Delete from Redis asynchronously
    this._deleteFromRedis(matchID);
  }

  async listMatches(opts) {
    return Array.from(this.matches.keys());
  }

  _backupToRedis(matchID, matchData) {
    if (!this.redisClient) return;

    // Execute asynchronously without blocking game flow
    setImmediate(async () => {
      try {
        const key = `match:${matchID}`;
        await this.redisClient.set(key, JSON.stringify(matchData));
        await this.redisClient.sAdd('matches', matchID);
      } catch (error) {
        console.error(`Failed to backup ${matchID} to Redis:`, error);
      }
    });
  }

  _deleteFromRedis(matchID) {
    if (!this.redisClient) return;

    setImmediate(async () => {
      try {
        const key = `match:${matchID}`;
        await this.redisClient.del(key);
        await this.redisClient.sRem('matches', matchID);
      } catch (error) {
        console.error(`Failed to delete ${matchID} from Redis:`, error);
      }
    });
  }
}



async function startServer() {
  let db;
  let redisClient = null;

  // Initialize Redis client if REDIS_URL is set
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          tls: process.env.REDIS_URL.startsWith('rediss://'),
          rejectUnauthorized: false // Required for some managed Redis services
        }
      });

      redisClient.on('error', (err) => console.error('Redis Client Error', err));
      await redisClient.connect();

      console.log('✅ Connected to Redis');
    } catch (error) {
      console.warn('⚠️ Redis connection failed:', error.message);
      console.log('ℹ️ Continuing with in-memory only (no persistence)');
      redisClient = null;
    }
  } else {
    console.log('ℹ️ REDIS_URL not set, using in-memory storage only');
  }

  // Create CustomInMemoryDB with Redis client for backup
  db = new CustomInMemoryDB(redisClient);

  // Restore data from Redis if available
  await db.connect();

  const server = Server({
    games: [BattleLine],
    db,
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
}

startServer().catch(console.error);