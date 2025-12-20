# 「裏切り」「脱走」戦術カードの実装仕様書

## 1. 概要
戦術カード「裏切り (Traitor)」および「脱走 (Deserter)」の効果を実装する。
これらは相手の盤面にあるカードに干渉する特殊な効果を持つため、専用の状態管理とインタラクションフローを導入する。

## 2. カード効果定義

### 裏切り (Traitor)
*   **効果**: 相手の部隊カード（戦術カードは不可）を1枚選び、自分の側の空いているスロットに移動させる。
*   **制限**: 確保済みのフラッグにあるカードは対象にできない。

### 脱走 (Deserter)
*   **効果**: 相手の部隊または戦術カードを1枚選び、捨て札にする。
*   **制限**: 確保済みのフラッグにあるカードは対象にできない。

## 3. データ構造の変更

### GameState (`G`)
以下のフィールドを追加し、現在処理中の謀略戦術を管理する。

```typescript
interface GameState {
  // ...既存のフィールド
  activeGuileTactic: {
    type: 'Traitor' | 'Deserter';
    cardId: string; // 使用した戦術カードのID（キャンセル時などに使用）
  } | null;
}
```

## 4. インタラクションフロー

### 4.1 共通: 発動フェーズ
1.  プレイヤーが手札から「裏切り」または「脱走」を**戦術フィールド (Tactics Field)** に配置する。
2.  `moveCard` ロジック内でこれを検知し、`G.activeGuileTactic` を設定する。
3.  この状態の間、プレイヤーは他の操作（ドローや通常配置）を行えない。
4.  UI上に「対象を選択してください」等のガイドを表示し、キャンセルボタンを表示する。
    *   キャンセルした場合: 戦術カードを手札に戻し、`activeGuileTactic` を `null` にする。

### 4.2 脱走 (Deserter) の処理
1.  **状態**: `activeGuileTactic.type === 'Deserter'`
2.  **UI制御**:
    *   **相手の未確保フラッグのスロット**にあるカードを `isInteractable: true` にする。
3.  **アクション**:
    *   プレイヤーが相手のカードをクリック。
    *   `moves.resolveDeserter({ targetCardId })` を実行。
4.  **解決ロジック (`resolveDeserter`)**:
    *   対象カードを元の場所から削除。
    *   カードタイプに応じて適切な捨て札パイルに追加。
    *   `activeGuileTactic` をクリア。

### 4.3 裏切り (Traitor) の処理
1.  **状態**: `activeGuileTactic.type === 'Traitor'`
2.  **UI制御**:
    *   **相手の未確保フラッグのスロット**にある**部隊カード**のみ `isInteractable: true` にする（戦術カードは選択不可）。
3.  **アクション (Step 1)**:
    *   プレイヤーが相手の部隊カードをクリック。
    *   クライアント側でそのカードを `activeCard` として保持。
4.  **UI制御 (Step 2)**:
    *   自分の未確保フラッグの空きスロットをハイライト。
5.  **アクション (Step 2)**:
    *   プレイヤーが自分の空きスロットをクリック。
    *   `moves.resolveTraitor({ targetCardId, toLocation })` を実行。
6.  **解決ロジック (`resolveTraitor`)**:
    *   対象カードを元の場所から削除。
    *   指定された自分のスロットに追加。
    *   `activeGuileTactic` をクリア。

## 5. UI/UX詳細

*   **キャンセル機能**:
    *   効果発動中、画面中央または戦術フィールド付近に「キャンセル」ボタンを表示する。
    *   クリックで `moves.cancelGuileTactic()` を呼び出す。
*   **ハイライト**:
    *   効果発動中は、自分の手札やデッキなどは暗く（操作不可）し、選択可能な相手カードを目立たせる。

## 6. 実装計画

1.  **Step 1: Game State & Moves Update** (`src/Game.js`, `src/moves.js`)
    *   `activeGuileTactic` の初期化。
    *   `moveCard` の修正（発動トリガー）。
    *   `resolveDeserter`, `resolveTraitor`, `cancelGuileTactic` の実装。
2.  **Step 2: UI Interaction** (`src/board/Board.tsx`)
    *   `activeGuileTactic` に基づく `isInteractable` の制御ロジック変更。
    *   相手カードクリック時のハンドラ実装。
    *   キャンセルボタンの配置。
