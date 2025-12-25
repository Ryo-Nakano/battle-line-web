# Mobile UI Tactics Card Fix Specification

## 概要
スマートフォン版UIにおいて、謀略戦術カード（スカウト、再配置、脱走、裏切り）を使用できない問題を修正します。
現在はカードを選択しても、それをプレイするためのアクション（`AREAS.FIELD`への移動）をトリガーするUIが存在しません。

## 現状の問題点
- `MobileBoard.tsx` には、謀略戦術カードをプレイするためのターゲット（`AREAS.FIELD`）やボタンが存在しない。
- そのため、手札で謀略戦術カードを選択しても、何もできない状態となっている。
- PC版 (`Board.tsx`) では、`handleTacticsFieldClick` によって `AREAS.FIELD` への移動が実装されている。

## 変更内容

### 1. UIへの「戦術発動」ボタンの追加
`MobileBoard.tsx` のフッター部分（`MobileHand`の周辺）に、謀略戦術カードが選択されている場合のみ表示されるボタンを追加します。

- **条件**: `activeCard` が存在し、かつそのカードが謀略戦術（Guile Tactic）である場合。
- **表示**: 「戦術を使用」または「Play Tactic」ボタンを表示。
- **アクション**: ボタンクリック時に `moves.moveCard` を呼び出し、カードを `AREAS.FIELD` に移動させる。

### 2. 実装詳細
`MobileBoard.tsx` 内で以下のロジックを追加します。

```typescript
// 謀略戦術かどうかを判定するヘルパー（既存の isGuileTactic を利用）
const isSelectedGuileTactic = activeCard && activeCard.location.area === AREAS.HAND && isGuileTactic(activeCard.card);

// ハンドラ
const handlePlayTactic = () => {
  if (!activeCard || !isSelectedGuileTactic) return;
  
  moves.moveCard({
    cardId: activeCard.card.id,
    from: activeCard.location,
    to: { area: AREAS.FIELD, playerId: myID }
  });
  setActiveCard(null);
};
```

**ボタンの配置**:
フッターの "END" ボタンの横、または "END" ボタンと置き換える形で表示します。
（通常、カードプレイ中はターン終了できないため、置き換えても問題ない可能性がありますが、並べて表示する方が安全です）

### 3. アクティブな戦術の表示（オプション）
PC版のように `G.tacticsField` の内容を表示するエリアを追加することも検討しますが、今回は「使用できない」問題の解決を最優先とし、ボタン追加のみを行います。
（ただし、スカウト中のメッセージなどは既存の `MobileBoard.tsx` に実装されているため、使用さえできれば進行は可能と判断します）

## 影響範囲
- `src/board/MobileBoard.tsx`

## 検証方法
1. モバイルビューでゲームを開始する。
2. 謀略戦術カード（スカウトなど）を手札に加える（デバッグ機能やドローで）。
3. そのカードを選択する。
4. 「戦術を使用」ボタンが表示されることを確認する。
5. ボタンを押して、戦術効果（スカウトならドローモードへの移行など）が発動することを確認する。
