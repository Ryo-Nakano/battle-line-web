import { useState, useEffect } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState, Card as CardType, LocationInfo } from '../types';
import { Zone } from './Zone';
import { Flag } from './Flag';
import { MobileHand } from './MobileHand';
import { MobileGameInfo } from './MobileGameInfo';
import { DiscardModal } from './DiscardModal';
import { CardHelpModal } from './CardHelpModal';
import { ConfirmModal } from './ConfirmModal';
import { DrawSelectionModal } from './DrawSelectionModal';
import { CheckCircle2, Info, Zap } from 'lucide-react';
import { cn } from '../utils';
import { isEnvironmentTactic } from '../constants/tactics';
import {
  PLAYER_IDS,
  CARD_TYPES,
  DECK_TYPES,
  AREAS,
  SLOTS,
  GAME_CONFIG,
  TACTIC_IDS,
} from '../constants';

interface MobileBoardProps extends BoardProps<GameState> {
  playerName?: string;
}

type ActiveCardState = {
  card: CardType;
  location: LocationInfo;
} | null;

export const MobileBoard = ({ G, ctx, moves, playerID, playerName }: MobileBoardProps) => {
  const [activeCard, setActiveCard] = useState<ActiveCardState>(null);
  const [discardModalType, setDiscardModalType] = useState<typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC | null>(null);
  const [infoModalCard, setInfoModalCard] = useState<CardType | null>(null);
  const [pendingFlagIndex, setPendingFlagIndex] = useState<number | null>(null);
  const [pendingResetFlagIndex, setPendingResetFlagIndex] = useState<number | null>(null);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [isEndTurnConfirmOpen, setIsEndTurnConfirmOpen] = useState(false);

  // Sync player name
  useEffect(() => {
    if (playerID && playerName && G.playerNames[playerID] !== playerName) {
      moves.setName(playerName);
    }
  }, [playerID, playerName, G.playerNames, moves]);

  const currentPlayerID = playerID || PLAYER_IDS.P0;
  const isSpectating = playerID === null;
  const isInverted = currentPlayerID === PLAYER_IDS.P1;
  const opponentID = isInverted ? PLAYER_IDS.P0 : PLAYER_IDS.P1;
  const myID = isInverted ? PLAYER_IDS.P1 : PLAYER_IDS.P0;
  const opponentName = G.playerNames[opponentID] || `Player ${opponentID}`;
  const isMyTurn = ctx.currentPlayer === myID;
  const isScoutMode = G.scoutDrawCount !== null;
  const scoutReturnCount = G.scoutReturnCount || 0;
  const activeGuileTactic = G.activeGuileTactic;

  // Helper to check if card is a Guile tactic
  const isGuileTactic = (card: CardType) => {
    if (card.type !== CARD_TYPES.TACTIC || !card.name) return false;
    const guileNames: string[] = [TACTIC_IDS.SCOUT, TACTIC_IDS.REDEPLOY, TACTIC_IDS.DESERTER, TACTIC_IDS.TRAITOR];
    return guileNames.includes(card.name);
  };

  const handleCardClick = (card: CardType, location?: LocationInfo) => {
    if (!isMyTurn || isSpectating || !location) return;

    // --- カードプレイ済みの場合、手札からの選択を無効化（スカウトモード中は除く） ---
    if (G.hasPlayedCard && location.area === AREAS.HAND && !isScoutMode) {
      return;
    }

    // Deserter handling
    if (activeGuileTactic?.type === TACTIC_IDS.DESERTER) {
      if (location.playerId === opponentID && location.area === AREAS.BOARD) {
        moves.resolveDeserter({
          targetCardId: card.id,
          targetLocation: location
        });
      }
      return;
    }

    // Traitor handling (Step 1 & 2)
    if (activeGuileTactic?.type === TACTIC_IDS.TRAITOR) {
      // Step 2: If already holding opponent's card, clicking on own board = placement destination
      if (activeCard && activeCard.location.playerId === opponentID && activeCard.location.area === AREAS.BOARD) {
        if (location.playerId === myID && location.area === AREAS.BOARD) {
          moves.resolveTraitor({
            targetCardId: activeCard.card.id,
            targetLocation: activeCard.location,
            toLocation: location
          });
          setActiveCard(null);
        }
        return;
      }
      // Step 1: Select opponent's troop card
      if (location.playerId === opponentID && location.area === AREAS.BOARD && card.type === CARD_TYPES.TROOP) {
        setActiveCard({ card, location });
      }
      return;
    }

    // Redeploy handling (Step 1 & 2)
    if (activeGuileTactic?.type === TACTIC_IDS.REDEPLOY) {
      // Step 2: If already holding own card, clicking on own board = placement destination
      if (activeCard && activeCard.location.playerId === myID && activeCard.location.area === AREAS.BOARD) {
        if (location.playerId === myID && location.area === AREAS.BOARD) {
          moves.resolveRedeploy({
            cardId: activeCard.card.id,
            fromLocation: activeCard.location,
            toLocation: location
          });
          setActiveCard(null);
        }
        return;
      }
      // Step 1: Select own card
      if (location.playerId === myID && location.area === AREAS.BOARD) {
        setActiveCard({ card, location });
      }
      return;
    }

    // --- Improved Interaction: Place card on existing card click ---
    // If holding a card from hand OR board (played this turn), and clicking on own board card, treat as placement
    if (activeCard &&
      (activeCard.location.area === AREAS.HAND ||
        (activeCard.location.area === AREAS.BOARD && G.cardsPlayedThisTurn.includes(activeCard.card.id))) &&
      location.playerId === myID &&
      location.area === AREAS.BOARD &&
      !activeGuileTactic
    ) {
      moves.moveCard({
        cardId: activeCard.card.id,
        from: activeCard.location,
        to: location
      });
      setActiveCard(null);
      return;
    }

    // --- 盤面の自分のカードをクリックした場合の制限 ---
    // 手札からカードを選択中でない場合のみ、過去のカードは選択不可
    if (location.area === AREAS.BOARD && location.playerId === myID) {
      if (!G.cardsPlayedThisTurn.includes(card.id)) {
        return;
      }
    }

    if (location.playerId !== myID && location.area !== AREAS.BOARD && location.area !== AREAS.FIELD) return;
    if (location.playerId === opponentID) return;

    if (activeCard && activeCard.card.id === card.id) {
      setActiveCard(null);
      return;
    }
    setActiveCard({ card, location });
  };

  const handleInfoClick = (card: CardType) => setInfoModalCard(card);

  const handleZoneClick = (toLocation: LocationInfo) => {
    if (!isMyTurn || isSpectating || !activeCard) return;

    // Traitor destination
    if (activeGuileTactic?.type === TACTIC_IDS.TRAITOR) {
      if (activeCard.location.playerId === opponentID) {
        if (toLocation.playerId === myID && toLocation.area === AREAS.BOARD) {
          moves.resolveTraitor({
            targetCardId: activeCard.card.id,
            targetLocation: activeCard.location,
            toLocation: toLocation
          });
          setActiveCard(null);
        }
      }
      return;
    }

    // Redeploy destination
    if (activeGuileTactic?.type === TACTIC_IDS.REDEPLOY) {
      if (activeCard.location.playerId === myID && activeCard.location.area === AREAS.BOARD) {
        if (toLocation.playerId === myID && toLocation.area === AREAS.BOARD) {
          moves.resolveRedeploy({
            cardId: activeCard.card.id,
            fromLocation: activeCard.location,
            toLocation: toLocation
          });
          setActiveCard(null);
        }
      }
      return;
    }

    if (activeCard.location.area === AREAS.BOARD && activeCard.location.flagIndex === toLocation.flagIndex && activeCard.location.slotType === toLocation.slotType) return;

    moves.moveCard({
      cardId: activeCard.card.id,
      from: activeCard.location,
      to: toLocation
    });
    setActiveCard(null);
  };

  const handleDeckClick = (deckType: typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC) => {
    if (!isMyTurn || isSpectating) return;
    if (!isScoutMode) return;

    if (activeCard) {
      moves.moveCard({
        cardId: activeCard.card.id,
        from: activeCard.location,
        to: { area: AREAS.DECK, deckType }
      });
      setActiveCard(null);
    } else {
      moves.drawCard(deckType);
    }
  };

  const handleDiscardClick = (type: typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC) => {
    if (activeCard) {
      if (!isMyTurn || isSpectating) return;
      moves.moveCard({
        cardId: activeCard.card.id,
        from: activeCard.location,
        to: { area: AREAS.DISCARD, deckType: type }
      });
      setActiveCard(null);
    } else {
      setDiscardModalType(type);
    }
  };

  const handlePlayTactic = () => {
    if (!activeCard || activeCard.location.area !== AREAS.HAND) return;
    if (!isGuileTactic(activeCard.card)) return;

    moves.moveCard({
      cardId: activeCard.card.id,
      from: activeCard.location,
      to: { area: AREAS.FIELD, playerId: myID }
    });
    setActiveCard(null);
  };

  const canEndTurn = isMyTurn && !activeGuileTactic && (!isScoutMode || (
    isScoutMode &&
    G.scoutDrawCount === GAME_CONFIG.SCOUT_DRAW_LIMIT &&
    scoutReturnCount === GAME_CONFIG.SCOUT_RETURN_LIMIT
  ));

  // 相手の手札の内訳を計算
  const opponentHand = G.players[opponentID].hand;
  const opponentTroopCount = opponentHand.filter(c => c.type === 'troop').length;
  const opponentTacticCount = opponentHand.filter(c => c.type === 'tactic').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans select-none">
      {/* ヘッダー: ゲーム情報バー */}
      <MobileGameInfo
        opponentName={opponentName}
        opponentTroopCount={opponentTroopCount}
        opponentTacticCount={opponentTacticCount}
        troopDeckCount={G.troopDeck.length}
        tacticDeckCount={G.tacticDeck.length}
        troopDiscardCount={G.troopDiscard.length}
        tacticDiscardCount={G.tacticDiscard.length}
        isMyTurn={isMyTurn}
        onDeckClick={isScoutMode ? handleDeckClick : undefined}
        onDiscardClick={handleDiscardClick}
        isDeckClickable={isScoutMode}
        highlightedDeckType={
          isScoutMode && G.scoutDrawCount === GAME_CONFIG.SCOUT_DRAW_LIMIT && scoutReturnCount < GAME_CONFIG.SCOUT_RETURN_LIMIT && activeCard
            ? (activeCard.card.type === CARD_TYPES.TROOP ? 'troop' : activeCard.card.type === CARD_TYPES.TACTIC ? 'tactic' : null)
            : null
        }
      />

      {/* 警告メッセージ */}
      {(isScoutMode || activeGuileTactic) && (
        <div className={cn(
          "px-3 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2",
          activeGuileTactic ? "bg-red-700/80 text-white" : "bg-amber-600/80 text-white"
        )}>
          <Info size={14} />
          {isScoutMode && !activeGuileTactic && (
            G.scoutDrawCount !== null && G.scoutDrawCount < GAME_CONFIG.SCOUT_DRAW_LIMIT
              ? `SCOUT: Draw ${GAME_CONFIG.SCOUT_DRAW_LIMIT - G.scoutDrawCount} more card(s)`
              : `SCOUT: Return ${GAME_CONFIG.SCOUT_RETURN_LIMIT - scoutReturnCount} card(s) to deck`
          )}
          {activeGuileTactic?.type === TACTIC_IDS.DESERTER && "DESERTER: Select opponent's card to discard"}
          {activeGuileTactic?.type === TACTIC_IDS.TRAITOR && "TRAITOR: Select opponent's troop then your slot"}
          {activeGuileTactic?.type === TACTIC_IDS.REDEPLOY && "REDEPLOY: Select your card to move or discard"}
        </div>
      )}

      {/* メイン: 戦場エリア（横スクロール） */}
      <main className="flex-1 overflow-x-auto overflow-y-auto py-2">
        <div className="flex justify-start items-center px-2 min-w-max">
          <div className="grid grid-cols-9 gap-0.5">
            {G.flags.map((flag, i) => {
              const topSlotsKey = isInverted ? SLOTS.P0 : SLOTS.P1;
              const bottomSlotsKey = isInverted ? SLOTS.P1 : SLOTS.P0;
              const topTacticSlotsKey = isInverted ? SLOTS.P0_TACTIC : SLOTS.P1_TACTIC;
              const bottomTacticSlotsKey = isInverted ? SLOTS.P1_TACTIC : SLOTS.P0_TACTIC;

              const topCards = isInverted ? flag[SLOTS.P0] : flag[SLOTS.P1];
              const bottomCards = isInverted ? flag[SLOTS.P1] : flag[SLOTS.P0];
              const topTacticCards = isInverted ? flag[SLOTS.P0_TACTIC] : flag[SLOTS.P1_TACTIC];
              const bottomTacticCards = isInverted ? flag[SLOTS.P1_TACTIC] : flag[SLOTS.P0_TACTIC];

              const isOpponentSlotInteractable = isMyTurn && !isSpectating && flag.owner === null && (
                activeGuileTactic?.type === TACTIC_IDS.DESERTER ||
                activeGuileTactic?.type === TACTIC_IDS.TRAITOR
              );

              const isOwnSlotInteractableForRedeploy = isMyTurn && !isSpectating && flag.owner === null &&
                activeGuileTactic?.type === TACTIC_IDS.REDEPLOY;

              return (
                <div key={flag.id} className="flex flex-col items-center justify-center relative h-[260px]">
                  {/* 相手エリア */}
                  <div className="flex-1 w-full flex flex-col justify-end pb-0 min-h-0">
                    <Zone
                      id={`flag-${i}-${topTacticSlotsKey}`}
                      cards={topTacticCards}
                      type="slot"
                      className="h-8 min-h-[24px] justify-end border-none bg-transparent scale-[0.6] -mb-6"
                      isInteractable={isOpponentSlotInteractable && activeGuileTactic?.type === TACTIC_IDS.DESERTER}
                      showPlaceHere={false}
                      onCardClick={handleCardClick}
                      onInfoClick={handleInfoClick}
                    />
                    <Zone
                      id={`flag-${i}-${topSlotsKey}`}
                      cards={topCards}
                      type="slot"
                      className={cn(
                        "h-full justify-end border-none bg-transparent scale-[0.75] origin-bottom",
                        isOpponentSlotInteractable && "ring-1 ring-red-500/50 bg-red-500/5"
                      )}
                      isInteractable={isOpponentSlotInteractable}
                      showPlaceHere={false}
                      onCardClick={handleCardClick}
                      onInfoClick={handleInfoClick}
                    />
                  </div>

                  {/* フラグ */}
                  <div className="my-1 z-10 relative flex justify-center items-center h-10 w-full">
                    <div className="absolute w-full h-[1px] bg-zinc-800 -z-10"></div>
                    <Flag
                      flag={flag}
                      myID={myID}
                      onClaim={(id) => {
                        const index = parseInt(id.split('-')[1], 10);
                        // プライベートルームで自分が奪取したフラッグの場合、リセットモーダル表示
                        if (G.isPrivateRoom && flag.owner === myID) {
                          setPendingResetFlagIndex(index);
                          return;
                        }
                        if (flag.owner !== null) return;
                        if (isMyTurn && !isSpectating && !activeGuileTactic) setPendingFlagIndex(index);
                      }}
                    />
                  </div>

                  {/* 自分エリア */}
                  <div className="flex-1 w-full flex flex-col justify-start pt-0 min-h-0">
                    <Zone
                      id={`flag-${i}-${bottomSlotsKey}`}
                      cards={bottomCards}
                      type="slot"
                      className={cn(
                        "h-full justify-start bg-transparent scale-[0.75] origin-top",
                        isOwnSlotInteractableForRedeploy && !activeCard && "ring-1 ring-amber-500/50 bg-amber-500/5",
                        isOwnSlotInteractableForRedeploy && activeCard && "ring-1 ring-green-500/50 bg-green-500/5"
                      )}
                      isInteractable={!isSpectating && flag.owner === null && (!isScoutMode || activeGuileTactic?.type === TACTIC_IDS.TRAITOR || activeGuileTactic?.type === TACTIC_IDS.REDEPLOY)}
                      activeCardId={activeCard?.card.id}
                      isTargeted={!isScoutMode && !!activeCard && !isSpectating && flag.owner === null && (
                        (!activeGuileTactic && (activeCard.card.type === CARD_TYPES.TROOP || (activeCard.card.type === CARD_TYPES.TACTIC && !isEnvironmentTactic(activeCard.card.name) && !isGuileTactic(activeCard.card)))) ||
                        (activeGuileTactic?.type === TACTIC_IDS.TRAITOR && activeCard.location.playerId === opponentID) ||
                        (activeGuileTactic?.type === TACTIC_IDS.REDEPLOY && activeCard.location.playerId === myID)
                      )}
                      showPlaceHere={false}
                      onCardClick={handleCardClick}
                      onInfoClick={handleInfoClick}
                      onZoneClick={handleZoneClick}
                    />
                    <Zone
                      id={`flag-${i}-${bottomTacticSlotsKey}`}
                      cards={bottomTacticCards}
                      type="slot"
                      className="h-8 min-h-[24px] justify-start bg-transparent scale-[0.6] -mt-6"
                      isInteractable={!isSpectating && flag.owner === null && !isScoutMode && !activeGuileTactic}
                      activeCardId={activeCard?.card.id}
                      isTargeted={!isScoutMode && !!activeCard && !isSpectating && flag.owner === null && !activeGuileTactic &&
                        activeCard.card.type === CARD_TYPES.TACTIC && isEnvironmentTactic(activeCard.card.name)}
                      showPlaceHere={false}
                      onCardClick={handleCardClick}
                      onInfoClick={handleInfoClick}
                      onZoneClick={handleZoneClick}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* フッター: 手札 + ENDボタン */}
      <footer className="flex-none p-2 bg-gradient-to-t from-black to-transparent">
        <div className="flex items-center gap-2">
          {/* 手札 */}
          <div className="flex-1">
            <MobileHand
              cards={G.players[myID].hand}
              playerId={myID}
              activeCardId={activeCard?.card.id}
              onCardClick={handleCardClick}
              onInfoClick={handleInfoClick}
              onSort={() => moves.sortHand()}
              disabled={isSpectating || !!activeGuileTactic || (G.hasPlayedCard && !isScoutMode)}
            />
          </div>

          {/* 戦術発動ボタン */}
          {activeCard && activeCard.location.area === AREAS.HAND && isGuileTactic(activeCard.card) && (
            <button
              className="px-3 py-2 rounded-lg font-bold shadow-lg flex items-center gap-1 text-sm transition-all bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-red-900/50"
              onClick={handlePlayTactic}
            >
              <Zap size={16} />
              ACTIVATE
            </button>
          )}

          {/* ENDボタン */}
          <button
            className={cn(
              "px-3 py-2 rounded-lg font-bold shadow-lg flex items-center gap-1 text-sm transition-all",
              canEndTurn
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700",
              canEndTurn && G.hasPlayedCard && "ring-4 ring-amber-400 animate-pulse"
            )}
            onClick={() => {
              if (!canEndTurn) return;
              if (isScoutMode) {
                setIsEndTurnConfirmOpen(true);
              } else {
                setIsDrawModalOpen(true);
              }
            }}
            disabled={!canEndTurn}
          >
            <CheckCircle2 size={16} />
            END
          </button>
        </div>
      </footer>

      {/* Modals */}
      <DiscardModal
        isOpen={discardModalType !== null}
        onClose={() => setDiscardModalType(null)}
        cards={discardModalType === DECK_TYPES.TROOP ? G.troopDiscard : G.tacticDiscard || []}
      />
      <CardHelpModal
        isOpen={infoModalCard !== null}
        onClose={() => setInfoModalCard(null)}
        card={infoModalCard}
      />
      <ConfirmModal
        isOpen={pendingFlagIndex !== null}
        onClose={() => setPendingFlagIndex(null)}
        onConfirm={() => {
          if (pendingFlagIndex !== null) {
            moves.claimFlag(pendingFlagIndex);
            setPendingFlagIndex(null);
          }
        }}
        title="フラッグ確保の確認"
        message="このフラッグを確保しますか？確保後は取り消すことができません。"
      />
      <ConfirmModal
        isOpen={pendingResetFlagIndex !== null}
        onClose={() => setPendingResetFlagIndex(null)}
        onConfirm={() => {
          if (pendingResetFlagIndex !== null) {
            moves.resetFlag(pendingResetFlagIndex);
            setPendingResetFlagIndex(null);
          }
        }}
        title="フラッグリセットの確認"
        message="このフラッグを未奪取状態に戻しますか？"
        confirmText="リセットする"
      />
      <ConfirmModal
        isOpen={isEndTurnConfirmOpen}
        onClose={() => setIsEndTurnConfirmOpen(false)}
        onConfirm={() => {
          moves.endTurn();
          setIsEndTurnConfirmOpen(false);
        }}
        title="ターン終了"
        message="偵察を終了してターンを交代しますか？"
        confirmText="終了する"
      />
      <DrawSelectionModal
        isOpen={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        onSelect={(type) => {
          moves.drawAndEndTurn(type);
          setIsDrawModalOpen(false);
        }}
        troopCount={G.troopDeck.length}
        tacticCount={G.tacticDeck.length}
      />
    </div>
  );
};
