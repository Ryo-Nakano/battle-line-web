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
  // --- バリデーション: 操作権限のチェック ---
  const playerID = ctx.currentPlayer;

  // 1. 移動元のチェック (自分の持ち物か？)
  if (from.area === 'hand') {
    if (from.playerId !== playerID) {
      console.warn(`Cannot move opponent's hand card. Player: ${playerID}, Target: ${from.playerId}`);
      return INVALID_MOVE;
    }
  } else if (from.area === 'board') {
    // 自分のスロット (p0_slots/p1_slots) か確認
    // tactic_zone にあるカードは移動できるか？ -> 一度置いたら移動不可が基本ルールだが、
    // 実装段階では「操作性」優先で動かせても良いかもしれない。
    // ただし「相手のスロット」にあるカードは絶対に動かせない。
    const isMySlot = (playerID === '0' && from.slotType === 'p0_slots') ||
                     (playerID === '1' && from.slotType === 'p1_slots');
    // 戦術カードが共通ゾーンにある場合、それを動かせるのは誰か？
    // 通常は再配置系のカード効果以外では動かせない。
    // ここでは「自分のスロット」以外からの移動を禁止する（戦術ゾーンからの移動も一旦禁止）。
    if (!isMySlot) {
       // ただし、もし「自分のスロット」から「自分のスロット」への移動機能を作るならOKだが、
       // ここでは「相手のスロット」を触ろうとしたら弾く。
       const isOpponentSlot = (playerID === '0' && from.slotType === 'p1_slots') ||
                              (playerID === '1' && from.slotType === 'p0_slots');
       if (isOpponentSlot) return INVALID_MOVE;
    }
  }

  // 2. 移動先のチェック (自分の陣地か？)
  if (to.area === 'hand') {
    // 手札に戻すことは基本できない（偵察などの効果を除く）
    // UI操作で手札に戻すのを防ぐため一旦禁止
    return INVALID_MOVE;
  } else if (to.area === 'board') {
    // 相手のスロットには置けない
    const isOpponentSlot = (playerID === '0' && to.slotType === 'p1_slots') ||
                           (playerID === '1' && to.slotType === 'p0_slots');
    if (isOpponentSlot) {
      console.warn(`Cannot place card in opponent's slot.`);
      return INVALID_MOVE;
    }
    // 戦術ゾーン (tactic_zone) への配置はOK（環境カード）
  } else if (to.area === 'deck') {
      // デッキに戻すのは特殊効果のみだが、UIドラッグで戻せないようにする
      return INVALID_MOVE;
  }


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
