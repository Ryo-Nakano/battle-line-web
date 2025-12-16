# Step 2: データ構造の定義とゲーム初期化 (Game State)

## 目的
`boardgame.io` で管理するゲームの状態（State）の構造を決定し、ゲーム開始時の初期状態を生成するセットアップ関数を実装する。これにより、UIコンポーネントが参照すべきデータの型が明確になり、ゲームロジックの実装基盤が整う。

## 作業内容

### 1. 型定義の作成 (`src/types/index.ts`)
`src/types/index.ts` を更新し、以下のインターフェースを定義する。
これはUIコンポーネント（TypeScript）とゲームロジック（JavaScript）間の契約となる。

*   **Card**: カード情報を表現する型
*   **FlagState**: 9つのフラッグ（戦術地点）の状態
*   **PlayerState**: プレイヤーごとの状態（手札など）
*   **GameState**: `boardgame.io` の `G` オブジェクトの構造

```typescript
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
```

### 2. ゲーム初期化ロジックの実装 (`src/Game.js`)
`src/Game.js` を更新し、`setup` 関数を実装する。

*   **カード生成ヘルパー**:
    *   部隊カード: 6色 × 数字1-10 = 60枚
    *   戦術カード: 10枚（仕様書に基づき定義、当面はプレースホルダー名でも可）
*   **Setup関数**:
    1.  部隊カードデッキ、戦術カードデッキを生成し、シャッフルする。
    2.  各プレイヤー（'0', '1'）に部隊カードを7枚ずつ配る。
    3.  9つのフラッグを初期化する（スロットは空、所有者はnull）。
    4.  捨て札置き場を空で初期化する。

**`src/Game.js` の構成案**:
```javascript
import { INVALID_MOVE } from 'boardgame.io/core';

// カード生成関数（内部利用）
const createTroopDeck = () => {
  const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
  const deck = [];
  colors.forEach(color => {
    for (let i = 1; i <= 10; i++) {
      deck.push({
        id: `troop-${color}-${i}`,
        type: 'troop',
        color: color,
        value: i,
        faceDown: false
      });
    }
  });
  return deck;
};

const createTacticDeck = () => {
  const tactics = [
    'Alexander', 'Darius', 'Companion', 'ShieldBearer', // Leaders
    'Fog', 'Mud', // Environment
    'Scout', 'Redeploy', 'Deserter', 'Traitor' // Guile
  ];
  return tactics.map(name => ({
    id: `tactic-${name.toLowerCase()}`,
    type: 'tactic',
    name: name,
    faceDown: false
  }));
};

export const BattleLine = {
  name: 'battle-line',
  
  setup: ({ random }) => {
    const troopDeck = random.Shuffle(createTroopDeck());
    const tacticDeck = random.Shuffle(createTacticDeck());
    
    const players = {
      '0': { hand: troopDeck.splice(0, 7) },
      '1': { hand: troopDeck.splice(0, 7) }
    };
    
    const flags = Array(9).fill(null).map((_, i) => ({
      id: `flag-${i}`,
      owner: null,
      p0_slots: [],
      p1_slots: [],
      tactic_zone: []
    }));

    return {
      players,
      troopDeck,
      tacticDeck,
      discardPile: [],
      flags,
    };
  },

  moves: {
    // Step 3で実装するため、一旦空または既存のものを残す
    playCard: ({ G, ctx }, cardId) => {
        // 仮の実装
    }
  },

  // ターン設定などはデフォルトでOK
};
```

## 完了定義
1.  `src/types/index.ts` に上記型定義が含まれていること。
2.  `src/Game.js` が更新され、`setup` 関数が正しく初期状態（G）を返すこと。
3.  アプリケーション起動時、ブラウザのコンソール等で（あるいはReact DevToolsで）初期Stateが正しく生成されていることが確認できること。
