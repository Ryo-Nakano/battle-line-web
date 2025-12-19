# 追加要望: 捨て札エリアの分割 (部隊/戦術)

## 概要
捨て札エリア (`Discard Pile`) を「部隊カード用 (Troop Discard)」と「戦術カード用 (Tactic Discard)」に分割する。
ユーザーはカードを捨てる際、そのカードの種類に対応した捨て札エリアを選択する必要がある。

## 変更点

### 1. データ構造 (`src/Game.js`)
*   `G.discardPile` を削除。
*   以下を追加:
    *   `G.troopDiscard`: 部隊カードの捨て札配列。
    *   `G.tacticDiscard`: 戦術カードの捨て札配列。

### 2. ロジック (`src/moves.js`)
*   **`LocationInfo` 型の拡張 (概念的)**:
    *   `area: 'discard'` の場合、新たに `deckType?: 'troop' | 'tactic'` プロパティを必須（または推奨）とする。
*   **`moveCard` / `resolveLocation`**:
    *   `to.area === 'discard'` の場合:
        *   `to.deckType` が指定されていれば、対応する配列 (`G.troopDiscard` / `G.tacticDiscard`) を返す。
    *   **バリデーション**:
        *   移動しようとしているカードの `type` ('troop' | 'tactic') と、移動先の捨て札エリアのタイプが一致しない場合、`INVALID_MOVE` を返す。
        *   例: 部隊カードを戦術捨て札エリアに移動しようとしたらエラー。

### 3. UI (`src/board/Board.tsx`)
*   **表示**:
    *   既存の `DiscardPile` を2つ配置する（Troop Deckの横、Tactic Deckの横など）。
    *   それぞれ「Troop Discard」「Tactic Discard」とラベル付けする。
*   **インタラクション**:
    *   **クリック時 (カード選択中)**:
        *   選択中のカードが部隊カードなら、部隊捨て札エリアクリック時のみ捨てられる。逆は反応しない（またはエラー表示）。
        *   `moves.moveCard({ ..., to: { area: 'discard', deckType: 'troop' } })` のように呼び出す。
    *   **クリック時 (カード未選択)**:
        *   それぞれの捨て札一覧モーダルを開く。
*   **状態管理**:
    *   `discardModalType`: `'troop' | 'tactic' | null` でモーダルの開閉状態を管理。

### 4. テスト (`src/moves.test.js`)
*   正しい種類の捨て札エリアへの移動が成功すること。
*   間違った種類の捨て札エリアへの移動が失敗すること。
