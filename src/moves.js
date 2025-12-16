// src/moves.js
import { INVALID_MOVE } from 'boardgame.io/core';

export const drawCard = ({ G, ctx }, deckType) => {
  const deck = deckType === 'troop' ? G.troopDeck : G.tacticDeck;
  
  if (deck.length === 0) {
    return INVALID_MOVE;
  }

  const card = deck.pop();
  G.players[ctx.currentPlayer].hand.push(card);
};

// 指定された場所を配列として解決するためのヘルパー関数
const resolveLocation = (G, ctx, location) => {
  if (location.area === 'hand') {
    return G.players[location.playerId || ctx.currentPlayer].hand;
  } else if (location.area === 'board') {
    const flag = G.flags[location.flagIndex];
    if (!flag) return null;
    if (location.slotType === 'p0_slots') return flag.p0_slots;
    if (location.slotType === 'p1_slots') return flag.p1_slots;
    if (location.slotType === 'tactic_zone') return flag.tactic_zone;
  } else if (location.area === 'deck') {
    return location.deckType === 'troop' ? G.troopDeck : G.tacticDeck;
  } else if (location.area === 'discard') {
    return G.discardPile;
  }
  return null;
};

export const moveCard = ({ G, ctx }, { cardId, from, to }) => {
  const sourceList = resolveLocation(G, ctx, from);
  const targetList = resolveLocation(G, ctx, to);

  if (!sourceList || !targetList) {
    console.error('Invalid move location', { from, to });
    return INVALID_MOVE;
  }

  const cardIndex = sourceList.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    console.error('Card not found in source', cardId);
    return INVALID_MOVE;
  }

  // 移動元から削除
  const [card] = sourceList.splice(cardIndex, 1);

  // 移動先に追加
  targetList.push(card);
};

export const claimFlag = ({ G, ctx }, flagIndex) => {
  const flag = G.flags[flagIndex];
  if (!flag) return INVALID_MOVE;

  if (flag.owner === ctx.currentPlayer) {
    flag.owner = null; // トグル解除
  } else {
    flag.owner = ctx.currentPlayer; // トグル設定（または上書き）
  }
};

export const shuffleDeck = ({ G, random }, deckType) => {
  const deck = deckType === 'troop' ? G.troopDeck : G.tacticDeck;
  
  // boardgame.io の random ラッパーを使用
  // G は変更可能だが、シャッフルされた配列を再代入するか、直接変更する必要がある。
  // random.Shuffle は新しい配列を返す。
  const shuffled = random.Shuffle(deck);
  
  if (deckType === 'troop') {
    G.troopDeck = shuffled;
  } else {
    G.tacticDeck = shuffled;
  }
};
