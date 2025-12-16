# Step 5: メインボードとDnDの統合 (Smart Components) 実装計画

## 概要
`boardgame.io` のゲーム状態 (`G`) と `@dnd-kit` のドラッグ＆ドロップシステムを統合し、ユーザーがカードを自由に操作できるメインボード (`Board.tsx`) を実装する。
視点制御（自分の陣地を手前に表示）や、ドラッグ＆ドロップによる `moveCard` ムーブの呼び出しもここで行う。

## 技術スタック
*   **Main Component**: `Board.tsx`
*   **DnD Context**: `@dnd-kit/core` (`DndContext`, `DragOverlay` 等)
*   **Sensors**: Mouse, Touch (モバイル対応)
*   **Styling**: Tailwind CSS (Grid/Flexbox Layout)

## 実装詳細

### 1. `src/board/Board.tsx` の作成
`src/App.tsx` のプレースホルダーを置き換える、ゲームのメインビュー。

#### 機能要件
1.  **DnD Context Provider**: 全体を `<DndContext>` でラップする。
2.  **Drag Event Handling**: `onDragEnd` でドロップ操作を検知し、`moves.moveCard` を発火する。
3.  **Perspective Control**:
    *   `playerID` が `'0'` の場合: 上部=Player 1, 下部=Player 0 (自分)
    *   `playerID` が `'1'` の場合: 上部=Player 0, 下部=Player 1 (自分)
    *   観戦者 (`spectator`): デフォルト (P0下/P1上) または指定可能にする。
4.  **Layout**:
    *   **Top Area**: 相手の手札 (裏向き), 相手のデッキ/捨て札エリア(オプション)
    *   **Battle Area**:
        *   **Opponent Slots**: 相手側のカード配置ゾーン (Flagごとに配置)
        *   **Flag Line**: 9つのフラッグと戦術ゾーン
        *   **Player Slots**: 自分側のカード配置ゾーン
    *   **Bottom Area**: 自分の手札, デッキ操作エリア

#### ID設計 (Droppable ID -> LocationInfo)
`Zone` コンポーネントに渡す `id` は、ドロップ時に `LocationInfo` 型へパース可能な形式にする。

*   **Hand**: `hand-{playerId}` (例: `hand-0`, `hand-1`)
*   **Board Slots**: `flag-{index}-{slotType}`
    *   例: `flag-0-p0_slots` (Player 0 の左端スロット)
    *   例: `flag-8-tactic_zone` (右端の戦術ゾーン)
*   **Deck**: `deck-{deckType}` (例: `deck-troop`, `deck-tactic`)
*   **Discard**: `discard`

### 2. ヘルパー関数の実装 (`src/board/utils.ts` などを想定)

#### `parseLocationId(id: string): LocationInfo`
Droppable ID 文字列を解析し、`moves.moveCard` に渡す `to` パラメータ (`LocationInfo` オブジェクト) を生成する。

```typescript
// 擬似コード
function parseLocationId(id: string): LocationInfo | null {
  const parts = id.split('-');
  const type = parts[0];

  if (type === 'hand') {
    return { area: 'hand', playerId: parts[1] };
  }
  if (type === 'flag') {
    // flag-{index}-{slotType}
    // slotType に '_' が含まれるため、結合に注意 (p0_slots, tactic_zone)
    // parts: ['flag', '0', 'p0', 'slots'] -> slotType = 'p0_slots'
    const index = parseInt(parts[1], 10);
    const slotType = parts.slice(2).join('_'); 
    return { area: 'board', flagIndex: index, slotType };
  }
  if (type === 'deck') {
    return { area: 'deck', deckType: parts[1] };
  }
  if (type === 'discard') {
    return { area: 'discard' };
  }
  return null;
}
```

#### `findCardLocation(G: GameState, cardId: string): LocationInfo`
ドラッグされたカード (`active.id` = `cardId`) が現在どこにあるかを特定し、`moves.moveCard` の `from` パラメータを生成する。
※ `active.data.current` に情報を持たせる手もあるが、ソース・オブ・トゥルースである `G` から検索するのが最も安全。
あるいは、`Draggable` の `data` プロパティに `LocationInfo` を埋め込んでおくのが効率的。

**推奨方針**: `Card` コンポーネントを使用する親 (`Hand`, `Zone`) が、`Card` に渡す `data` prop に `origin: LocationInfo` を含めるように改修する。

### 3. コンポーネント階層とデータフロー

```
<Board>
  <DndContext onDragEnd={handleDragEnd}>
    
    {/* 相手プレイヤーエリア */}
    <PlayerArea player={opponent}>
       <Hand cards={opponentHand} isCurrentPlayer={false} />
    </PlayerArea>

    {/* 戦場エリア (9 columns) */}
    <div className="grid grid-cols-9 gap-2">
      {G.flags.map((flag, i) => (
        <div key={flag.id} className="flex flex-col">
          {/* 相手スロット */}
          <Zone id={`flag-${i}-${opponentSlotsKey}`} cards={opponentSlots} ... />
          
          {/* フラッグ & 戦術ゾーン (中央) */}
          <Flag flag={flag} ... />
          {/* 地形戦術カードがあればここに表示、なければFlag表示のみ */}
          {/* 必要なら tactic_zone も Zone 化するが、まずはFlagへのDropで代用検討 */} 
          
          {/* 自分スロット */}
          <Zone id={`flag-${i}-${playerSlotsKey}`} cards={playerSlots} ... />
        </div>
      ))}
    </div>

    {/* 自分プレイヤーエリア */}
    <PlayerArea player={me}>
       <Hand cards={myHand} isCurrentPlayer={true} />
    </PlayerArea>

    <DragOverlay>
       {/* ドラッグ中のカードプレビュー */}
    </DragOverlay>

  </DndContext>
</Board>
```

### 4. 既存コンポーネントの改修

*   **`src/board/Card.tsx`**:
    *   `useDraggable` の `data` プロパティに、現在の場所 (`LocationInfo`) を受け取ってセットできるように `props` を追加する。
    *   `interface CardProps { ..., location?: LocationInfo }`
*   **`src/board/Zone.tsx`**, **`src/board/Hand.tsx`**:
    *   子要素の `Card` をレンダリングする際、自身の `id` (から導出される `LocationInfo`) を `Card` の `location` prop に渡す。

### 5. `App.tsx` の更新
*   プレースホルダーの `Board` コンポーネントを、新しく作成した `src/board/Board.tsx` に差し替える。

## 作業手順

1.  `src/board/utils.ts` (新規) を作成し、ID解析ロジックを実装。
2.  `src/board/Card.tsx` を修正し、`location` 情報を `Draggable` data に含める。
3.  `src/board/Hand.tsx`, `src/board/Zone.tsx` を修正し、`location` を `Card` に渡す。
4.  `src/board/Board.tsx` (新規) を実装し、レイアウトとDnDロジックを構築。
5.  `src/App.tsx` で `Board` をインポートして使用。

## 確認事項
*   自分の手札から自分のスロットへカードを移動できるか。
*   盤面のスロット間でカードを移動できるか。
*   `playerID='1'` の時、盤面が反転して表示されるか（自分が下、相手が上）。
*   無効な場所（例: 相手のスロット）へのドロップが適切に無視されるか。
