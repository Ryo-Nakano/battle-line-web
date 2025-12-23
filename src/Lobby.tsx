import React, { useState } from 'react';
import { getServerUrl } from './utils';
import { Sword, Shield } from 'lucide-react';

interface LobbyProps {
  onJoin: (matchID: string, playerID: string, playerName: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [matchID, setMatchID] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Generate random guest name on mount
    const randomNum = Math.floor(Math.random() * 900) + 100; // 100-999
    setPlayerName(`Guest${randomNum}`);
  }, []);

  const handleJoin = async () => {
    if (!matchID || !playerName) return;
    setLoading(true);
    setError('');

    const serverUrl = getServerUrl();
    const gameName = 'battle-line';

    try {
      const res = await fetch(`${serverUrl}/games/${gameName}/${matchID}`);

      if (res.status === 404) {
        // Create room
        const createRes = await fetch(`${serverUrl}/games/${gameName}/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            numPlayers: 2,
            matchID: matchID,
          }),
        });

        if (!createRes.ok) {
          throw new Error('Failed to create room');
        }
        await createRes.json();
        onJoin(matchID, '0', playerName);
      } else if (res.ok) {
        const data = await res.json();
        const players = data.players;

        // Check if seats are taken based on name or connection status
        // Note: Without explicit join API, name might be undefined, but isConnected should track active sockets
        const p0Taken = players.some((p: any) => p.id === 0 && (p.name || p.isConnected));
        const p1Taken = players.some((p: any) => p.id === 1 && (p.name || p.isConnected));

        if (!p0Taken) {
          onJoin(matchID, '0', playerName);
        } else if (!p1Taken) {
          onJoin(matchID, '1', playerName);
        } else {
          setError('Room is full');
        }
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    if (val.length <= 8) {
      setPlayerName(val);
    }
  };

  const handleMatchIDChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
    if (val.length <= 8) {
      setMatchID(val);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 font-sans select-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black relative overflow-hidden">
      {/* Background Grid Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="p-8 bg-zinc-900/80 backdrop-blur-md border border-zinc-700 rounded-2xl shadow-2xl w-96 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sword className="text-amber-600" size={32} />
            <h1 className="text-3xl font-bold text-center text-zinc-100 tracking-wider whitespace-nowrap">Battle Line Online</h1>
            <Shield className="text-amber-600" size={32} />
          </div>
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Nickname
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-black/40 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-zinc-600"
            placeholder="Enter nickname (max 8 chars)"
            value={playerName}
            onChange={handleNameChange}
          />
        </div>

        <div className="mb-8">
          <label className="block mb-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Room ID
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-black/40 border border-zinc-700 rounded-lg text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder-zinc-600"
            placeholder="Enter Room ID (max 8 chars)"
            value={matchID}
            onChange={handleMatchIDChange}
          />
        </div>

        <button
          className="w-full px-6 py-4 font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-500 focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20 transition-all transform active:scale-95 uppercase tracking-wide"
          onClick={handleJoin}
          disabled={loading || !matchID || !playerName}
        >
          {loading ? 'Connecting...' : 'Start Game'}
        </button>
        {error && <p className="mt-4 text-sm text-center text-red-500 animate-pulse">{error}</p>}
      </div>
    </div>
  );
};
