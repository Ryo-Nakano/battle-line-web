# カードプレイ制限と手札回収の廃止仕様

## 概要
1ターンにプレイできるカードを1枚のみに制限し、カードプレイ後は手札からの新たなカード選択を不可にする。
また、「盤面から手札へのカード回収（Undo）」を完全に廃止する。盤面のカードへの干渉は、謀略戦術（配置転換/脱走/裏切り）を使用した場合のみ可能とする。

---

## 定義

### 「カードをプレイする」とは
以下のいずれかの移動が成功した時点で「カードを1枚プレイした」とみなす。

| # | 移動元 | 移動先 | 対象カード例 |
|---|--------|--------|--------------|
| 1 | 手札 | 部隊スロット (`p0_slots`/`p1_slots`) | 部隊カード, 士気高揚戦術 (Alexander, Darius, Companion, ShieldBearer) |
| 2 | 手札 | 戦術スロット (`p0_tactic`/`p1_tactic`) | 地形戦術 (Fog, Mud) |
| 3 | 手札 | 謀略フィールド (`field`) | 謀略戦術 (Scout, Redeploy, Deserter, Traitor) |

---

## 要件

### 1. 1ターン1枚制限
*   プレイヤーは自分のターンに、上記「カードをプレイする」操作を**1回**しかできない。
*   カードを1枚プレイした時点で、そのターンの「カードプレイ権」を消費したとみなす。
*   **謀略戦術の効果処理**: 謀略戦術の発動自体が「1枚のプレイ」となる。その後の効果処理（スカウトの3枚引いて2枚戻す、裏切り/脱走のカード選択等）は「プレイ」ではなく「効果処理」として継続可能。

### 2. 盤面から手札への回収（Undo）の完全廃止
*   **`board -> hand` および `field -> hand` の移動は一切禁止する。**
*   例外は存在しない。どの戦術カードにもこの移動を許可するものはない。
*   **謀略戦術キャンセル機能 (`cancelGuileTactic`) も廃止する。** 一度カードをプレイしたら取り消し不可。

### 3. 謀略戦術による盤面への干渉
以下の謀略戦術を発動した場合に限り、盤面のカードに干渉できる。

| 戦術カード | 効果 | 許可される操作 |
|------------|------|----------------|
| 配置転換 (Redeploy) | 自分のカード（未確保フラッグ上）を1枚選び、別のスロットに移動するか捨て札にする | `board -> board (別スロット)` / `board -> discard` |
| 脱走 (Deserter) | 相手のカード（未確保フラッグ上）を1枚選び、捨て札にする | 相手の `board -> discard` |
| 裏切り (Traitor) | 相手の部隊カード（未確保フラッグ上）を1枚選び、自分のスロットに移動する | 相手の `board -> 自分の board` |

### 4. UI挙動の変更
*   **カードプレイ後**:
    *   手札のカードが**選択不可**となる（クリック/タップしても反応しない）。
    *   見た目はグレーアウトせず、そのままとする。
*   **End Turn ボタン**:
    *   カードプレイ後、**ハイライト表示**（`ring-4 ring-amber-400 animate-pulse` 等）で次の操作を誘導。
*   **PC版の手札エリアクリック（`handleHandClick`）**:
    *   盤面カードを選択して手札エリアをクリックすると戻る機能があったが、**この機能を削除する**。

### 5. 制限対象外の操作
以下は `hasPlayedCard` の状態に関わらず常に実行可能。

| 操作 | 備考 |
|------|------|
| フラッグ確保 (`claimFlag`) | カードプレイ後でも確保可能 |
| 手札ソート (`sortHand`) | いつでも可能 |
| カード情報表示 | いつでも可能 |
| 捨て札/山札の確認 | いつでも可能 |

---

## 実装詳細

### 1. データ構造

#### `src/Game.js`
*   `setup()` 内の初期 `G` に追加:
    ```javascript
    hasPlayedCard: false,
    ```

#### `src/types/index.ts`
*   `GameState` に追加:
    ```typescript
    hasPlayedCard: boolean;
    ```

### 2. ロジック (`src/moves.js`)

#### `moveCard` の変更

**A. `hand -> board` / `hand -> field` への移動時:**
```javascript
// 移動元が hand、移動先が board または field の場合
if (from.area === AREAS.HAND && (to.area === AREAS.BOARD || to.area === AREAS.FIELD)) {
  // 既にカードをプレイ済みなら拒否
  if (G.hasPlayedCard) {
    console.warn('Already played a card this turn.');
    return INVALID_MOVE;
  }
}
```
成功時（関数末尾）:
```javascript
// hand -> board または hand -> field の移動が成功した場合
if (from.area === AREAS.HAND && (to.area === AREAS.BOARD || to.area === AREAS.FIELD)) {
  G.hasPlayedCard = true;
}
```

**B. `board -> hand` / `field -> hand` への移動を禁止:**
```javascript
if (to.area === AREAS.HAND) {
  // 盤面から手札への移動は一切禁止
  if (from.area === AREAS.BOARD || from.area === AREAS.FIELD) {
    console.warn('Moving cards from board/field to hand is not allowed.');
    return INVALID_MOVE;
  }
  // deck/discard からの移動も禁止（既存ロジック）
  if (from.area !== AREAS.BOARD) {
    return INVALID_MOVE;
  }
}
```

#### `endTurn` / `drawAndEndTurn` の変更
処理内で `hasPlayedCard` をリセット:
```javascript
G.hasPlayedCard = false;
```

#### `cancelGuileTactic` の削除
*   `src/moves.js` から関数を削除。
*   `src/Game.js` の `moves` オブジェクトから `cancelGuileTactic` を削除。

### 3. UI (`src/board/Board.tsx`)

#### 手札の制御
`handleCardClick` 内:
```typescript
// 手札からのカード選択を hasPlayedCard で制御
if (location?.area === AREAS.HAND && G.hasPlayedCard) {
  return; // 選択不可
}
```

#### `handleHandClick` の削除
*   関数を削除、または早期 return で無効化。
*   `Hand` への `onHandClick` prop を削除。

#### End Turn ボタンの強調
```tsx
className={cn(
  // 既存スタイル
  canEndTurn && G.hasPlayedCard && "ring-4 ring-amber-400 animate-pulse"
)}
```

#### 謀略戦術キャンセルUI の削除
*   `activeGuileTactic` 表示時のキャンセルボタン（XCircle アイコン）を削除。

### 4. UI (`src/board/MobileBoard.tsx`)
*   `Board.tsx` と同様の変更。
*   `MobileHand` の `disabled` prop:
    ```tsx
    disabled={isSpectating || !!activeGuileTactic || G.hasPlayedCard}
    ```
*   キャンセルボタンの削除。

---

## 検証項目

| # | シナリオ | 期待結果 |
|---|----------|----------|
| 1 | 部隊カードをプレイ後、別の手札カードをクリック | 反応しない |
| 2 | 部隊カードをプレイ後、End Turnボタンがハイライト | ハイライト表示 |
| 3 | 部隊カードをプレイ後、フラッグ確保をクリック | 確保できる |
| 4 | 部隊カードをプレイ後、そのカードを手札に戻そうとする | 戻らない |
| 5 | スカウト発動後、3枚引いて2枚戻す操作 | 正常に完了 |
| 6 | スカウト発動後、別のカードをプレイしようとする | プレイできない |
| 7 | 裏切り/脱走を発動、効果処理を完了 | 正常に完了 |
| 8 | 裏切り/脱走発動中、キャンセルボタンが**存在しない** | ボタンがない |
| 9 | ターン終了後、次プレイヤーがカードをプレイ | プレイできる |
| 10 | PC版: 盤面カード選択後、手札エリアをクリック | 手札に戻らない |
| 11 | 配置転換発動、自分のカードを別スロットに移動 | 移動できる |
| 12 | 配置転換発動、自分のカードを捨て札に | 捨て札に行く |
| 13 | 配置転換発動、自分のカードを手札に戻そうとする | 戻らない |
