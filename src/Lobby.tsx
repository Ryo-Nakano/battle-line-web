import React, { useState, useEffect } from 'react';
import { getServerUrl } from './utils';
import { saveSession } from './utils/sessionStorage';
import { Sword, Users, Lock, Plus, RefreshCw, Search, X } from 'lucide-react';

interface LobbyProps {
  onJoin: (matchID: string, playerID: string, playerName: string, credentials?: string) => void;
}

interface Room {
  matchID: string;
  players: { id: number; name?: string; isConnected?: boolean }[];
  setupData?: {
    roomName?: string;
    isPrivate?: boolean;
  };
  gameName: string;
  createdAt: number;
}

const validateInput = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 8);
};

const validateRoomId = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
};

export const Lobby: React.FC<LobbyProps> = ({ onJoin }) => {
  // ... (state remains the same)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinByIdModalOpen, setIsJoinByIdModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // ... (fetchRooms remains the same)
  const fetchRooms = async () => {
    try {
      const serverUrl = getServerUrl();
      const res = await fetch(`${serverUrl}/games/battle-line`);
      if (res.ok) {
        const data = await res.json();
        setRooms(data.matches || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleJoin = (matchID: string, playerID: string, playerName: string, credentials?: string) => {
    onJoin(matchID, playerID, playerName, credentials);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans select-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black relative overflow-hidden flex flex-col items-center p-4 sm:p-8">
      {/* ... (Header and Room List UI remains the same, skipping unchanged parts for brevity if possible, but replace_file_content needs exact match. I will assume the user wants me to replace the whole file or chunks. I'll replace the modals and the interface definition.) */}
      {/* Background Grid Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      <div className="w-full max-w-5xl z-10">
        {/* Header - レスポンシブ対応 */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 sm:mb-8 border-b border-zinc-800 pb-4 sm:pb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-amber-600/20 p-3 rounded-xl border border-amber-600/30">
              <Sword className="text-amber-500" size={32} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-zinc-100 flex items-center gap-2 sm:gap-3">
                Battle Line <span className="text-amber-600">Online</span>
              </h1>
              <p className="text-zinc-500 mt-1 font-medium tracking-wide text-sm sm:text-base">Select a room to join the battle.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsJoinByIdModalOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-3 rounded-lg border border-zinc-700 transition-all font-bold text-sm flex items-center gap-2"
            >
              <Search size={16} />
              Join by ID
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg shadow-lg shadow-amber-900/20 transition-all font-bold text-sm flex items-center gap-2 transform active:scale-95"
            >
              <Plus size={18} />
              Create Room
            </button>
          </div>
        </header>

        {/* Room List - 横スクロール対応 */}
        <div className="bg-zinc-900/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-x-auto border border-zinc-700/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/40 text-zinc-500 text-xs border-b border-zinc-800">
                <th className="p-5 font-bold w-24 text-center">ID</th>
                <th className="p-5 font-bold">Room Name</th>
                <th className="p-5 font-bold">Host</th>
                <th className="p-5 font-bold w-32">Members</th>
                <th className="p-5 font-bold w-32">Status</th>
                <th className="p-5 font-bold w-32 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-zinc-500 italic">
                    No active rooms found. Create one to start playing!
                  </td>
                </tr>
              ) : (
                rooms.map((room) => {
                  const players = room.players || [];
                  const memberCount = room.players.filter(p => p.name || p.isConnected).length;
                  const maxPlayers = 2; // Hardcoded for Battle Line
                  const isFull = memberCount >= maxPlayers;
                  // Simple status logic
                  let status = 'Open';
                  if (isFull) status = 'Full';
                  // If we had gameover state in metadata, we could check 'Playing' vs 'Finished'

                  const hostName = players[0]?.name || 'Unknown';
                  const roomName = room.setupData?.roomName || `Room ${room.matchID.slice(0, 4)}`;

                  return (
                    <tr key={room.matchID} className="hover:bg-zinc-800/50 transition-colors group">
                      <td className="p-5 text-center text-zinc-600 font-mono text-xs">
                        {room.matchID.slice(0, 8)}
                      </td>
                      <td className="p-5 font-bold text-zinc-200">
                        {roomName}
                      </td>
                      <td className="p-5 text-zinc-400 text-sm">
                        {hostName}
                      </td>
                      <td className="p-5 text-sm">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Users size={14} />
                          {memberCount}/{maxPlayers}
                        </div>
                      </td>
                      <td className="p-5">
                        <StatusBadge status={status} />
                      </td>
                      <td className="p-5 text-center">
                        <JoinButton
                          onJoin={() => setSelectedRoom(room)}
                          disabled={isFull}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-between text-xs text-zinc-600 font-medium">
          <div className="flex gap-4">
            <span>Total Rooms: {rooms.length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</span>
          </div>
          <button onClick={fetchRooms} className="flex items-center gap-1 hover:text-zinc-400 transition-colors">
            <RefreshCw size={12} /> Refresh List
          </button>
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateRoomModal
          onClose={() => setIsCreateModalOpen(false)}
          onJoin={handleJoin}
        />
      )}
      {isJoinByIdModalOpen && (
        <JoinByIdModal
          onClose={() => setIsJoinByIdModalOpen(false)}
          onJoin={handleJoin}
        />
      )}
      {selectedRoom && (
        <JoinRoomModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onJoin={handleJoin}
        />
      )}
    </div>
  );
};

// --- Sub Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Open: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    Full: "text-red-400 bg-red-500/10 border-red-500/20",
    Playing: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };

  const currentStyle = styles[status] || styles.Open;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold border ${currentStyle}`}>
      {status === 'Full' && <Lock size={10} />}
      {status}
    </span>
  );
};

const JoinButton = ({ onJoin, disabled }: { onJoin: () => void, disabled: boolean }) => {

  return (
    <button
      disabled={disabled}
      onClick={onJoin}
      className={`px-4 py-1.5 text-xs font-bold rounded border transition-all ${disabled
        ? 'border-transparent text-zinc-600 cursor-not-allowed bg-zinc-800/50'
        : 'border-amber-600 text-amber-500 hover:bg-amber-600 hover:text-white shadow-lg shadow-amber-900/10'
        }`}
    >
      {'Join'}
    </button>
  );
};

const CreateRoomModal = ({ onClose, onJoin }: { onClose: () => void, onJoin: any }) => {
  const [roomName, setRoomName] = useState(() => `R${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
  const [playerName, setPlayerName] = useState(() => `U${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!roomName || !playerName) return;
    setLoading(true);
    setError('');

    const serverUrl = getServerUrl();
    const gameName = 'battle-line';

    try {
      // 1. Create Room
      const createRes = await fetch(`${serverUrl}/games/${gameName}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numPlayers: 2,
          unlisted: isPrivate,
          setupData: {
            roomName: roomName,
            isPrivate: isPrivate
          }
        }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json();
        throw new Error(errData.error || 'Failed to create room');
      }

      const createData = await createRes.json();
      const matchID = createData.matchID;

      // 2. Join Room to get credentials
      const joinRes = await fetch(`${serverUrl}/games/${gameName}/${matchID}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerID: '0',
          playerName: playerName,
        }),
      });

      if (!joinRes.ok) {
        const errData = await joinRes.json();
        throw new Error(errData.error || 'Failed to join room');
      }

      const joinData = await joinRes.json();
      saveSession({
        matchID,
        playerID: '0',
        playerName,
        credentials: joinData.playerCredentials,
      });
      onJoin(matchID, '0', playerName, joinData.playerCredentials);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-1rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="text-amber-500" /> Create Room
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2">Room Name</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
              placeholder="e.g. Room1234"
              value={roomName}
              onChange={(e) => setRoomName(validateInput(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2">Your Name</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
              placeholder="Enter your nickname"
              value={playerName}
              onChange={(e) => setPlayerName(validateInput(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2">Visibility</label>
            <div className="flex gap-4">
              <button
                onClick={() => setIsPrivate(false)}
                className={`flex-1 py-3 rounded-lg border font-bold text-sm transition-all ${!isPrivate ? 'bg-amber-600/20 border-amber-600 text-amber-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
              >
                Public
              </button>
              <button
                onClick={() => setIsPrivate(true)}
                className={`flex-1 py-3 rounded-lg border font-bold text-sm transition-all ${isPrivate ? 'bg-amber-600/20 border-amber-600 text-amber-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'}`}
              >
                Private
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {isPrivate ? "Room will be hidden from the list. Share the Room ID to invite players." : "Room will be visible to everyone in the lobby."}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-black/20">
          <button
            onClick={handleCreate}
            disabled={!roomName || !playerName || loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95"
          >
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

const JoinByIdModal = ({ onClose, onJoin }: { onClose: () => void, onJoin: any }) => {
  const [matchID, setMatchID] = useState('');
  const [playerName, setPlayerName] = useState(() => `U${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!matchID || !playerName) return;
    setLoading(true);
    setError('');

    const serverUrl = getServerUrl();
    const gameName = 'battle-line';

    try {
      // Check availability first (optional, but good for UX before trying to join)
      const res = await fetch(`${serverUrl}/games/${gameName}/${matchID}`);
      if (!res.ok) {
        throw new Error('Room not found');
      }
      const data = await res.json();

      const p0Taken = data.players.some((p: any) => p.id === 0 && (p.name || p.isConnected));
      const p1Taken = data.players.some((p: any) => p.id === 1 && (p.name || p.isConnected));

      if (p0Taken && p1Taken) {
        throw new Error('Room is full');
      }

      const playerID = p0Taken ? '1' : '0';

      // Join Room
      const joinRes = await fetch(`${serverUrl}/games/${gameName}/${matchID}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerID: playerID,
          playerName: playerName,
        }),
      });

      if (!joinRes.ok) {
        const errData = await joinRes.json();
        throw new Error(errData.error || 'Failed to join room');
      }

      const joinData = await joinRes.json();
      saveSession({
        matchID,
        playerID,
        playerName,
        credentials: joinData.playerCredentials,
      });
      onJoin(matchID, playerID, playerName, joinData.playerCredentials);

    } catch (err: any) {
      setError(err.message || 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-1rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="text-zinc-400" /> Join by ID
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2">Room ID</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
              placeholder="Enter Room ID"
              value={matchID}
              onChange={(e) => setMatchID(validateRoomId(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2">Your Name</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
              placeholder="Enter your nickname"
              value={playerName}
              onChange={(e) => setPlayerName(validateInput(e.target.value))}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-black/20">
          <button
            onClick={handleJoin}
            disabled={!matchID || !playerName || loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95"
          >
            {loading ? 'Connecting...' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

const JoinRoomModal = ({ room, onClose, onJoin }: { room: Room, onClose: () => void, onJoin: any }) => {
  const [playerName, setPlayerName] = useState(() => `U${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!playerName) return;
    setLoading(true);
    setError('');

    const serverUrl = getServerUrl();
    const gameName = 'battle-line';

    try {
      // Determine which seat is open
      const p0Taken = room.players.some(p => p.id === 0 && (p.name || p.isConnected));
      const playerID = p0Taken ? '1' : '0';

      // Join Room
      const joinRes = await fetch(`${serverUrl}/games/${gameName}/${room.matchID}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerID: playerID,
          playerName: playerName,
        }),
      });

      if (!joinRes.ok) {
        const errData = await joinRes.json();
        throw new Error(errData.error || 'Failed to join room');
      }

      const joinData = await joinRes.json();
      saveSession({
        matchID: room.matchID,
        playerID,
        playerName,
        credentials: joinData.playerCredentials,
      });
      onJoin(room.matchID, playerID, playerName, joinData.playerCredentials);

    } catch (err: any) {
      setError(err.message || 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-1rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="text-amber-500" /> Join Room
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2">Room ID</label>
            <input
              type="text"
              readOnly
              className="w-full bg-black/20 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-400 outline-none cursor-not-allowed"
              value={room.matchID}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-2">Your Name</label>
            <input
              type="text"
              className="w-full bg-black/40 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-amber-500 outline-none transition-colors"
              placeholder="Enter your nickname"
              value={playerName}
              onChange={(e) => setPlayerName(validateInput(e.target.value))}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-black/20">
          <button
            onClick={handleJoin}
            disabled={!playerName || loading}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all transform active:scale-95"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </div>
      </div>
    </div>
  );
};
