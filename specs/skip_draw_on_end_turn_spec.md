# カード未プレイ時のターン終了（ドロースキップ）仕様

## 概要
ターン終了時にカードを引かずに終了するオプションを追加する。これは、プレイヤーがカードをプレイできる場がない（全てのフラッグが確保済み、または配置不可能な状況）ときに、カードをプレイせずに相手にターンを渡すためのもの。

---

## 背景・課題
現在の実装では、ターン終了時に必ずカードを引く（`DrawSelectionModal` でデッキ選択）仕様になっている。しかし、カードをプレイできない状況でターンを終える場合、「カードを引かずにターンを終了する」選択肢が必要。

---

## 要件

### 1. ターン終了時のモーダル出し分け

| 条件 | 表示するモーダル | 説明 |
|------|------------------|------|
| `hasPlayedCard === true` | `DrawSelectionModal` (既存) | カードをプレイ済みなので、デッキからカードを引いてターン終了 |
| `hasPlayedCard === false` | **新規作成**: 確認モーダル | カードを引かずにターン終了するかの確認 |

### 2. 新規確認モーダルの内容

*   **タイトル**: ターン終了
*   **メッセージ**: 「カードをプレイしていません。本当にカードを引かずにターン終了しますか？」
*   **ボタン**:
    *   **キャンセル** - モーダルを閉じる
    *   **終了する** - `moves.endTurn()` を呼び出してターン終了

### 3. ロジック仕様

*   カードを引かずにターン終了した場合、手札枚数は7枚のまま次のターンへ。
*   デッキが両方とも空の場合でも、この確認モーダルを表示する（明示的な選択を行わせる）。

### 4. 既存挙動との整合性

*   **スカウトモード中** (`isScoutMode === true`): 既存の「偵察終了確認モーダル」をそのまま使用（変更なし）。
*   **謀略戦術発動中** (`activeGuileTactic !== null`): ターン終了不可（既存動作維持）。

---

## 実装詳細

### 1. UI (`src/board/Board.tsx`)

#### End Turn ボタンのクリックハンドラ修正

**現在:**
```typescript
onClick={() => {
  if (!canEndTurn) return;
  if (isScoutMode) {
    setIsEndTurnConfirmOpen(true);
  } else {
    setIsDrawModalOpen(true);
  }
}}
```

**修正後:**
```typescript
onClick={() => {
  if (!canEndTurn) return;
  if (isScoutMode) {
    setIsEndTurnConfirmOpen(true);
  } else if (G.hasPlayedCard) {
    setIsDrawModalOpen(true);
  } else {
    setIsSkipDrawConfirmOpen(true); // 新規state
  }
}}
```

#### 新規 state の追加
```typescript
const [isSkipDrawConfirmOpen, setIsSkipDrawConfirmOpen] = useState(false);
```

#### 新規確認モーダルの追加
既存の `ConfirmModal` コンポーネントを再利用:
```tsx
<ConfirmModal
  isOpen={isSkipDrawConfirmOpen}
  onClose={() => setIsSkipDrawConfirmOpen(false)}
  onConfirm={() => {
    moves.endTurn();
    setIsSkipDrawConfirmOpen(false);
  }}
  title="ターン終了"
  message="カードをプレイしていません。本当にカードを引かずにターン終了しますか？"
  confirmText="終了する"
/>
```

### 2. UI (`src/board/MobileBoard.tsx`)

`Board.tsx` と同様の変更を適用。

---

## 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/board/Board.tsx` | state追加、クリックハンドラ分岐修正、ConfirmModal追加 |
| `src/board/MobileBoard.tsx` | 同上 |

---

## 検証項目

| # | シナリオ | 期待結果 |
|---|----------|----------|
| 1 | カードをプレイ後、End Turn をクリック | `DrawSelectionModal` が表示される |
| 2 | カードをプレイせずに End Turn をクリック | 「カードを引かずにターン終了」確認モーダルが表示される |
| 3 | 確認モーダルで「終了する」をクリック | ターンが終了し、手札7枚のまま相手のターンへ |
| 4 | 確認モーダルで「キャンセル」をクリック | モーダルが閉じ、引き続き操作可能 |
| 5 | スカウト使用後、End Turn をクリック | 既存の「偵察終了確認モーダル」が表示される |
| 6 | 両デッキが空＋カード未プレイで End Turn | 「カードを引かずにターン終了」確認モーダルが表示される |
| 7 | モバイル版で同様の動作確認 | PC版と同じ挙動 |
