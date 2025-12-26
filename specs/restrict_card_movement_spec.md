# カード移動制限仕様

## 概要
前のターン以前にプレイされたカードの移動を禁止し、そのターンにプレイしたカードのみ移動可能とする。
これにより、過去の配置を誤って変更することを防ぐ。

---

## 定義

### 「場に出す」とは
以下のいずれかの移動が成功した時点で「カードを場に出した」とみなす。

| # | 移動元 | 移動先 | 対象カード例 |
|---|--------|--------|--------------|
| 1 | 手札 | 部隊スロット (`p0_slots`/`p1_slots`) | 部隊カード, 士気高揚戦術 |
| 2 | 手札 | 戦術スロット (`p0_tactic`/`p1_tactic`) | 地形戦術 (Fog, Mud) |
| 3 | 手札 | 謀略フィールド (`field`) | 謀略戦術 (Scout, Redeploy, Deserter, Traitor) |

---

## 要件

### 1. 過去のカードの移動禁止
*   前のターン以前に場に出されたカードは、**通常操作では**選択および移動ができない。
*   クリックしても反応しない（ハイライトされない、アクティブ状態にならない）。

### 2. 当ターンのカード移動許可
*   そのターンに手札から場に出したカードは、ターン終了まで自由に移動可能とする。
*   別のライン（スロット）への移動も許可する。

### 3. 謀略戦術による例外
以下の謀略戦術発動中は、過去のカードも対象として選択・操作可能。

| 戦術カード | 対象 | 操作内容 |
|------------|------|----------|
| 配置転換 (Redeploy) | **自分**の過去カード | 別スロットへ移動 or 捨て札 |
| 脱走 (Deserter) | **相手**のカード | 捨て札 |
| 裏切り (Traitor) | **相手**の部隊カード | 自分のスロットへ移動 |

### 4. UI挙動

#### 過去のカード
*   クリックしても何も起きない（謀略戦術発動中は除く）。
*   視覚的な変化（グレーアウト等）は**行わない**（見た目は通常通り）。

#### 当ターンのカード
*   クリックで選択可能（ハイライト表示）。
*   別の空きスロットをクリックして移動可能。

### 5. 制限対象外の操作
以下は `cardsPlayedThisTurn` の状態に関わらず常に実行可能。

| 操作 | 備考 |
|------|------|
| フラッグ確保 (`claimFlag`) | いつでも可能 |
| 手札ソート (`sortHand`) | いつでも可能 |
| カード情報表示 | いつでも可能 |
| 捨て札/山札の確認 | いつでも可能 |

---

## 配置転換 (Redeploy) の実装仕様

### 現状の問題
`moves.js` の339-344行目では、裏切り・脱走の場合のみ `activeGuileTactic` を設定している。
配置転換は含まれていないため、発動後に通常のカード移動制限が適用されてしまう。

### 対応内容

#### 1. `moveCard` での `activeGuileTactic` 設定
配置転換カードが謀略フィールドに移動した時点で、`activeGuileTactic` を設定する。

```javascript
// moves.js 338-344行目を以下に変更
if (card.name === TACTIC_IDS.TRAITOR || card.name === TACTIC_IDS.DESERTER || card.name === TACTIC_IDS.REDEPLOY) {
  G.activeGuileTactic = {
    type: card.name,
    cardId: card.id
  };
}
```

#### 2. 配置転換の効果処理
配置転換発動中の挙動:
*   **自分の盤面カード**（部隊スロット・戦術スロット）を選択可能にする。
*   選択したカードを以下のいずれかに移動可能:
    *   別の空きスロット（`board -> board`）
    *   捨て札（`board -> discard`）
*   移動が完了したら `activeGuileTactic` をクリアする。

#### 3. `resolveRedeploy` 関数の追加（オプション）
脱走・裏切りと同様に専用関数を作成する場合:

```javascript
export const resolveRedeploy = ({ G, ctx }, { cardId, fromLocation, toLocation }) => {
  if (!G.activeGuileTactic || G.activeGuileTactic.type !== TACTIC_IDS.REDEPLOY) return INVALID_MOVE;

  const playerID = ctx.currentPlayer;
  const sourceList = resolveLocation(G, ctx, fromLocation);
  if (!sourceList) return INVALID_MOVE;

  const cardIndex = sourceList.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return INVALID_MOVE;

  // フラッグ確保済みチェック
  const flag = G.flags[fromLocation.flagIndex];
  if (flag.owner !== null) return INVALID_MOVE;

  // 自分のスロットか確認
  const isMySlot = (playerID === PLAYER_IDS.P0 && (fromLocation.slotType === SLOTS.P0 || fromLocation.slotType === SLOTS.P0_TACTIC)) ||
    (playerID === PLAYER_IDS.P1 && (fromLocation.slotType === SLOTS.P1 || fromLocation.slotType === SLOTS.P1_TACTIC));
  if (!isMySlot) return INVALID_MOVE;

  const card = sourceList.splice(cardIndex, 1)[0];

  // 移動先の処理
  if (toLocation.area === AREAS.DISCARD) {
    // 捨て札へ
    if (card.type === CARD_TYPES.TROOP) {
      G.troopDiscard.push(card);
    } else {
      G.tacticDiscard.push(card);
    }
  } else if (toLocation.area === AREAS.BOARD) {
    // 別スロットへ
    const destList = resolveLocation(G, ctx, toLocation);
    if (!destList) return INVALID_MOVE;
    const destFlag = G.flags[toLocation.flagIndex];
    if (destFlag.owner !== null) return INVALID_MOVE;
    destList.push(card);
  } else {
    return INVALID_MOVE;
  }

  // 状態クリア
  G.activeGuileTactic = null;
};
```

#### 4. UIでの配置転換ガイド表示
*   `activeGuileTactic?.type === TACTIC_IDS.REDEPLOY` の場合、ガイドメッセージを表示:
    *   「REDEPLOY: Select your card to move or discard」

---

## 実装詳細

### 1. データ構造

#### `src/Game.js`
*   `setup()` 内の初期 `G` に追加:
    ```javascript
    cardsPlayedThisTurn: [],
    ```

#### `src/types/index.ts`
*   `GameState` に追加:
    ```typescript
    cardsPlayedThisTurn: string[];
    ```

### 2. ロジック (`src/moves.js`)

#### `moveCard` の変更

**A. カードIDの記録（`hand -> board` / `hand -> field`）:**
```javascript
if (from.area === AREAS.HAND && (to.area === AREAS.BOARD || to.area === AREAS.FIELD)) {
  G.cardsPlayedThisTurn.push(cardId);
}
```

**B. 過去カードの移動禁止（`board -> board`）:**
```javascript
if (from.area === AREAS.BOARD && to.area === AREAS.BOARD) {
  if (!G.activeGuileTactic) {
    if (!G.cardsPlayedThisTurn.includes(cardId)) {
      console.warn('Cannot move card played in previous turn.');
      return INVALID_MOVE;
    }
  }
}
```

**C. 配置転換の `activeGuileTactic` 設定:**
```javascript
if (card.name === TACTIC_IDS.TRAITOR || card.name === TACTIC_IDS.DESERTER || card.name === TACTIC_IDS.REDEPLOY) {
  G.activeGuileTactic = {
    type: card.name,
    cardId: card.id
  };
}
```

#### `endTurn` / `drawAndEndTurn` の変更
```javascript
G.cardsPlayedThisTurn = [];
```

### 3. UI (`src/board/MobileBoard.tsx`, `src/board/Board.tsx`)

#### `handleCardClick` の変更
```typescript
if (location.area === AREAS.BOARD && location.playerId === myID) {
  if (!activeGuileTactic) {
    if (!G.cardsPlayedThisTurn.includes(card.id)) {
      return;
    }
  }
}
```

#### 配置転換ガイドメッセージの追加
```tsx
{activeGuileTactic?.type === TACTIC_IDS.REDEPLOY && "REDEPLOY: Select your card to move or discard"}
```

---

## エッジケース

| # | シナリオ | 期待動作 |
|---|----------|----------|
| 1 | スカウト発動後、スカウトカード自体を移動しようとする | 謀略フィールドにあるため移動対象外 |
| 2 | 地形戦術を当ターンに配置後、別スロットへ移動 | 移動可能 |
| 3 | 配置転換を発動し、過去の部隊カードを移動 | 移動可能 |
| 4 | 配置転換を発動し、当ターンのカードを移動 | 移動可能 |
| 5 | 配置転換を発動し、過去のカードを捨て札へ | 捨て札に行く |
| 6 | 配置転換発動中、相手のカードを選択 | 選択不可 |
| 7 | フラッグ確保済みスロットのカードを配置転換で選択 | 選択不可 |

---

## 検証項目

| # | シナリオ | 期待結果 |
|---|----------|----------|
| 1 | 部隊カードをプレイ後、そのカードをクリック | 選択可能、別スロットへ移動可能 |
| 2 | 部隊カードをプレイ後、ターン終了 → 次ターンでクリック | 反応しない |
| 3 | 地形戦術をプレイ後、そのカードをクリック | 選択可能 |
| 4 | 地形戦術をプレイ後、ターン終了 → 次ターンでクリック | 反応しない |
| 5 | 配置転換を発動、過去のカードを選択 | 選択可能 |
| 6 | 配置転換を発動、過去のカードを別スロットへ移動 | 移動可能 |
| 7 | 配置転換を発動、過去のカードを捨て札へ | 捨て札に行く |
| 8 | 配置転換を発動、相手のカードを選択しようとする | 反応しない |
| 9 | 脱走を発動、相手の過去カードを選択 | 選択可能 |
| 10 | 裏切りを発動、相手の過去部隊カードを選択 | 選択可能 |
| 11 | 配置転換発動後、ガイドメッセージが表示される | 表示される |
