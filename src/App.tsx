import { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { BattleLine } from './Game';
import { BattleLineBoard } from './board/Board';
import { Lobby } from './Lobby';
import { getServerUrl } from './utils';
import type { GameState } from './types';

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

const App = ({ playerID: initialPlayerID, matchID: initialMatchID }: AppProps = {}) => {
  const [matchID, setMatchID] = useState<string | null>(initialMatchID || null);
  const [playerID, setPlayerID] = useState<string | null>(initialPlayerID || null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<string | undefined>(undefined);

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
    />
  );
};

export default App;