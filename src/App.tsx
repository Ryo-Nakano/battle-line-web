import { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { BattleLine } from './Game';
import { BattleLineBoard } from './board/Board';
import { Lobby } from './Lobby';
import { getServerUrl } from './utils';
import { loadSession, clearSession } from './utils/sessionStorage';
import type { SessionData } from './utils/sessionStorage';
import type { GameState } from './types';
import { RefreshCw } from 'lucide-react';

const server = getServerUrl();

const BattleLineClient = Client<GameState>({
  game: BattleLine as any,
  board: BattleLineBoard,
  multiplayer: SocketIO({ server }),
  debug: import.meta.env.DEV,
}) as any;

interface AppProps {
  playerID?: string;
  matchID?: string;
}

type SessionCheckState = 'checking' | 'dialog' | 'reconnecting' | 'error' | 'done';

const App = ({ playerID: initialPlayerID, matchID: initialMatchID }: AppProps = {}) => {
  const [matchID, setMatchID] = useState<string | null>(initialMatchID || null);
  const [playerID, setPlayerID] = useState<string | null>(initialPlayerID || null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<string | undefined>(undefined);

  // Session recovery states
  const [sessionCheckState, setSessionCheckState] = useState<SessionCheckState>('checking');
  const [savedSession, setSavedSession] = useState<SessionData | null>(null);

  // Check for saved session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setSavedSession(session);
      setSessionCheckState('dialog');
    } else {
      setSessionCheckState('done');
    }
  }, []);

  // Reconnect handler
  const handleReconnect = async () => {
    if (!savedSession) return;
    setSessionCheckState('reconnecting');

    try {
      const res = await fetch(`${getServerUrl()}/games/battle-line/${savedSession.matchID}`);
      if (res.ok) {
        // Room exists, reconnect
        setMatchID(savedSession.matchID);
        setPlayerID(savedSession.playerID);
        setPlayerName(savedSession.playerName);
        setCredentials(savedSession.credentials);
        setSessionCheckState('done');
      } else {
        // Room not found
        setSessionCheckState('error');
      }
    } catch {
      setSessionCheckState('error');
    }
  };

  // Back to lobby handler
  const handleBackToLobby = () => {
    clearSession();
    setSavedSession(null);
    setSessionCheckState('done');
  };

  // Leave room handler (called from game board)
  const handleLeaveRoom = () => {
    clearSession();
    setMatchID(null);
    setPlayerID(null);
    setPlayerName(null);
    setCredentials(undefined);
  };

  // Session check in progress
  if (sessionCheckState === 'checking') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  // Session recovery dialog
  if (sessionCheckState === 'dialog' && savedSession) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
          <h2 className="text-xl font-bold text-white mb-4">前回のセッションが見つかりました</h2>
          <p className="text-zinc-400 mb-6">
            部屋 <span className="text-amber-500 font-mono font-bold">{savedSession.matchID.slice(0, 8)}</span> に再接続しますか？
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleReconnect}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95"
            >
              再接続
            </button>
            <button
              onClick={handleBackToLobby}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 rounded-xl transition-all transform active:scale-95"
            >
              ロビーに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reconnecting state
  if (sessionCheckState === 'reconnecting') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-400">
          <RefreshCw className="animate-spin" size={20} />
          再接続中...
        </div>
      </div>
    );
  }

  // Error state (room not found)
  if (sessionCheckState === 'error') {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center p-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
          <h2 className="text-xl font-bold text-red-400 mb-4">部屋が見つかりませんでした</h2>
          <p className="text-zinc-400 mb-6">
            前回参加していた部屋は既に終了しているようです。
          </p>
          <button
            onClick={handleBackToLobby}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95"
          >
            ロビーに戻る
          </button>
        </div>
      </div>
    );
  }

  // Normal flow: show lobby or game
  if (!matchID || !playerID) {
    return <Lobby onJoin={(mid, pid, pname, creds) => {
      setMatchID(mid);
      setPlayerID(pid);
      setPlayerName(pname);
      if (creds) {
        setCredentials(creds);
      }
    }} />;
  }

  return (
    <BattleLineClient
      matchID={matchID}
      playerID={playerID}
      playerName={playerName}
      credentials={credentials}
      onLeaveRoom={handleLeaveRoom}
    />
  );
};

export default App;