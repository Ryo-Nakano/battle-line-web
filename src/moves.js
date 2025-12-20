// src/moves.js
import { isEnvironmentTactic } from './constants/tactics.js';

const INVALID_MOVE = 'INVALID_MOVE';

export const endTurn = ({ events }) => {
  events.endTurn();
};

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
    if (location.slotType === 'p0_tactic_slots') return flag.p0_tactic_slots;
    if (location.slotType === 'p1_tactic_slots') return flag.p1_tactic_slots;
  } else if (location.area === 'deck') {
    return location.deckType === 'troop' ? G.troopDeck : G.tacticDeck;
  } else if (location.area === 'discard') {
    return location.deckType === 'troop' ? G.troopDiscard : G.tacticDiscard;
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
    // --- フラッグ確保済みチェック (移動元) ---
    const flag = G.flags[from.flagIndex];
    if (flag && flag.owner !== null) {
        console.warn(`Cannot move card from claimed flag ${from.flagIndex}`);
        return INVALID_MOVE;
    }

    // 自分のスロットか確認
    // 部隊スロット または 戦術スロット
    const isMySlot = (playerID === '0' && (from.slotType === 'p0_slots' || from.slotType === 'p0_tactic_slots')) ||
                     (playerID === '1' && (from.slotType === 'p1_slots' || from.slotType === 'p1_tactic_slots'));
    
    if (!isMySlot) {
       // 相手のスロットを触ろうとしたら弾く
       return INVALID_MOVE;
    }
  }

  // 2. 移動先のチェック (自分の陣地か？)
  if (to.area === 'hand') {
    // 盤面から手札に戻すことを許可（再配置やミスクリック修正のため）
    if (from.area !== 'board') {
        // デッキや捨て札からは戻せない
        return INVALID_MOVE;
    }
    // 自分の手札に戻すかチェック
    if (to.playerId && to.playerId !== playerID) {
        return INVALID_MOVE;
    }
  } else if (to.area === 'board') {
    // --- フラッグ確保済みチェック (移動先) ---
    const flag = G.flags[to.flagIndex];
    if (flag && flag.owner !== null) {
        console.warn(`Cannot move card to claimed flag ${to.flagIndex}`);
        return INVALID_MOVE;
    }

    // 相手のスロットには置けない
    const isOpponentSlot = (playerID === '0' && (to.slotType === 'p1_slots' || to.slotType === 'p1_tactic_slots')) ||
                           (playerID === '1' && (to.slotType === 'p0_slots' || to.slotType === 'p0_tactic_slots'));
    if (isOpponentSlot) {
      console.warn(`Cannot place card in opponent's slot.`);
      return INVALID_MOVE;
    }

    // --- 戦術カードの種類による配置制限 ---
    const sourceList = resolveLocation(G, ctx, from);
    const card = sourceList?.find(c => c.id === cardId);

    if (card) {
        const isEnv = card.type === 'tactic' && isEnvironmentTactic(card.name);
        const isTacticSlot = to.slotType === 'p0_tactic_slots' || to.slotType === 'p1_tactic_slots';

        if (isTacticSlot) {
            // 戦術スロットには地形戦術のみ配置可能
            if (!isEnv) {
                console.warn(`Cannot place non-environment card to tactic slot.`);
                return INVALID_MOVE;
            }
        } else {
            // 部隊スロットには部隊カード または 地形戦術以外の戦術カードのみ配置可能
            // (= 地形戦術は部隊スロットに置けない)
            if (isEnv) {
                console.warn(`Cannot place environment tactic to troop slot.`);
                return INVALID_MOVE;
            }
        }
    }
    // 自分の戦術スロットへの配置はOK
  } else if (to.area === 'deck') {
      // デッキに戻すのは特殊効果（偵察）のみ
      // 移動元が手札の場合のみ許可する
      if (from.area !== 'hand') {
          return INVALID_MOVE;
      }
  } else if (to.area === 'discard') {
      // 捨て札タイプが指定されていない場合はエラー
      if (!to.deckType) return INVALID_MOVE;
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

  const card = sourceList[cardIndex];

  // 捨て札への移動の場合、カードタイプとパイルタイプの一致を確認
  if (to.area === 'discard') {
      if (card.type !== to.deckType) {
          console.warn(`Type mismatch: Cannot discard ${card.type} card to ${to.deckType} pile.`);
          return INVALID_MOVE;
      }
  }

  // デッキへの移動の場合もタイプ一致を確認
  if (to.area === 'deck') {
      if (card.type !== to.deckType) {
          console.warn(`Type mismatch: Cannot return ${card.type} card to ${to.deckType} deck.`);
          return INVALID_MOVE;
      }
  }

  // 移動元から削除
  sourceList.splice(cardIndex, 1);

  // 移動先に追加
  targetList.push(card);
};

export const claimFlag = ({ G, ctx }, flagIndex) => {
  const flag = G.flags[flagIndex];
  if (!flag) return INVALID_MOVE;

  // 既に確保済みの場合は操作不可
  if (flag.owner !== null) {
    return INVALID_MOVE;
  }

  flag.owner = ctx.currentPlayer;
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
