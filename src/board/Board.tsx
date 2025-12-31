import { useState, useEffect, useRef } from 'react';
import type { BoardProps } from 'boardgame.io/react';
import type { GameState, Card as CardType, LocationInfo } from '../types';
import { Hand } from './Hand';
import { Zone } from './Zone';
import { Flag } from './Flag';
import { Card } from './Card';
import { DiscardPile } from './DiscardPile';
import { DiscardModal } from './DiscardModal';
import { CardHelpModal } from './CardHelpModal';
import { DeckPile } from './DeckPile';
import { ConfirmModal } from './ConfirmModal';
import { DrawSelectionModal } from './DrawSelectionModal';
import { Sword, Shield, Info, CheckCircle2, Menu, Copy, LogOut } from 'lucide-react';
import { TurnStatusIndicator } from './TurnStatusIndicator';
import { cn } from '../utils';
import { MobileBoard } from './MobileBoard';
import { isEnvironmentTactic } from '../constants/tactics';
import {
    PLAYER_IDS,
    CARD_TYPES,
    DECK_TYPES,
    AREAS,
    SLOTS,
    GAME_CONFIG,
    TACTIC_IDS,
    PHASES
} from '../constants';

interface BattleLineBoardProps extends BoardProps<GameState> {
    playerName?: string;
    onLeaveRoom?: () => void;
}

interface MiniGameProps {
    G: GameState;
    ctx: any;
    moves: any;
    playerID: string | null;
    playerNames: { [key: string]: string | null };
    matchID: string;
    onLeaveRoom?: () => void;
}

type ActiveCardState = {
    card: CardType;
    location: LocationInfo;
} | null;

const MiniGame = ({ G, moves, playerID, playerNames, matchID, onLeaveRoom }: MiniGameProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

    const myID = playerID || '0';
    const myPick = G.minigame.picked[myID];
    const winner = G.minigame.winner;
    const opponentID = myID === '0' ? '1' : '0';

    // Check if I can pick
    const isOpponentJoined = !!playerNames[opponentID];
    const canPick = myPick === null && !winner && isOpponentJoined;

    const myName = playerNames[myID] || `Player ${myID}`;
    const opponentName = playerNames[opponentID] || (
        <span className="italic text-zinc-600">Waiting for opponent...</span>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 font-sans select-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black p-4 overflow-auto relative">
            {/* Menu Button */}
            <div className="absolute top-4 right-4 z-20">
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[160px]">
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsExitConfirmOpen(true);
                                }}
                                className="w-full px-4 py-3 text-left text-red-400 hover:bg-zinc-700 flex items-center gap-2 text-sm"
                            >
                                <LogOut size={16} />
                                ゲームから出る
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Exit Confirmation Modal */}
            {isExitConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-white mb-4">ゲームから出ますか？</h3>
                        <p className="text-zinc-400 text-sm mb-6">ロビー画面に戻ります。</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsExitConfirmOpen(false)}
                                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={() => onLeaveRoom?.()}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-colors"
                            >
                                出る
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h1 className="text-xl sm:text-3xl font-bold mb-4 text-amber-500 tracking-widest uppercase">Determine Start Player</h1>

            <div className="flex justify-between w-full max-w-2xl mb-8 px-8">
                <div className="text-center">
                    <div className="text-sm text-zinc-500 mb-1">You</div>
                    <div className="text-xl font-bold text-amber-400">{myName}</div>
                </div>
                <div className="text-center">
                    <div className="text-sm text-zinc-500 mb-1">Opponent</div>
                    <div className="text-xl font-bold text-zinc-400">{opponentName}</div>
                </div>
            </div>

            {/* Room ID Display */}
            <div className="mb-8 flex flex-col items-center gap-2">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Room ID</span>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2">
                    <span className="font-mono text-amber-500 font-bold text-lg">{matchID}</span>
                    <button
                        onClick={() => navigator.clipboard.writeText(matchID)}
                        className="text-zinc-500 hover:text-white transition-colors p-1"
                        title="Copy Room ID"
                    >
                        <Copy size={16} />
                    </button>
                </div>
                {!isOpponentJoined && (
                    <p className="text-xs text-zinc-500 mt-1">Share this ID to invite your opponent</p>
                )}
            </div>

            {!winner && (
                <div className="mb-8 text-xl font-medium animate-pulse">
                    {canPick ? (
                        <span className="text-amber-400">Please select a card from below</span>
                    ) : !isOpponentJoined ? (
                        <span className="text-zinc-500">Waiting for opponent to join...</span>
                    ) : (
                        <span className="text-zinc-500">{opponentName} is selecting, please wait...</span>
                    )}
                </div>
            )}

            {winner ? (
                <div className="text-center flex flex-col items-center">
                    <h2 className="text-2xl mb-8 font-bold">
                        {winner === myID ? <span className="text-amber-400">You Won!</span> : <span className="text-zinc-400">{opponentName} Won!</span>}
                    </h2>
                    <div className="flex gap-6 justify-center mb-12">
                        {G.minigame.cards.map((val, i) => {
                            const isP0 = G.minigame.picked['0'] === i;
                            const isP1 = G.minigame.picked['1'] === i;
                            const isWinnerCard = (winner === '0' && isP0) || (winner === '1' && isP1);
                            const pickerName = isP0 ? (playerNames['0'] || 'P0') : (playerNames['1'] || 'P1');

                            return (
                                <div key={i} className={cn(
                                    "w-32 h-48 rounded-xl border-2 flex flex-col items-center justify-center text-4xl font-bold transition-all relative shadow-2xl",
                                    isWinnerCard ? "border-amber-500 bg-amber-900/20 scale-110 z-10 shadow-amber-500/20" : "border-zinc-700 bg-zinc-800/50 opacity-50"
                                )}>
                                    {val}
                                    {(isP0 || isP1) && (
                                        <div className={cn(
                                            "absolute -top-8 text-sm font-bold px-3 py-1 rounded-full border",
                                            isP0 ? "text-red-500 bg-red-500/10 border-red-500/20" : "text-blue-500 bg-blue-500/10 border-blue-500/20"
                                        )}>
                                            {pickerName}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {winner === myID ? (
                        <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <button
                                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all transform hover:scale-105 active:scale-95"
                                onClick={() => moves.chooseOrder('first')}
                            >
                                Go First
                            </button>
                            <button
                                className="px-8 py-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95"
                                onClick={() => moves.chooseOrder('second')}
                            >
                                Go Second
                            </button>
                        </div>
                    ) : (
                        <div className="text-zinc-400 animate-pulse flex items-center gap-2">
                            <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                            Waiting for opponent to choose order...
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex gap-8">
                    {G.minigame.cards.map((_, i) => {
                        const isPickedByMe = myPick === i;
                        const isPickedByOpponent = G.minigame.picked[myID === '0' ? '1' : '0'] === i;

                        return (
                            <button
                                key={i}
                                className={cn(
                                    "w-32 h-48 rounded-xl border-2 flex items-center justify-center transition-all duration-300 shadow-xl",
                                    isPickedByMe ? "border-amber-500 bg-amber-900/20 scale-105 shadow-amber-500/10" :
                                        isPickedByOpponent ? "border-zinc-700 bg-zinc-800/50 opacity-50 cursor-not-allowed" :
                                            "border-zinc-600 bg-zinc-800 hover:border-zinc-400 hover:bg-zinc-700 hover:scale-105 hover:shadow-2xl cursor-pointer",
                                    !canPick && !isPickedByMe && "opacity-30 cursor-not-allowed scale-95"
                                )}
                                onClick={() => canPick && !isPickedByOpponent && moves.pickCard(i)}
                                disabled={!canPick || isPickedByOpponent}
                            >
                                {isPickedByMe ? <span className="text-amber-500 font-bold">Selected</span> :
                                    isPickedByOpponent ? <span className="text-zinc-500 font-bold">Opponent</span> :
                                        <span className="text-4xl text-zinc-600 font-bold">?</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {!winner && myPick !== null && (
                <div className="mt-12 text-zinc-400 animate-pulse flex items-center gap-2">
                    <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                    Waiting for opponent...
                </div>
            )}
        </div>
    );
};

export const BattleLineBoard = (props: BattleLineBoardProps) => {
    const { G, ctx, moves, playerID, playerName, matchID, onLeaveRoom } = props;
    const [activeCard, setActiveCard] = useState<ActiveCardState>(null);
    const [discardModalType, setDiscardModalType] = useState<typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC | null>(null);
    const [infoModalCard, setInfoModalCard] = useState<CardType | null>(null);
    const [pendingFlagIndex, setPendingFlagIndex] = useState<number | null>(null);
    const [pendingResetFlagIndex, setPendingResetFlagIndex] = useState<number | null>(null);
    const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
    const [isEndTurnConfirmOpen, setIsEndTurnConfirmOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);

    // モバイル判定用のstate（1024px未満でモバイルUI）
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1024);

    // 画面リサイズ監視
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 配置カードハイライト用
    const [highlightedCard, setHighlightedCard] = useState<{
        flagIndex: number;
        slotIndex: number;
        playerID: string;
        timestamp: number;
    } | null>(null);
    const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastProcessedTimestampRef = useRef<number | undefined>(undefined);

    // lastPlacedCardが変更されたのを検知して3秒タイマーを設定
    useEffect(() => {
        const newCard = G.lastPlacedCard;
        // 新しいカードが配置された場合のみハイライト（3秒以内の配置のみ）
        if (newCard && newCard.timestamp !== lastProcessedTimestampRef.current) {
            const elapsed = Date.now() - newCard.timestamp;
            // 3秒以上経過している場合はハイライトしない（ターンエンド時の再表示防止）
            if (elapsed > 5000) {
                lastProcessedTimestampRef.current = newCard.timestamp;
                return;
            }
            lastProcessedTimestampRef.current = newCard.timestamp;
            // 既存のタイマーをクリア
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
            }
            // ハイライト開始
            setHighlightedCard({
                flagIndex: newCard.flagIndex,
                slotIndex: newCard.slotIndex,
                playerID: newCard.playerID,
                timestamp: newCard.timestamp,
            });
            // 残り時間後にハイライト解除
            const remainingTime = Math.max(0, 5000 - elapsed);
            highlightTimeoutRef.current = setTimeout(() => {
                setHighlightedCard(null);
            }, remainingTime);
        }
        return () => {
            if (highlightTimeoutRef.current) {
                clearTimeout(highlightTimeoutRef.current);
                highlightTimeoutRef.current = null;
            }
            // クリーンアップ時にハイライトもクリア
            setHighlightedCard(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [G.lastPlacedCard]);

    // ハイライト情報
    const highlightInfo = highlightedCard;

    // Sync player name
    useEffect(() => {
        if (playerID && playerName && G.playerNames[playerID] !== playerName) {
            moves.setName(playerName);
        }
    }, [playerID, playerName, G.playerNames, moves]);

    if (ctx.phase === PHASES.DETERMINATION) {
        return <MiniGame G={G} ctx={ctx} moves={moves} playerID={playerID} playerNames={G.playerNames} matchID={matchID} onLeaveRoom={onLeaveRoom} />;
    }

    // スマホ版UIへの切り替え
    if (isMobile) {
        return <MobileBoard {...props} />;
    }

    const currentPlayerID = playerID || PLAYER_IDS.P0;
    const isSpectating = playerID === null;
    const isInverted = currentPlayerID === PLAYER_IDS.P1;
    const opponentID = isInverted ? PLAYER_IDS.P0 : PLAYER_IDS.P1;
    const myID = isInverted ? PLAYER_IDS.P1 : PLAYER_IDS.P0;
    const myName = G.playerNames[myID] || 'Commander';
    const opponentName = G.playerNames[opponentID] || `Player ${opponentID}`;
    const isMyTurn = ctx.currentPlayer === myID;
    const isScoutMode = G.scoutDrawCount !== null;
    const scoutReturnCount = G.scoutReturnCount || 0;
    const activeGuileTactic = G.activeGuileTactic;

    // Helper to check if card is a Guile tactic
    const isGuileTactic = (card: CardType) => {
        if (card.type !== CARD_TYPES.TACTIC || !card.name) return false;
        const key = card.name;
        const guileNames: string[] = [TACTIC_IDS.SCOUT, TACTIC_IDS.REDEPLOY, TACTIC_IDS.DESERTER, TACTIC_IDS.TRAITOR];
        return guileNames.includes(key);
    };

    // Helper to get highlight index for a specific slot
    const getHighlightIndex = (flagIndex: number, slotType: string): number | undefined => {
        if (!highlightInfo || highlightInfo.flagIndex !== flagIndex) return undefined;
        // slotType から playerID を抽出
        const slotPlayerID = slotType.startsWith('p0') ? PLAYER_IDS.P0 : PLAYER_IDS.P1;
        if (highlightInfo.playerID !== slotPlayerID) return undefined;
        // tactic slot の場合はハイライト対象外（部隊スロットのみ）
        if (slotType.includes('tactic')) return undefined;
        return highlightInfo.slotIndex;
    };

    const handleCardClick = (card: CardType, location?: LocationInfo) => {
        if (!isMyTurn || isSpectating || !location) return;

        // --- カードプレイ済みの場合、手札からの選択を無効化（スカウトモード中は除く） ---
        if (G.hasPlayedCard && location.area === AREAS.HAND && G.scoutDrawCount === null) {
            return;
        }

        // --- Special Handling for Deserter (Opponent Card Selection) ---
        if (activeGuileTactic?.type === TACTIC_IDS.DESERTER) {
            if (location.playerId === opponentID && location.area === AREAS.BOARD) {
                moves.resolveDeserter({
                    targetCardId: card.id,
                    targetLocation: location
                });
            }
            return;
        }

        // --- Special Handling for Traitor (Step 1 & 2) ---
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

        // --- Special Handling for Redeploy (Step 1 & 2) ---
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

        // Normal interaction (prevent selecting opponent cards usually)
        if (location.playerId !== myID && location.area !== AREAS.BOARD && location.area !== AREAS.FIELD) return; // Allow board for logic check, blocked by validation mostly
        if (location.playerId === opponentID) return; // Strict block for normal play

        if (activeCard && activeCard.card.id === card.id) {
            setActiveCard(null);
            return;
        }
        setActiveCard({ card, location });
    };

    const handleInfoClick = (card: CardType) => setInfoModalCard(card);

    const handleZoneClick = (toLocation: LocationInfo) => {
        if (!isMyTurn || isSpectating || !activeCard) return;

        // --- Special Handling for Traitor (Step 2: Destination Selection) ---
        if (activeGuileTactic?.type === TACTIC_IDS.TRAITOR) {
            // Must have selected an opponent card first
            if (activeCard.location.playerId === opponentID) {
                // Must click on my own board slot
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

        // --- Special Handling for Redeploy (Step 2: Destination Selection) ---
        if (activeGuileTactic?.type === TACTIC_IDS.REDEPLOY) {
            // Must have selected my own card first
            if (activeCard.location.playerId === myID && activeCard.location.area === AREAS.BOARD) {
                // Can move to own board slot or discard
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

    const handleTacticsFieldClick = (pid: string) => {
        if (!isMyTurn || isSpectating || !activeCard) return;
        if (pid !== myID) return; // 自分のフィールドのみ

        // 手札からのみ移動可能
        if (activeCard.location.area !== AREAS.HAND) return;

        // 謀略戦術のみ
        if (!isGuileTactic(activeCard.card)) return;

        moves.moveCard({
            cardId: activeCard.card.id,
            from: activeCard.location,
            to: { area: AREAS.FIELD, playerId: pid }
        });
        setActiveCard(null);
    };

    const handleDeckClick = (deckType: typeof DECK_TYPES.TROOP | typeof DECK_TYPES.TACTIC) => {
        if (!isMyTurn || isSpectating) return;

        // スカウトモード中以外はクリック無効
        if (!isScoutMode) return;

        if (activeCard) {
            // カードを手札からデッキに戻す処理 (スカウトの戻し処理)
            moves.moveCard({
                cardId: activeCard.card.id,
                from: activeCard.location,
                to: { area: AREAS.DECK, deckType }
            });
            setActiveCard(null);
        } else {
            // スカウト中の追加ドロー
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

    // handleHandClick は削除（盤面から手札への移動は禁止）

    // ターン終了ボタンの有効化条件
    const canEndTurn = isMyTurn && !activeGuileTactic && (!isScoutMode || (
        isScoutMode &&
        G.scoutDrawCount === GAME_CONFIG.SCOUT_DRAW_LIMIT &&
        scoutReturnCount === GAME_CONFIG.SCOUT_RETURN_LIMIT
    ));

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans select-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">

            {/* ■ HEADER: Opponent Area - レスポンシブ対応 */}
            <header className="flex-none flex justify-between items-start p-2 sm:p-4 z-10">
                <div className="flex gap-4 items-center">
                    <div className="bg-zinc-800/80 backdrop-blur-sm p-2 rounded-lg border border-zinc-700 flex items-center gap-3 shadow-lg">
                        <div className={cn("w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center shadow-inner", opponentID === PLAYER_IDS.P0 ? 'bg-red-700' : 'bg-blue-700')}>
                            <Sword size={20} className="text-white/80" />
                        </div>
                        <div>
                            <div className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase">Opponent</div>
                            <div className="font-bold text-sm flex items-center gap-2">
                                {opponentName}
                                {opponentID === ctx.currentPlayer && <span className="text-amber-500 animate-pulse text-xs">Thinking...</span>}
                            </div>
                        </div>
                    </div>

                    {/* 相手の手札表示 (Cardコンポーネントを使用) */}
                    <div className="flex -space-x-8 opacity-90 h-24 items-start">
                        {G.players[opponentID].hand.map((card, i) => (
                            <div key={i} className="transform scale-75 origin-top-left transition-transform hover:scale-90 hover:z-10">
                                <Card
                                    card={{ ...card, faceDown: true }}
                                    isInteractable={false}
                                    className="shadow-lg"
                                />
                            </div>
                        ))}
                    </div>

                    {/* 相手のTactics Field */}
                    <div className="ml-4 flex flex-col gap-1 opacity-80">
                        <div className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase text-center">Active Tactics</div>
                        <Zone
                            id={`field-${opponentID}`}
                            cards={G.tacticsField[opponentID]}
                            type="slot"
                            className="h-24 min-h-[90px] w-32 border border-zinc-700/50 bg-black/20 rounded-lg justify-center"
                            orientation="horizontal"
                            isInteractable={false}
                            onInfoClick={handleInfoClick}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md relative">
                    <div className={cn("flex items-center gap-2 text-sm font-medium transition-colors", isMyTurn ? "text-amber-500" : "text-zinc-500")}>
                        <TurnStatusIndicator isMyTurn={isMyTurn} size="md" />
                        <span>{isMyTurn ? "YOUR TURN" : "WAITING"}</span>
                    </div>
                    <div className="h-4 w-[1px] bg-zinc-700"></div>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="text-zinc-400 hover:text-white transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden min-w-[160px] z-30">
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    setIsExitConfirmOpen(true);
                                }}
                                className="w-full px-4 py-3 text-left text-red-400 hover:bg-zinc-700 flex items-center gap-2 text-sm"
                            >
                                <LogOut size={16} />
                                ゲームから出る
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* ■ MAIN: Battlefield Area - 横スクロール対応 */}
            <main className="flex-1 flex items-center justify-start sm:justify-center overflow-x-auto overflow-y-auto custom-scrollbar py-2 sm:py-4">
                <div className="flex justify-center items-center px-2 sm:px-8 min-w-max">
                    <div className="grid grid-cols-9 gap-1 sm:gap-2 lg:gap-4">
                        {G.flags.map((flag, i) => {
                            const topSlotsKey = isInverted ? SLOTS.P0 : SLOTS.P1;
                            const bottomSlotsKey = isInverted ? SLOTS.P1 : SLOTS.P0;
                            const topTacticSlotsKey = isInverted ? SLOTS.P0_TACTIC : SLOTS.P1_TACTIC;
                            const bottomTacticSlotsKey = isInverted ? SLOTS.P1_TACTIC : SLOTS.P0_TACTIC;

                            const topCards = isInverted ? flag[SLOTS.P0] : flag[SLOTS.P1];
                            const bottomCards = isInverted ? flag[SLOTS.P1] : flag[SLOTS.P0];
                            const topTacticCards = isInverted ? flag[SLOTS.P0_TACTIC] : flag[SLOTS.P1_TACTIC];
                            const bottomTacticCards = isInverted ? flag[SLOTS.P1_TACTIC] : flag[SLOTS.P0_TACTIC];

                            // Determine interactivity for opponent zones based on active tactic
                            const isOpponentSlotInteractable = isMyTurn && !isSpectating && flag.owner === null && (
                                (activeGuileTactic?.type === TACTIC_IDS.DESERTER) ||
                                (activeGuileTactic?.type === TACTIC_IDS.TRAITOR)
                            );

                            // Determine interactivity for own zones during Redeploy
                            const isOwnSlotInteractableForRedeploy = isMyTurn && !isSpectating && flag.owner === null &&
                                activeGuileTactic?.type === TACTIC_IDS.REDEPLOY;

                            return (
                                <div key={flag.id} className="flex flex-col items-center justify-center relative group h-[380px] sm:h-[450px] lg:h-[500px]">
                                    {/* Top Area (Opponent) */}
                                    <div className="flex-1 w-full flex flex-col justify-end pb-4 gap-2 min-h-0">
                                        {/* Tactic Slot (Opponent) */}
                                        <Zone
                                            id={`flag-${i}-${topTacticSlotsKey}`}
                                            cards={topTacticCards}
                                            type="slot"
                                            className={cn(
                                                "h-24 min-h-[60px] justify-end border-none bg-transparent scale-90 opacity-70",
                                                isOpponentSlotInteractable && activeGuileTactic?.type === TACTIC_IDS.DESERTER && "ring-2 ring-red-500/50 cursor-pointer opacity-100"
                                            )}
                                            isInteractable={isOpponentSlotInteractable && activeGuileTactic?.type === TACTIC_IDS.DESERTER}
                                            onCardClick={handleCardClick}
                                            onInfoClick={handleInfoClick}
                                        />
                                        {/* Troop Slot (Opponent) */}
                                        <Zone
                                            id={`flag-${i}-${topSlotsKey}`}
                                            cards={topCards}
                                            type="slot"
                                            className={cn(
                                                "h-full justify-end border-none bg-transparent",
                                                isOpponentSlotInteractable && "ring-2 ring-red-500/50 cursor-pointer bg-red-500/5",
                                                activeCard?.location.playerId === opponentID && activeCard.location.flagIndex === i && activeCard.location.slotType === topSlotsKey && "ring-amber-500 ring-4"
                                            )}
                                            isInteractable={isOpponentSlotInteractable}
                                            highlightedCardIndex={getHighlightIndex(i, topSlotsKey)}
                                            onCardClick={handleCardClick}
                                            onInfoClick={handleInfoClick}
                                        />
                                    </div>

                                    {/* Center Flag Line */}
                                    <div className="my-1 sm:my-2 z-10 relative flex justify-center items-center h-12 sm:h-16 w-full">
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

                                    {/* Bottom Area (Player) */}
                                    <div className="flex-1 w-full flex flex-col justify-start pt-4 gap-2 min-h-0">
                                        {/* Troop Slot (Player) */}
                                        <Zone
                                            id={`flag-${i}-${bottomSlotsKey}`}
                                            cards={bottomCards}
                                            type="slot"
                                            className={cn(
                                                "h-full justify-start bg-transparent",
                                                isOwnSlotInteractableForRedeploy && !activeCard && "ring-2 ring-amber-500/50 cursor-pointer bg-amber-500/5",
                                                isOwnSlotInteractableForRedeploy && activeCard && "ring-2 ring-green-500/50 cursor-pointer bg-green-500/5"
                                            )}
                                            isInteractable={!isSpectating && flag.owner === null && (!isScoutMode || activeGuileTactic?.type === TACTIC_IDS.TRAITOR || activeGuileTactic?.type === TACTIC_IDS.REDEPLOY)}
                                            activeCardId={activeCard?.card.id}
                                            isTargeted={!isScoutMode && !!activeCard && !isSpectating && flag.owner === null &&
                                                (
                                                    // Normal placement logic
                                                    (!activeGuileTactic && (activeCard.card.type === CARD_TYPES.TROOP || (activeCard.card.type === CARD_TYPES.TACTIC && !isEnvironmentTactic(activeCard.card.name) && !isGuileTactic(activeCard.card)))) ||
                                                    // Traitor destination logic
                                                    (activeGuileTactic?.type === TACTIC_IDS.TRAITOR && activeCard.location.playerId === opponentID) ||
                                                    // Redeploy destination logic
                                                    (activeGuileTactic?.type === TACTIC_IDS.REDEPLOY && activeCard.location.playerId === myID)
                                                )
                                            }
                                            onCardClick={handleCardClick}
                                            onInfoClick={handleInfoClick}
                                            onZoneClick={handleZoneClick}
                                            highlightedCardIndex={getHighlightIndex(i, bottomSlotsKey)}
                                        />
                                        {/* Tactic Slot (Player) */}
                                        <Zone
                                            id={`flag-${i}-${bottomTacticSlotsKey}`}
                                            cards={bottomTacticCards}
                                            type="slot"
                                            className="h-24 min-h-[60px] justify-start bg-transparent scale-90"
                                            isInteractable={!isSpectating && flag.owner === null && !isScoutMode && !activeGuileTactic}
                                            activeCardId={activeCard?.card.id}
                                            isTargeted={!isScoutMode && !!activeCard && !isSpectating && flag.owner === null && !activeGuileTactic &&
                                                activeCard.card.type === CARD_TYPES.TACTIC && isEnvironmentTactic(activeCard.card.name)}
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

            {/* ■ FOOTER: Player Area - スマホ横画面対応 */}
            <footer className="flex-none p-2 sm:p-4 pb-2 sm:pb-6 z-20 bg-gradient-to-t from-black via-zinc-900 to-transparent">
                {/* スマホ: 上段にデッキ/ボタン、下段に手札 */}
                {/* PC: 左にデッキ、中央に手札、右にボタン */}
                <div className="max-w-7xl mx-auto flex flex-col gap-2">

                    {/* 上段: デッキ/捨て札 + ボタン/ステータス */}
                    <div className="flex items-end justify-between gap-2 sm:hidden">
                        {/* Left: Decks & Discard (compact) */}
                        <div className="flex gap-2 items-end">
                            <DeckPile
                                count={G.troopDeck.length}
                                type={DECK_TYPES.TROOP}
                                onClick={() => handleDeckClick(DECK_TYPES.TROOP)}
                                isDisabled={!isMyTurn || (!isScoutMode && !!activeGuileTactic)}
                                isHighlighted={isScoutMode && G.scoutDrawCount === GAME_CONFIG.SCOUT_DRAW_LIMIT && scoutReturnCount < GAME_CONFIG.SCOUT_RETURN_LIMIT && activeCard?.card.type === CARD_TYPES.TROOP}
                            />
                            <DeckPile
                                count={G.tacticDeck.length}
                                type={DECK_TYPES.TACTIC}
                                onClick={() => handleDeckClick(DECK_TYPES.TACTIC)}
                                isDisabled={!isMyTurn || (!isScoutMode && !!activeGuileTactic)}
                                isHighlighted={isScoutMode && G.scoutDrawCount === GAME_CONFIG.SCOUT_DRAW_LIMIT && scoutReturnCount < GAME_CONFIG.SCOUT_RETURN_LIMIT && activeCard?.card.type === CARD_TYPES.TACTIC}
                            />
                        </div>

                        {/* Right: End Turn Button (compact) */}
                        <button
                            className={cn(
                                "px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-1 text-sm transition-all transform active:scale-95",
                                canEndTurn
                                    ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20"
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

                    {/* 下段: 手札 (スマホ) / PCでは3列レイアウト */}
                    <div className="flex items-end justify-between gap-4 sm:gap-8">

                        {/* PCのみ: Left - Decks & Discard */}
                        <div className="hidden sm:flex gap-6 items-end">
                            <div className="flex gap-4">
                                <DeckPile
                                    count={G.troopDeck.length}
                                    type={DECK_TYPES.TROOP}
                                    onClick={() => handleDeckClick(DECK_TYPES.TROOP)}
                                    isDisabled={!isMyTurn || (!isScoutMode && !!activeGuileTactic)}
                                    isHighlighted={isScoutMode && G.scoutDrawCount === GAME_CONFIG.SCOUT_DRAW_LIMIT && scoutReturnCount < GAME_CONFIG.SCOUT_RETURN_LIMIT && activeCard?.card.type === CARD_TYPES.TROOP}
                                />
                                <DeckPile
                                    count={G.tacticDeck.length}
                                    type={DECK_TYPES.TACTIC}
                                    onClick={() => handleDeckClick(DECK_TYPES.TACTIC)}
                                    isDisabled={!isMyTurn || (!isScoutMode && !!activeGuileTactic)}
                                    isHighlighted={isScoutMode && G.scoutDrawCount === GAME_CONFIG.SCOUT_DRAW_LIMIT && scoutReturnCount < GAME_CONFIG.SCOUT_RETURN_LIMIT && activeCard?.card.type === CARD_TYPES.TACTIC}
                                />
                            </div>

                            <div className="h-16 w-[1px] bg-zinc-700"></div>

                            <div className="flex gap-2">
                                <DiscardPile
                                    cards={G.troopDiscard}
                                    onClick={() => handleDiscardClick(DECK_TYPES.TROOP)}
                                    label="Troop"
                                />
                                <DiscardPile
                                    cards={G.tacticDiscard}
                                    onClick={() => handleDiscardClick(DECK_TYPES.TACTIC)}
                                    label="Tactic"
                                />
                            </div>
                        </div>

                        {/* Center: Hand & Tactics Field */}
                        <div className="flex-1 flex flex-col items-center justify-end pb-1 sm:pb-2 gap-1 sm:gap-2 relative">
                            {/* Scout Guide Message */}
                            {G.scoutDrawCount !== null && (G.scoutDrawCount < GAME_CONFIG.SCOUT_DRAW_LIMIT || scoutReturnCount < GAME_CONFIG.SCOUT_RETURN_LIMIT) && (
                                <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-6 py-2 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.5)] z-50 animate-bounce font-bold border-2 border-amber-400 whitespace-nowrap pointer-events-none flex items-center gap-2">
                                    <Info size={18} />
                                    {G.scoutDrawCount < GAME_CONFIG.SCOUT_DRAW_LIMIT ? (
                                        <span>SCOUT ACTIVE: Draw {GAME_CONFIG.SCOUT_DRAW_LIMIT - G.scoutDrawCount} more card(s)!</span>
                                    ) : (
                                        <span>SCOUT ACTIVE: Return {GAME_CONFIG.SCOUT_RETURN_LIMIT - scoutReturnCount} card(s) to deck!</span>
                                    )}
                                </div>
                            )}

                            {/* Guile Tactic Active Message */}
                            {activeGuileTactic && (
                                <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-red-700 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] z-50 font-bold border-2 border-red-500 whitespace-nowrap flex items-center gap-4">
                                    <Info size={18} />
                                    {activeGuileTactic.type === TACTIC_IDS.DESERTER && (
                                        <span>DESERTER: Select an opponent's card to discard!</span>
                                    )}
                                    {activeGuileTactic.type === TACTIC_IDS.TRAITOR && (
                                        <span>TRAITOR: Select opponent's troop &rarr; Place in your slot!</span>
                                    )}
                                    {activeGuileTactic.type === TACTIC_IDS.REDEPLOY && (
                                        <span>REDEPLOY: Select your card to move or discard!</span>
                                    )}
                                </div>
                            )}

                            {/* Tactics Field */}
                            <div className="flex items-center gap-2 transition-all duration-300">
                                <div className="text-[10px] text-zinc-600 font-bold tracking-widest uppercase" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Active Tactics</div>
                                <Zone
                                    id={`field-${myID}`}
                                    cards={G.tacticsField[myID]}
                                    type="slot"
                                    className={cn(
                                        "h-24 min-h-[90px] w-full min-w-[120px] max-w-xs border rounded-xl px-4 shadow-inner transition-colors",
                                        (activeCard?.location.area === AREAS.HAND && isGuileTactic(activeCard.card)) || !!activeGuileTactic
                                            ? "border-amber-500/50 bg-amber-500/10"
                                            : "border-zinc-700/50 bg-black/40"
                                    )}
                                    orientation="horizontal"
                                    isInteractable={!isSpectating && activeCard?.location.area === AREAS.HAND && isGuileTactic(activeCard.card)}
                                    isTargeted={!!activeCard && activeCard.location.area === AREAS.HAND && isGuileTactic(activeCard.card)}
                                    onZoneClick={() => handleTacticsFieldClick(myID)}
                                    onInfoClick={handleInfoClick}
                                />
                            </div>

                            <Hand
                                cards={G.players[myID].hand}
                                playerId={myID}
                                isCurrentPlayer={!isSpectating}
                                activeCardId={activeCard?.card.id}
                                onCardClick={handleCardClick}
                                onInfoClick={handleInfoClick}
                                onSort={() => moves.sortHand()}
                                className={cn((activeGuileTactic || (G.hasPlayedCard && !isScoutMode)) ? "opacity-50 pointer-events-none" : "")}
                            />
                        </div>

                        {/* PCのみ: Right - Actions & Status */}
                        <div className="hidden sm:flex flex-col gap-4 items-end">
                            <button
                                className={cn(
                                    "px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all transform active:scale-95",
                                    canEndTurn
                                        ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20"
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
                                <CheckCircle2 size={20} />
                                END TURN
                            </button>

                            <div className="bg-zinc-800/90 p-3 rounded-lg border border-zinc-700 flex items-center gap-3 w-48 shadow-lg">
                                <div className={cn("w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center", myID === PLAYER_IDS.P0 ? 'bg-red-600' : 'bg-blue-600')}>
                                    <Shield size={20} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-zinc-400 font-bold tracking-widest">YOU</div>
                                    <div className="font-bold">{myName}</div>
                                </div>
                            </div>
                        </div>
                    </div>
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

            {/* Exit Confirmation Modal */}
            {isExitConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
                        <h3 className="text-lg font-bold text-white mb-4">ゲームから出ますか？</h3>
                        <p className="text-zinc-400 text-sm mb-6">ロビー画面に戻ります。</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsExitConfirmOpen(false)}
                                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 rounded-lg transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={() => onLeaveRoom?.()}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-colors"
                            >
                                出る
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Background Grid Decoration */}
            <div className="fixed inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        </div>
    );
};