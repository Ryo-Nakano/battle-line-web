# Scout Return Enforcement and Turn End Confirmation

## 概要
偵察（Scout）戦術使用時のルール「3枚引いて2枚戻す」をシステム的に強制し、UIを改善する。
具体的には、手札からデッキへ2枚戻すまでターン終了を許可せず、スカウトモード中のターン終了時には通常のドロー選択モーダルではなく、終了確認モーダルを表示する。

## 変更点

### 1. 定数追加 (`src/constants.js`)
*   `GAME_CONFIG` に `SCOUT_RETURN_LIMIT: 2` を追加する。

### 2. データ構造 (`src/Game.js`, `src/types/index.ts`)
*   **`G` オブジェクト**: `scoutReturnCount` (number | null) を追加。
    *   初期値: `null` または `0` (スカウト未使用時は `null` 推奨だが、`scoutDrawCount` と合わせる)
    *   スカウト開始時（`drawCard` でのドロー開始時または `tacticsField` 配置時）に `0` にリセット。

### 3. ロジック変更 (`src/moves.js`)
*   **`moveCard`**:
    *   手札 (`hand`) から デッキ (`deck`) への移動時:
        *   スカウトモード中 (`G.scoutDrawCount !== null`) なら、`G.scoutReturnCount` をインクリメントする。
    *   手札からフィールド (`field`) への移動時（スカウト使用）:
        *   `G.scoutReturnCount` を `0` に初期化する。
    *   **バリデーション**:
        *   既に `SCOUT_RETURN_LIMIT` (2枚) 戻している場合、それ以上のデッキへの返却を禁止する（オプションだが望ましい）。
*   **`drawCard`**:
    *   既存の `scoutDrawCount` ロジックに加え、`scoutReturnCount` のリセット処理が必要なタイミングがあれば追加（基本は `endTurn` でのリセットで十分）。
*   **`endTurn` / `cleanupTacticsField`**:
    *   `G.scoutReturnCount` を `null` (または `0`) にリセットする。

### 4. UI変更 (`src/board/Board.tsx`)

#### A. "End Turn" ボタンの制御
*   **有効化条件**:
    *   通常時: `isMyTurn`
    *   スカウトモード中: `isMyTurn` AND `scoutDrawCount === SCOUT_DRAW_LIMIT` (3) AND `scoutReturnCount === SCOUT_RETURN_LIMIT` (2)
*   **スタイル**:
    *   条件を満たさない場合、ボタンを非活性化 (`disabled`) または視覚的に押せない状態にする。
    *   （推奨）スカウトガイドメッセージ（画面中央）に「あとX枚戻してください」等の情報を表示する。

#### B. ターン終了アクション
*   **ハンドラ変更**:
    *   スカウトモード中の場合:
        *   `isDrawModalOpen` (ドロー選択) を `true` にするのではなく、新規 state `isEndTurnConfirmOpen` (または汎用 `ConfirmModal` 用 state) を `true` にする。
    *   通常時の場合:
        *   既存通り `isDrawModalOpen` を `true` にする。

#### C. 確認モーダル
*   既存の `ConfirmModal` を再利用、または新規メッセージで呼び出す。
*   タイトル: "ターン終了"
*   メッセージ: "偵察を終了してターンを交代しますか？"
*   OKアクション: `moves.endTurn()` を実行。

## 検証項目
1.  スカウト使用後、カードを3枚引くまで "End Turn" ボタンが無効（または押しても終了不可）であること。
2.  3枚引いた後、カードを1枚戻した状態でも "End Turn" が無効であること。
3.  2枚戻した時点で "End Turn" が有効になること。
4.  3枚目を戻そうとするとエラーになる（またはUIで制御される）こと。
5.  "End Turn" を押すと確認モーダルが表示され、OKでターンが終了すること（追加ドローなし）。
6.  次のターン、`scoutDrawCount`, `scoutReturnCount` がリセットされていること。
