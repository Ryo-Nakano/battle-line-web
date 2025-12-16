# Step 3: 操作ロジックの実装 (Moves)

## 目的
ユーザーのインタラクション（ドラッグ＆ドロップ、クリック）によってトリガーされるゲーム状態の更新ロジック（Moves）を `src/moves.js` に実装し、`src/Game.js` に統合する。
これにより、カードのドロー、配置、移動、フラッグ確保といったゲームの基本操作が可能になる。

## 作業内容

### 1. ロジックの実装 (`src/moves.js`)

`src/moves.js` を新規作成し、以下の関数をエクスポートする。
各関数は `boardgame.io` の Move 関数シグネチャ `( { G, ctx }, ...args )` に従う。

#### 1.1 `drawCard`
*   **引数**: `deckType` ('troop' | 'tactic')
*   **処理**:
    1.  指定されたデッキ (`G.troopDeck` または `G.tacticDeck`) が空でないか確認。
    2.  デッキの末尾からカードを1枚取得（`pop`）。
    3.  現在のプレイヤーの手札 (`G.players[ctx.currentPlayer].hand`) に追加（`push`）。

#### 1.2 `moveCard`
*   **引数**: `payload`
    ```typescript
    {
      cardId: string;
      from: LocationInfo;
      to: LocationInfo;
    }
    ```
*   **LocationInfo 型定義 (概念)**:
    ```typescript
    type LocationInfo = {
      area: 'hand' | 'board' | 'deck' | 'discard';
      playerId?: string;      // 'hand' の場合
      flagIndex?: number;     // 'board' の場合 (0-8)
      slotType?: 'p0_slots' | 'p1_slots' | 'tactic_zone'; // 'board' の場合
      deckType?: 'troop' | 'tactic'; // 'deck' の場合
    };
    ```
*   **処理**:
    1.  **移動元 (`from`) からカードを取得・削除**:
        *   `from.area` に基づき、対象の配列（手札、ボードのスロット、山札、捨て札）を特定。
        *   配列から `cardId` に一致するカードを探し、削除する（`splice`）。
        *   ※取得したカードオブジェクトを保持。
    2.  **移動先 (`to`) へカードを追加**:
        *   `to.area` に基づき、対象の配列を特定。
        *   配列の末尾（または任意の位置、今回は順序維持のため末尾で良いが、必要ならindex対応）に追加（`push`）。
    3.  **バリデーション (簡易)**:
        *   移動元にカードが存在しない場合はエラーまたは無視。
        *   移動先が不正な場合（例: `board` なのに `flagIndex` がない）は無視。

#### 1.3 `claimFlag`
*   **引数**: `flagIndex` (number)
*   **処理**:
    1.  `G.flags[flagIndex]` を取得。
    2.  `owner` をトグルする:
        *   `null` -> `ctx.currentPlayer`
        *   `ctx.currentPlayer` -> `null` (キャンセル用)
        *   他のプレイヤーが所有している場合は上書き（デバッグ・自由操作用として許可）

#### 1.4 `shuffleDeck`
*   **引数**: `deckType` ('troop' | 'tactic')
*   **処理**:
    1.  指定されたデッキ (`G.troopDeck` または `G.tacticDeck`) をシャッフルする。
    2.  `ctx.random` が利用可能な場合は `ctx.random.Shuffle` を使用する。もし `moves` 内で `ctx.random` が直接使えない設定の場合は、`boardgame.io/core` の `Random` ヘルパーを使用するか、単純な Fisher-Yates シャッフルを実装する。
    *   ※本プロジェクトでは `boardgame.io` の標準設定に従い、`G` を直接操作する形で実装する。

### 2. ゲームへの統合 (`src/Game.js`)

`src/Game.js` を修正し、作成した `moves` を読み込む。

```javascript
import { drawCard, moveCard, claimFlag, shuffleDeck } from './moves';

export const BattleLine = {
  // ... existing setup ...
  moves: {
    drawCard,
    moveCard,
    claimFlag,
    shuffleDeck
  }
};
```

## 完了定義
1.  `src/moves.js` が作成され、上記4つの関数が実装されていること。
2.  `src/Game.js` が更新され、`moves` プロパティが設定されていること。
3.  手動テスト（または簡易テストスクリプト）により、以下の動作が確認できること:
    *   ドロー操作で手札が増え、山札が減る。
    *   `moveCard` により、手札からボードへ、ボード間でカードが移動する。
    *   フラッグの所有者が切り替わる。
