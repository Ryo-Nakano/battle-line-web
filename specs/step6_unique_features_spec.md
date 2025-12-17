# Step 6: 固有ルール・機能のUIサポート 実装計画

## 概要
バトルライン特有のルール（戦術カードによる環境変化、デッキへのカード戻し）および、ゲームプレイを円滑にするためのUI機能（捨て札確認、デッキ操作）を実装する。

## 実装項目

### 1. 環境戦術カード (Mud/Fog) のUI対応
*   **目的**: 「泥沼」「霧」などの戦術カードをフラッグ付近に配置可能にする。
*   **変更点**:
    *   **`src/board/Board.tsx`**:
        *   各フラッグの列（Flagコンポーネント付近）に `tactic_zone` 用の `Zone` を追加する。
        *   `Zone` の `slotType` は `tactic_zone` とする。
        *   視認性を考慮し、フラッグアイコンの横または上に小さく表示する。
    *   **`src/moves.js`**:
        *   `moveCard` 関数で、`to.slotType === 'tactic_zone'` への移動を許可する。
        *   ※本来は「戦術カードのみ配置可」等のルールがあるが、UI駆動（自由配置）の方針に従い、システム的な制限は最小限にする（または警告のみ）。

### 2. 「偵察 (Scout)」対応：デッキへのカード戻し
*   **目的**: 「偵察」カード使用時などに、手札からカードを山札に戻す操作を実現する。
*   **UI動作**:
    *   手札のカードを選択中 (`activeCard` あり) に、山札（Troop Deck または Tactic Deck）をクリックすると、そのカードを山札の上に移動する。
    *   カード未選択時は、従来の「ドロー」動作を行う。
*   **変更点**:
    *   **`src/board/Board.tsx`**:
        *   デッキ描画部分の `onClick` ハンドラを改修。
            *   `if (activeCard) { moveCard(...) } else { drawCard(...) }` のように分岐。
    *   **`src/moves.js`**:
        *   `moveCard` 関数で、`to.area === 'deck'` への移動を許可するようにバリデーションを緩和する。
        *   移動元が `hand` の場合のみ許可する（盤面から直接デッキには戻せない）。

### 3. 捨て札 (Discard Pile) のUIと確認機能
*   **目的**: 捨て札の内容を確認できるようにする。また、盤面や手札から捨て札への移動を可能にする。
*   **UI動作**:
    *   画面上の適切な位置（デッキの横など）に「捨て札置き場」を表示。
    *   クリックするとモーダル（またはオーバーレイ）が開き、捨て札一覧を表示する。
    *   手札・盤面のカードを選択中に捨て札置き場をクリックすると、そのカードを捨てる。
*   **コンポーネント**:
    *   **`DiscardPile.tsx`** (新規):
        *   捨て札のトップ（一番上のカード）を表示。
        *   クリックハンドラを持つ。
    *   **`DiscardModal.tsx`** (新規):
        *   ポータル等を用いて画面最前面に表示。
        *   捨て札リストをグリッド表示する。
        *   「閉じる」ボタンで閉じる。

## 技術的詳細

### データ構造の変更
なし（既存の `G.discardPile`, `G.troopDeck` 等を使用）。

### Moves (`src/moves.js`) の修正方針
*   **`moveCard`**:
    *   `to.area === 'deck'` のブロックを解除。
        *   条件: `from.area === 'hand'` であること。
    *   `to.area === 'discard'` は既存ロジックで対応済みか確認し、必要なら調整。

### UIコンポーネント (`src/board/`)

#### `Board.tsx`
*   **Tactic Zone**:
    ```tsx
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
       {/* Flag Icon */}
    </div>
    {/* Tactic Zone Overlay */}
    <div className="absolute ...">
       <Zone 
         id={`flag-${i}-tactic_zone`}
         cards={flag.tactic_zone}
         type="slot"
         isInteractable={true} 
         // ...
       />
    </div>
    ```
    *   ※レイアウトはCSS Gridの隙間や `position: absolute` を活用して調整する。

#### `DiscardPile.tsx` / `DiscardModal.tsx`
*   Tailwind CSS を使用したシンプルなモーダル実装。
*   `radix-ui` 等のライブラリは導入せず、標準のReact機能とCSSで実装する。

## 手順

1.  **Movesの改修**: `src/moves.js` を編集し、デッキへの移動と戦術ゾーンへの移動を許可する。
2.  **Tactic Zoneの実装**: `src/board/Board.tsx` に戦術カード配置ゾーンを追加し、スタイルを調整する。
3.  **デッキ操作の拡張**: `src/board/Board.tsx` のデッキボタン（またはエリア）をクリックした際の挙動（ドロー vs 戻す）を実装する。
4.  **捨て札機能の実装**: `DiscardPile` コンポーネントとモーダルを作成し、`Board.tsx` に配置する。
5.  **動作確認**:
    *   環境カードをフラッグ上に置けるか。
    *   手札をデッキに戻せるか（戻した後、ドローして同じカードが出るか確認）。
    *   カードを捨て札に送れるか。
    *   捨て札一覧が正しく表示されるか。
