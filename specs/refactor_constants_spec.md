# 定数リファクタリング仕様書

## 目的
コードベース全体に散在するハードコーディングされた値（マジックナンバー、文字列リテラル）を名前付き定数に置き換えることで、保守性と可読性を向上させ、エラーのリスクを低減する。

## 分析
以下のファイルでハードコーディングされた値が見つかりました：
- `src/Game.js`: ゲーム設定（デッキ生成、手札枚数、フラッグ数）。
- `src/moves.js`: ゲームロジック（場所、スロットタイプ、プレイヤーID、ルール上の制限値）。
- `src/constants/tactics.js`: 戦術カードのキーとカテゴリ文字列。
- `src/board/`: UIコンポーネント（プレイヤーID、スタイルキー、レンダリングロジック）。
- `src/types/index.ts`: 型定義（これらの定数と整合させる必要がある）。

## 実装計画

### 1. `src/constants.js` の作成
このファイルをゲーム定数の一元的な情報源とします。
(TypeScript環境ですが、サーバーサイドとの互換性のため `.js` とし、JSDocで型注釈を付与しました)

```javascript
export const PLAYER_IDS = {
  P0: '0',
  P1: '1',
};

export const CARD_TYPES = {
  TROOP: 'troop',
  TACTIC: 'tactic',
};

export const DECK_TYPES = {
  TROOP: 'troop',
  TACTIC: 'tactic',
};

export const COLORS = {
  RED: 'red',
  ORANGE: 'orange',
  YELLOW: 'yellow',
  GREEN: 'green',
  BLUE: 'blue',
  PURPLE: 'purple',
};

export const TROOP_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const AREAS = {
  HAND: 'hand',
  BOARD: 'board',
  DECK: 'deck',
  DISCARD: 'discard',
  FIELD: 'field',
};

export const SLOTS = {
  P0: 'p0_slots',
  P1: 'p1_slots',
  P0_TACTIC: 'p0_tactic_slots',
  P1_TACTIC: 'p1_tactic_slots',
};

export const GAME_CONFIG = {
  HAND_SIZE: 7,
  FLAG_COUNT: 9,
  SCOUT_DRAW_LIMIT: 3,
  MUD_CARD_REQUIREMENT: 4,
};

export const TACTIC_IDS = {
  ALEXANDER: 'Alexander',
  DARIUS: 'Darius',
  COMPANION: 'Companion',
  SHIELDBEARER: 'ShieldBearer',
  FOG: 'Fog',
  MUD: 'Mud',
  SCOUT: 'Scout',
  REDEPLOY: 'Redeploy',
  DESERTER: 'Deserter',
  TRAITOR: 'Traitor',
};

export const TACTIC_CATEGORIES = {
  MORALE: '士気高揚戦術',
  ENVIRONMENT: '地形戦術',
  GUILE: '謀略戦術',
};
```

### 2. `src/constants/tactics.js` のリファクタリング
- `TACTIC_IDS` と `TACTIC_CATEGORIES` をインポートする。
- `TACTICS_DATA` のキーと値をこれらの定数を使用するように更新する。

### 3. `src/Game.js` のリファクタリング
- 定数をインポートする。
- 色の配列を `Object.values(COLORS)` に置き換える。
- `createTroopDeck` のロジックを定数を使用するように置き換える。
- `createTacticDeck` のロジックを `TACTIC_IDS` を使用するように置き換える。
- `setup` 内のマジックナンバー（7, 9）を置き換える。

### 4. `src/moves.js` のリファクタリング
- 定数をインポートする。
- 文字列リテラル `'hand'`, `'board'` などを `AREAS.*` に置き換える。
- スロット文字列を `SLOTS.*` に置き換える。
- プレイヤーIDを `PLAYER_IDS.*` に置き換える。
- `'Scout'` などを `TACTIC_IDS.*` に置き換える。
- `3` を `GAME_CONFIG.SCOUT_DRAW_LIMIT` に置き換える。

### 5. `src/board/*.tsx` のリファクタリング
- ハードコーディングされたロジック判定（例: `id === '0'`）を定数に置き換える。
- `Card.tsx` を更新し、`COLORS` を使用してマッピングを行う（マップキーが定数値と一致することを確認）。
- `Board.tsx` のレンダリングロジックを更新する。

## 検証
- `npm run build` (または `tsc`) を実行し、型エラーがないか確認する。
- ゲームフローを手動で確認し、ロジック（特に文字列比較）が壊れていないか確認する。