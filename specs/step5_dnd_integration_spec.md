# Step 5: メインボードとUI操作の統合 (Click-to-Move) 実装計画

## 概要
`boardgame.io` のゲーム状態 (`G`) とReactのステート管理を統合し、クリック操作によるカード移動（Click-to-Move）を実現するメインボード (`Board.tsx`) を実装する。
DnDによる複雑性を排除し、モバイルデバイスでも確実に操作できるUIを目指す。

## 技術スタック
*   **Main Component**: `Board.tsx`
*   **Interaction**: React State (`activeCard`), Click Events
*   **Styling**: Tailwind CSS (Grid/Flexbox Layout), 選択時のハイライト表示

## 実装詳細

### 1. 状態管理 (`src/board/Board.tsx`)
`Board` コンポーネントで以下のUI状態を管理する。

*   `activeCard`: 現在選択されているカードの情報。
    ```typescript
    type ActiveCardState = {
      card: CardType;
      location: LocationInfo; // 元の場所
    } | null;
    ```

### 2. コンポーネントの責務とイベントフロー

#### A. カードの選択 (`Card` -> `Board`)
1.  ユーザーがカード（手札または自分のスロット）をクリックする。
2.  `Card` コンポーネントの `onClick` ハンドラが発火。
3.  `Board` に定義された `handleCardClick(card, location)` が呼ばれる。
4.  **ロジック**:
    *   既にそのカードが選択されている場合 -> 選択解除 (`activeCard = null`)。
    *   別のカードが選択されている場合 -> 新しいカードを選択 (`activeCard = { card, location }`)。
    *   何も選択されていない場合 -> そのカードを選択。
    *   ※ただし、相手のカードは選択不可（クリックしても無視）。

#### B. 移動先の指定 (`Zone` -> `Board`)
1.  ユーザーがカード配置領域（Zone）をクリックする。
2.  `Zone` コンポーネントの `onClick` ハンドラが発火。
3.  `Board` に定義された `handleZoneClick(toLocation)` が呼ばれる。
4.  **ロジック**:
    *   `activeCard` が `null` の場合 -> 何もしない。
    *   `activeCard` がある場合 -> `moves.moveCard` を実行。
        *   引数: `cardId: activeCard.card.id`, `from: activeCard.location`, `to: toLocation`
    *   移動後、選択状態を解除 (`activeCard = null`)。

### 3. コンポーネント階層とProps設計

```
<Board>
  {/* 状態管理: [activeCard, setActiveCard] */}
  
  {/* 相手プレイヤーエリア */}
  <PlayerArea>
     {/* 相手の手札はクリックしても反応しない */}
     <Hand cards={opponentHand} isInteractable={false} />
  </PlayerArea>

  {/* 戦場エリア */}
  <div className="grid">
    {G.flags.map(flag => (
      <div>
        {/* 相手スロット: クリック不可 */}
        <Zone id={...} isInteractable={false} />
        
        <Flag />
        
        {/* 自分スロット: クリックで移動先指定可能 */}
        <Zone 
           id={...} 
           isInteractable={true} 
           onZoneClick={handleZoneClick}
           isActive={/* ドラッグ中のようなハイライトが必要なら */}
        >
           {/* 配置済みカード: クリックで再選択可能 */}
           {cards.map(c => (
             <Card 
               card={c} 
               isSelected={activeCard?.card.id === c.id}
               onClick={() => handleCardClick(c, location)}
             />
           ))}
        </Zone>
      </div>
    ))}
  </div>

  {/* 自分手札 */}
  <Hand 
    cards={myHand} 
    isInteractable={true} 
    onCardClick={handleCardClick}
    activeCardId={activeCard?.card.id}
  />
</Board>
```

### 4. 既存コンポーネントの改修

#### `src/board/utils.ts`
*   `parseLocationId`: 既存のまま利用。`Zone` のIDから `LocationInfo` を生成するために必要。

#### `src/board/Card.tsx`
*   `useDraggable` (DnD関連) を削除。
*   Props変更:
    *   `onClick?: () => void` を追加。
    *   `location?: LocationInfo` は保持（クリック時に親へ渡すため）。
    *   `isSelected`: スタイリング用（枠線を太くする、色を変える等）。

#### `src/board/Zone.tsx`
*   `useDroppable` (DnD関連) を削除。
*   Props変更:
    *   `onCardClick`: 子要素の `Card` に伝播させるハンドラ。
    *   `onZoneClick`: 自身の領域（空きスペース）がクリックされた時のハンドラ。
    *   `isInteractable`: `true` ならクリック有効（カーソル変更など）。
*   **クリック判定の注意**:
    *   `Zone` 全体がクリック可能エリアとなる。
    *   内部の `Card` がクリックされた場合、`Card` の `onClick` が発火し、`Zone` の `onClick` は発火しないようにする（`e.stopPropagation()`）。

#### `src/board/Hand.tsx`
*   `Zone` をラップしているため、`onCardClick` 等をパススルーするよう修正。

### 5. `src/board/Board.tsx` の再実装
*   `@dnd-kit` の依存を削除。
*   `useState` で `activeCard` を管理。
*   `handleCardClick`, `handleZoneClick` の実装。
*   レンダリングロジックは既存のものを流用しつつ、DnDコンポーネントを排除。

## 手順

1.  `src/board/Card.tsx`: DnD削除、クリック対応。
2.  `src/board/Zone.tsx`: DnD削除、クリック対応（ZoneクリックとCardクリックの分離）。
3.  `src/board/Hand.tsx`: Propsのパススルー実装。
4.  `src/board/Board.tsx`: DnD削除、Click-to-Moveロジック実装。
5.  動作確認:
    *   手札をクリック -> 選択状態（ハイライト）になるか。
    *   選択状態で自分のスロットをクリック -> 移動するか。
    *   相手のカードやスロットをクリックしても反応しないか。
