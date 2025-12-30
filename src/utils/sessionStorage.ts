const STORAGE_KEYS = {
  MATCH_ID: 'battleline_matchID',
  PLAYER_ID: 'battleline_playerID',
  PLAYER_NAME: 'battleline_playerName',
  CREDENTIALS: 'battleline_credentials',
};

export interface SessionData {
  matchID: string;
  playerID: string;
  playerName: string;
  credentials?: string;
}

export function saveSession(data: SessionData): void {
  localStorage.setItem(STORAGE_KEYS.MATCH_ID, data.matchID);
  localStorage.setItem(STORAGE_KEYS.PLAYER_ID, data.playerID);
  localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, data.playerName);
  if (data.credentials) {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, data.credentials);
  }
}

export function loadSession(): SessionData | null {
  const matchID = localStorage.getItem(STORAGE_KEYS.MATCH_ID);
  const playerID = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
  const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
  const credentials = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);

  if (matchID && playerID && playerName) {
    return { matchID, playerID, playerName, credentials: credentials || undefined };
  }
  return null;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.MATCH_ID);
  localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
  localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
  localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
}
