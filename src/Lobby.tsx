import React, { useState } from 'react';
import { getServerUrl } from './utils';

interface LobbyProps {
  onJoin: (matchID: string, playerID: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  const [matchID, setMatchID] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!matchID) return;
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
        onJoin(matchID, '0');
      } else if (res.ok) {
        const data = await res.json();
        const players = data.players;

        // Check if seats are taken based on name or connection status
        // Note: Without explicit join API, name might be undefined, but isConnected should track active sockets
        const p0Taken = players.some((p: any) => p.id === 0 && (p.name || p.isConnected));
        const p1Taken = players.some((p: any) => p.id === 1 && (p.name || p.isConnected));

        if (!p0Taken) {
          onJoin(matchID, '0');
        } else if (!p1Taken) {
          onJoin(matchID, '1');
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h1 className="mb-6 text-2xl font-bold text-center text-gray-800">Battle Line</h1>
        <div className="mb-4">
          <label className="block mb-2 text-sm font-bold text-gray-700">
            Room ID
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            placeholder="Enter alphanumeric ID"
            value={matchID}
            onChange={(e) => setMatchID(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
          />
        </div>
        <button
          className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline disabled:opacity-50"
          onClick={handleJoin}
          disabled={loading || !matchID}
        >
          {loading ? 'Connecting...' : 'Start Game'}
        </button>
        {error && <p className="mt-4 text-sm text-center text-red-500">{error}</p>}
      </div>
    </div>
  );
};
