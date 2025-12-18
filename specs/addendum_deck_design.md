# 追加要望: 山札（デッキ）UIのデザイン変更

## 概要
山札を単なるボタンではなく、実際のカードが積まれているようなビジュアルに変更する。
枚数は山札の上部に表示する。

## 変更点

### 1. 新規コンポーネント (`src/board/DeckPile.tsx`)
*   **Props**:
    *   `count`: number (残枚数)
    *   `type`: 'troop' | 'tactic'
    *   `onClick`: () => void
    *   `isDisabled`: boolean
    *   `isReturnTarget`: boolean (手札から戻すモード中か)
*   **レンダリング**:
    *   **コンテナ**: `flex flex-col items-center gap-1`
    *   **ラベル (上部)**:
        *   基本: `{type === 'troop' ? 'Troop' : 'Tactic'} ({count})`
        *   戻すモード時: `Return to Deck` 等の表示、または色を変えて強調。
    *   **カード部分**:
        *   `Card` コンポーネントを使用。
        *   ダミーデータ: `{ id: 'deck-dummy', type: props.type, faceDown: true }`
        *   スタック効果:
            *   `count > 0` の場合のみ表示。
            *   `box-shadow` で厚みを表現。
            *   `count > 1` なら疑似要素でさらに枚数感を出す（オプション）。
        *   クリックイベントを設定。

### 2. UI修正 (`src/board/Board.tsx`)
*   既存の `button` 要素を削除し、`DeckPile` コンポーネントを配置する。
*   `isReturnTarget` プロパティには `activeCard !== null` (かつタイプ一致) を渡す。

## 確認事項
*   部隊・戦術それぞれの裏面デザインで山札が表示されること。
*   枚数が上部に表示されること。
*   クリックでドローできること。
*   手札選択時、対応する山札のみ強調（または有効化）され、クリックで戻せること。
