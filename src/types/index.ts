export type CardType = 'troop' | 'tactic';

export interface Card {
  id: string;        // 一意なID (例: "troop-red-1", "tactic-alexander")
  type: CardType;
  // 部隊カード用
  color?: string;    // 'red', 'orange', 'yellow', 'green', 'blue', 'purple'
  value?: number;    // 1-10
  // 戦術カード用
  name?: string;     // カード名 (例: 'Alexander', 'Fog')
  
  faceDown?: boolean; // 裏向き表示フラグ
}

export interface FlagState {
  id: string;        // "flag-0" ~ "flag-8"
  owner: '0' | '1' | null; // 確保したプレイヤー。nullは未確保
  p0_slots: Card[];  // Player 0 が配置したカード
  p1_slots: Card[];  // Player 1 が配置したカード
  tactic_zone: Card[]; // 地形戦術カード（霧、泥沼）
}

export interface PlayerState {
  hand: Card[];
}

export interface GameState {
  // 隠匿情報（boardgame.io の playerView でマスクされることを想定）
  players: {
    [playerID: string]: PlayerState;
  };
  troopDeck: Card[];
  tacticDeck: Card[];
  discardPile: Card[];
  
  // 公開情報
  flags: FlagState[];
  
  // ゲーム進行用フラグ（必要に応じて追加）
  isGameEnded?: boolean;
}

export type LocationInfo = {
  area: 'hand' | 'board' | 'deck' | 'discard';
  playerId?: string; // 'hand'の場合のみ
  flagIndex?: number;   // 'board'の場合のみ (0-8)
  slotType?: 'p0_slots' | 'p1_slots' | 'tactic_zone'; // 'board'かつ'flagIndex'がある場合
  deckType?: 'troop' | 'tactic'; // 'deck'の場合
};
