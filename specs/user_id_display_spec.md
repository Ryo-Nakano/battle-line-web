# User ID Display Specification

## 現状 (Current Status)
現在、ゲームプレイ画面（`Board.tsx`）において、プレイヤー名の表示がハードコードされた値になっています。

- **自分 (Current Player)**: "Commander" と表示される。
- **相手 (Opponent)**: "Player 0" または "Player 1" と表示される。

一方、`MiniGame` コンポーネント（先攻後攻決めフェーズ）では、`G.playerNames` を参照して正しくユーザーIDが表示されています。

## 原因 (Cause)
`src/board/Board.tsx` のメインレンダリング部分（`BattleLineBoard` コンポーネントの `return` 文以降）において、`G.playerNames` を使用せず、静的な文字列や `playerID` を直接表示しているためです。

## 要件 (Requirements)
ゲームプレイ画面においても、ロビーや先攻後攻決めフェーズと同様に、プレイヤーが設定したユーザーIDを表示するようにします。

### 具体的な変更点
1.  **自分の名前表示**:
    -   "Commander" の代わりに、`G.playerNames[myID]` を表示する。
    -   もし名前が設定されていない場合（null/undefined）は、フォールバックとして "Commander" または "Player {myID}" を表示する。

2.  **相手の名前表示**:
    -   "Player {opponentID}" の代わりに、`G.playerNames[opponentID]` を表示する。
    -   もし名前が設定されていない場合は、フォールバックとして "Player {opponentID}" を表示する。

## 実装方針 (Implementation Strategy)
-   `src/board/Board.tsx` を修正します。
-   `G.playerNames` オブジェクトから、自分と相手の名前を取得するロジックを追加します（`MiniGame` コンポーネントと同様のロジック）。
-   ヘッダー部分（相手の名前）とフッター部分（自分の名前）の JSX を更新します。

## 検証 (Verification)
-   ゲームを開始し、ロビーで設定した名前がゲーム画面のヘッダー（相手）とフッター（自分）に正しく表示されることを確認します。
