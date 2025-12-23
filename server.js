import { createRequire } from 'module';
import { BattleLine } from './src/Game.js';

const require = createRequire(import.meta.url);
const { Server, Origins } = require('boardgame.io/server');

const server = Server({
  games: [BattleLine],
  origins: [
    Origins.LOCALHOST,
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.ALLOWED_ORIGIN || 'https://myapp.vercel.app'
  ],
});

const PORT = parseInt(process.env.PORT || '8000', 10);
server.run(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});