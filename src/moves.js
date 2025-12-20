import { isEnvironmentTactic } from './constants/tactics.js';
import { 
  AREAS, 
  PLAYER_IDS, 
  SLOTS, 
  DECK_TYPES, 
  TACTIC_IDS, 
  GAME_CONFIG, 
  CARD_TYPES,
  COLORS
} from './constants.js';

const INVALID_MOVE = 'INVALID_MOVE';

const COLOR_ORDER = Object.values(COLORS);

const resolveLocation = (G, ctx, location) => {
  if (location.area === AREAS.HAND) {
    return G.players[location.playerId].hand;
  }
  if (location.area === AREAS.BOARD) {
    const flag = G.flags[location.flagIndex];
    // プロパティアクセスで動的に取得
    return flag[location.slotType] || null;
  }
  if (location.area === AREAS.DECK) {
    return location.deckType === DECK_TYPES.TROOP ? G.troopDeck : G.tacticDeck;
  }
  if (location.area === AREAS.DISCARD) {
    return location.deckType === DECK_TYPES.TROOP ? G.troopDiscard : G.tacticDiscard;
  }
  if (location.area === AREAS.FIELD) {
      return G.tacticsField[location.playerId];
  }
  return null;
};

const cleanupTacticsField = (G) => {
  // 謀略戦術エリアのカードを捨て札へ移動
  [PLAYER_IDS.P0, PLAYER_IDS.P1].forEach(pid => {
      const field = G.tacticsField[pid];
      while (field.length > 0) {
          const card = field.pop();
          if (card.type === CARD_TYPES.TROOP) {
              G.troopDiscard.push(card);
          } else {
              G.tacticDiscard.push(card);
          }
      }
  });
  
  // スカウト状態のリセット
  G.scoutDrawCount = null;
  G.scoutReturnCount = null;
};

export const endTurn = ({ G, ctx, events }) => {
  cleanupTacticsField(G);
  events.endTurn();
};

export const sortHand = ({ G, ctx }) => {
  const hand = G.players[ctx.currentPlayer].hand;

  hand.sort((a, b) => {
    // 1. カードタイプ (Troop優先)
    if (a.type !== b.type) {
      return a.type === CARD_TYPES.TROOP ? -1 : 1;
    }

    // 2. Troopの場合
    if (a.type === CARD_TYPES.TROOP) {
      // 色順
      const colorIndexA = COLOR_ORDER.indexOf(a.color);
      const colorIndexB = COLOR_ORDER.indexOf(b.color);
      if (colorIndexA !== colorIndexB) {
        return colorIndexA - colorIndexB;
      }
      // 数値順
      return a.value - b.value;
    }

    // 3. Tacticの場合 (名前順)
    if (a.name && b.name) {
        return a.name.localeCompare(b.name);
    }
    return 0;
  });
};

export const drawCard = ({ G, ctx }, deckType) => {
  // スカウトモードのドロー制限チェック
  if (G.scoutDrawCount !== null && G.scoutDrawCount >= GAME_CONFIG.SCOUT_DRAW_LIMIT) {
      return;
  }

  const deck = deckType === DECK_TYPES.TROOP ? G.troopDeck : G.tacticDeck;
  if (deck.length === 0) {
    return; // デッキが空の場合は何もしない
  }

  const card = deck.pop();
  G.players[ctx.currentPlayer].hand.push(card);

  // スカウト(偵察)モードの処理
  if (G.scoutDrawCount !== null) {
      G.scoutDrawCount++;
      // 3枚引いてもモードは終了しない（カードを戻すフェーズのため）
      // ターン終了時(cleanupTacticsField)にリセットされる
  }
};

export const drawAndEndTurn = ({ G, ctx, events }, deckType) => {
  const deck = deckType === DECK_TYPES.TROOP ? G.troopDeck : G.tacticDeck;
  
  // デッキが空でなければ引く
  if (deck.length > 0) {
    const card = deck.pop();
    G.players[ctx.currentPlayer].hand.push(card);
  }
  
  cleanupTacticsField(G);

  // ターン終了
  events.endTurn();
};

export const moveCard = ({ G, ctx }, { cardId, from, to }) => {
  // --- バリデーション: 操作権限のチェック ---
  const playerID = ctx.currentPlayer;

  // スカウトモード中は、デッキに戻す操作以外（盤面への配置など）を禁止
  // ただし、スカウトカード自体をフィールドに出す操作（これがモード開始のトリガー）は許可する必要があるため、
  // G.scoutDrawCount !== null の場合（＝既にモード中）のみ制限する。
  if (G.scoutDrawCount !== null) {
      if (to.area !== AREAS.DECK) {
          console.warn('Cannot perform non-deck moves during Scout mode.');
          return INVALID_MOVE;
      }
  }

  // 1. 移動元のチェック (自分の持ち物か？)
  if (from.area === AREAS.HAND) {
    if (from.playerId !== playerID) {
      console.warn(`Cannot move opponent's hand card. Player: ${playerID}, Target: ${from.playerId}`);
      return INVALID_MOVE;
    }
  } else if (from.area === AREAS.BOARD) {
    // --- フラッグ確保済みチェック (移動元) ---
    const flag = G.flags[from.flagIndex];
    if (flag && flag.owner !== null) {
        console.warn(`Cannot move card from claimed flag ${from.flagIndex}`);
        return INVALID_MOVE;
    }

    // 自分のスロットか確認
    // 部隊スロット または 戦術スロット
    const isMySlot = (playerID === PLAYER_IDS.P0 && (from.slotType === SLOTS.P0 || from.slotType === SLOTS.P0_TACTIC)) ||
                     (playerID === PLAYER_IDS.P1 && (from.slotType === SLOTS.P1 || from.slotType === SLOTS.P1_TACTIC));
    
    if (!isMySlot) {
       // 相手のスロットを触ろうとしたら弾く
       return INVALID_MOVE;
    }
  }

  // 2. 移動先のチェック (自分の陣地か？)
  if (to.area === AREAS.HAND) {
    // 盤面から手札に戻すことを許可（再配置やミスクリック修正のため）
    if (from.area !== AREAS.BOARD) {
        // デッキや捨て札からは戻せない
        return INVALID_MOVE;
    }
    // 自分の手札に戻すかチェック
    if (to.playerId && to.playerId !== playerID) {
        return INVALID_MOVE;
    }
  } else if (to.area === AREAS.BOARD) {
    // --- フラッグ確保済みチェック (移動先) ---
    const flag = G.flags[to.flagIndex];
    if (flag && flag.owner !== null) {
        console.warn(`Cannot move card to claimed flag ${to.flagIndex}`);
        return INVALID_MOVE;
    }

    // 相手のスロットには置けない
    const isOpponentSlot = (playerID === PLAYER_IDS.P0 && (to.slotType === SLOTS.P1 || to.slotType === SLOTS.P1_TACTIC)) ||
                           (playerID === PLAYER_IDS.P1 && (to.slotType === SLOTS.P0 || to.slotType === SLOTS.P0_TACTIC));
    if (isOpponentSlot) {
      console.warn(`Cannot place card in opponent's slot.`);
      return INVALID_MOVE;
    }

    // --- 戦術カードの種類による配置制限 ---
    const sourceList = resolveLocation(G, ctx, from);
    const card = sourceList?.find(c => c.id === cardId);

    if (card) {
        const isEnv = card.type === CARD_TYPES.TACTIC && isEnvironmentTactic(card.name);
        const guileTactics = [TACTIC_IDS.SCOUT, TACTIC_IDS.REDEPLOY, TACTIC_IDS.DESERTER, TACTIC_IDS.TRAITOR];
        const isGuile = card.type === CARD_TYPES.TACTIC && card.name && guileTactics.includes(card.name);
        
        const isTacticSlot = to.slotType === SLOTS.P0_TACTIC || to.slotType === SLOTS.P1_TACTIC;

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
            // 謀略戦術も部隊スロットには置けない（専用フィールドへ）
            if (isGuile) {
                console.warn(`Cannot place guile tactic to troop slot. Use tactics field.`);
                return INVALID_MOVE;
            }
        }
    }
    // 自分の戦術スロットへの配置はOK
  } else if (to.area === AREAS.FIELD) {
      // 謀略戦術エリアへの移動
      // 移動元は手札のみ許可
      if (from.area !== AREAS.HAND) return INVALID_MOVE;

      const sourceList = resolveLocation(G, ctx, from);
      const card = sourceList?.find(c => c.id === cardId);
      
      if (!card) return INVALID_MOVE;

      // 謀略戦術 (Guile) のみ許可
      const guileTactics = [TACTIC_IDS.SCOUT, TACTIC_IDS.REDEPLOY, TACTIC_IDS.DESERTER, TACTIC_IDS.TRAITOR];
      
      if (!guileTactics.includes(card.name)) {
          console.warn(`Cannot place non-guile tactic to field.`);
          return INVALID_MOVE;
      }

      // スカウトの場合、ドローカウントを初期化
      if (card.name === TACTIC_IDS.SCOUT) {
          G.scoutDrawCount = 0;
          G.scoutReturnCount = 0; // スカウト戻しカウンタ初期化
      }
  } else if (to.area === AREAS.DECK) {
      // デッキに戻すのは特殊効果（偵察）のみ
      // 移動元が手札の場合のみ許可する
      if (from.area !== AREAS.HAND) {
          return INVALID_MOVE;
      }

      // スカウトモードでない場合は戻せない (念のため)
      if (G.scoutReturnCount === null) {
          return INVALID_MOVE;
      }

      // 戻せる枚数の制限チェック
      if (G.scoutReturnCount >= GAME_CONFIG.SCOUT_RETURN_LIMIT) {
          console.warn('Cannot return more cards than allowed.');
          return INVALID_MOVE;
      }

      // カウンタをインクリメント
      G.scoutReturnCount++;

  } else if (to.area === AREAS.DISCARD) {
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
  if (to.area === AREAS.DISCARD) {
      if (card.type !== to.deckType) {
          console.warn(`Type mismatch: Cannot discard ${card.type} card to ${to.deckType} pile.`);
          return INVALID_MOVE;
      }
  }

  // デッキへの移動の場合もタイプ一致を確認
  if (to.area === AREAS.DECK) {
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
  const deck = deckType === DECK_TYPES.TROOP ? G.troopDeck : G.tacticDeck;
  
  // boardgame.io の random ラッパーを使用
  // G は変更可能だが、シャッフルされた配列を再代入するか、直接変更する必要がある。
  // random.Shuffle は新しい配列を返す。
  const shuffled = random.Shuffle(deck);
  
  if (deckType === DECK_TYPES.TROOP) {
    G.troopDeck = shuffled;
  } else {
    G.tacticDeck = shuffled;
  }
};
