# バトルライン Webアプリ UI/UX改善提案書

## 1. プロジェクト概要

* **目的**: 既存の無機質な管理画面風UIから、戦術的かつ没入感のある「ゲームUI」への刷新。
* **ターゲット**: PCブラウザでのプレイ、クリック操作、音声通話併用を想定。

---

## 2. デザインコンセプト： 「Commander's Table（司令官の作戦卓）」

* **世界観**: 古代〜中世の戦場を俯瞰する司令部。
* **トーン**: **ダークモード基調（Zinc-950）**。情報のコントラストを確保しつつ、落ち着いた緊張感を演出。
* **キーワード**: 視認性、重厚感、直感的操作。

---

## 3. 画面レイアウト設計 (3層構造)

画面を縦に3分割し、プレイヤーの視線移動を最適化します。

### A. 上段：敵陣営エリア (Opponent Area)
* **手札情報**: カード裏面のみを表示（枚数確認用）。
* **ステータス**: 相手のID/名前、現在のデッキ残数。
* **戦術カード**: 相手が確保している、または使用した戦術カードを表示。

### B. 中段：戦場エリア (Battlefield - Main)
画面中央を横断する、ゲームのメインエリア。
* **フラグ（Flags）**: 
    * 中央水平線上に9つのフラグを配置。
    * **状態変化**: 獲得したプレイヤー側へ物理的に位置を移動（Y軸移動）させることで、優劣を一目で伝達。
    * **デザイン**: 単なる円形ではなく、「旗」や「盾」のアイコンを採用。
* **スロット（Slots）**:
    * 各フラグの上下にカード配置エリアを設ける。
    * **カスケード表示**: 3枚のカードを縦に少しずつ（約24px）ずらして重ねて表示。
    * **Empty状態**: 薄い点線枠で「配置可能」であることを示唆。ノイズとなる文字情報は廃止。

### C. 下段：自陣営エリア (Player Area)
* **手札 (Hand)**: 画面下部中央に大きく展開。クリックで「選択状態（浮き上がり）」に変化。
* **アクションパネル**: 
    * 右端に「End Turn」ボタンを配置（誤爆防止のため独立）。
    * 自分の役職（Commander）や戦術カードの山札へのアクセス。

---

## 4. コンポーネント詳細仕様

### ■ カード (Card)
* **サイズ**: PC画面での視認性を考慮した縦長長方形（アスペクト比 1:1.4）。
* **部隊カード**: 
    * 基本6色（赤、青、緑、橙、紫、黄）は彩度を高めに設定。
    * 背景色だけでなく、中央に固有アイコン（盾など）を配置し、色覚多様性に配慮。
* **戦術カード**:
    * 部隊カードと区別するため、枠線や背景に「ゴールド/アンバー」系を採用。
    * 中央アイコンを「巻物（Scroll）」等に変更し、特殊性を強調。

### ■ インタラクション (UX)
* **ホバー効果**:
    * 手札: `translate-y-2` (少し浮く)
    * スロット: 背景色がわずかに明るくなる。
* **選択アクション (Click)**:
    * 手札選択時: `translate-y-6` (大きく浮く) + `ring` (発光エフェクト)。
    * **ガイド機能**: カード選択中、配置可能なスロットのみをハイライト (`animate-pulse`) させる。
* **配置アクション**:
    * スロットクリックでカードが移動。`framer-motion` 等を用いたスムーズな移動アニメーションを推奨。

---

## 5. 推奨実装技術スタック (Tailwind CSS)

### カラーパレット例
| カテゴリ | クラス名 | 用途 |
| :--- | :--- | :--- |
| **背景** | `bg-zinc-950` | メイン背景 |
| | `bg-zinc-900` | パネル背景 |
| **アクセント** | `text-amber-500` | 戦術カード、強調テキスト |
| | `bg-blue-600` / `bg-red-600` | プレイヤー/敵の識別 |
| **部隊色** | `bg-red-600`, `bg-blue-600`, etc. | 各色のカード背景 |

### レイアウト実装ヒント
* **全体**: `flex flex-col min-h-screen overflow-hidden`
* **戦場グリッド**: `grid grid-cols-9 gap-2`
* **カード重ね合わせ**: 親要素に `relative`、カードに `absolute` を指定し、インデックスに応じて `top` 値を加算。

---

## 6. 今後の拡張性（オプション）

* **役（Formation）の表示**: 各列にマウスオーバーした際、現在の役（ウェッジ、フォランクス等）と合計値をツールチップで表示。
* **ログ表示**: 画面端にトースト通知形式で「Player Aが赤の10を配置」等のログをリアルタイムで流す。

---

## 7. 参考コード
```
import React, { useState } from 'react';
import { Flag, Shield, Sword, Scroll, Info, CheckCircle2 } from 'lucide-react';

/**
 * カードコンポーネント
 * @param {Object} props
 * @param {string} props.color - カードの色 (red, blue, green, orange, purple, yellow, tactic)
 * @param {number|string} props.value - カードの数字または戦術名
 * @param {boolean} props.isSelected - 選択中か
 * @param {boolean} props.isTactic - 戦術カードか
 * @param {function} props.onClick - クリック時の処理
 */
const Card = ({ color, value, isSelected, isTactic, onClick }) => {
  const colorMap = {
    red: 'bg-red-600',
    blue: 'bg-blue-600',
    green: 'bg-emerald-600',
    orange: 'bg-orange-500',
    purple: 'bg-purple-600',
    yellow: 'bg-yellow-500',
    tactic: 'bg-zinc-800 border-2 border-amber-400',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative w-20 h-28 rounded-lg shadow-xl cursor-pointer transition-all duration-200 flex flex-col items-center justify-between p-2
        ${colorMap[color] || 'bg-zinc-700'}
        ${isSelected ? '-translate-y-6 ring-4 ring-white shadow-2xl z-50' : 'hover:-translate-y-2'}
        ${isTactic ? 'text-amber-200' : 'text-white'}
      `}
    >
      <div className="w-full text-left font-bold text-lg leading-none">{value}</div>
      {isTactic ? <Scroll size={32} /> : <div className="text-3xl opacity-20"><Shield size={48} /></div>}
      <div className="w-full text-right font-bold text-lg leading-none rotate-180">{value}</div>
      
      {/* 装飾用ライン */}
      <div className="absolute inset-1 border border-white/20 rounded-md pointer-events-none"></div>
    </div>
  );
};

/**
 * 戦場の1スロット (フラグ + 両者のカード置き場)
 */
const BattlefieldSlot = ({ index, playerCards, opponentCards, flagStatus, isHighlight, onSlotClick }) => {
  // 3枚のカードを少しずつ重ねて表示するためのスタイル
  const renderStackedCards = (cards) => (
    <div className="relative h-40 w-20 flex flex-col items-center">
      {cards.map((card, i) => (
        <div 
          key={i} 
          className="absolute transition-all duration-300"
          style={{ top: `${i * 24}px`, zIndex: i }}
        >
          <Card color={card.color} value={card.value} />
        </div>
      ))}
      {cards.length === 0 && (
        <div className={`w-20 h-28 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center`}>
          <span className="text-white/5 text-xs">SLOT {index + 1}</span>
        </div>
      )}
    </div>
  );

  return (
    <div 
      className={`flex flex-col items-center gap-4 p-2 rounded-xl transition-colors duration-300 ${isHighlight ? 'bg-white/5 ring-2 ring-white/20' : ''}`}
      onClick={() => onSlotClick(index)}
    >
      {/* 相手側カード */}
      <div className="flex flex-col-reverse">
         {renderStackedCards(opponentCards)}
      </div>

      {/* フラグ */}
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 shadow-lg
        ${flagStatus === 'player' ? 'bg-blue-500 -translate-y-2' : 
          flagStatus === 'opponent' ? 'bg-red-500 translate-y-2' : 
          'bg-zinc-700 ring-2 ring-zinc-500'}
      `}>
        <Flag className={flagStatus ? 'text-white' : 'text-zinc-500'} size={24} />
      </div>

      {/* 自分側カード */}
      <div className="relative cursor-pointer group" onClick={() => onSlotClick(index)}>
        {renderStackedCards(playerCards)}
        {isHighlight && playerCards.length < 3 && (
          <div className="absolute inset-0 bg-white/10 rounded-lg animate-pulse border-2 border-white/50"></div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [selectedCardIdx, setSelectedCardIdx] = useState(null);
  const [hand, setHand] = useState([
    { id: 1, color: 'red', value: 9 },
    { id: 2, color: 'blue', value: 7 },
    { id: 3, color: 'green', value: 10 },
    { id: 4, color: 'purple', value: 2 },
    { id: 5, color: 'tactic', value: 'ALEX', isTactic: true },
    { id: 6, color: 'orange', value: 5 },
    { id: 7, color: 'yellow', value: 8 },
  ]);

  // デモ用データ
  const board = Array(9).fill(null).map((_, i) => ({
    player: i === 0 ? [{ color: 'red', value: 10 }, { color: 'red', value: 9 }] : [],
    opponent: i === 0 ? [{ color: 'blue', value: 10 }] : [],
    status: i === 4 ? 'opponent' : (i === 0 ? 'none' : 'none')
  }));

  const handleCardClick = (idx) => {
    setSelectedCardIdx(selectedCardIdx === idx ? null : idx);
  };

  const handleSlotClick = (slotIdx) => {
    if (selectedCardIdx === null) return;
    // 本来はここで boardgame.io の moves を呼ぶ
    console.log(`Placed card ${hand[selectedCardIdx].value} to slot ${slotIdx}`);
    setSelectedCardIdx(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 overflow-hidden flex flex-col bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">
      
      {/* ヘッダー・相手情報 */}
      <header className="flex justify-between items-start mb-4">
        <div className="flex gap-4 items-center">
          <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full border-2 border-white/20 flex items-center justify-center">
              <Sword size={20} />
            </div>
            <div>
              <div className="text-xs text-zinc-400">OPPONENT</div>
              <div className="font-bold">Player Two</div>
            </div>
          </div>
          <div className="flex gap-1">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="w-8 h-12 bg-zinc-800 border border-zinc-700 rounded-sm shadow-sm"></div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/5">
          <div className="flex items-center gap-2 text-zinc-400">
            <Info size={16} />
            <span className="text-sm font-medium">YOUR TURN</span>
          </div>
          <div className="h-4 w-[1px] bg-zinc-700"></div>
          <button className="text-sm font-bold text-amber-500 hover:text-amber-400">MENU</button>
        </div>
      </header>

      {/* メイン戦場エリア */}
      <main className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-9 gap-2 max-w-7xl w-full">
          {board.map((slot, i) => (
            <BattlefieldSlot
              key={i}
              index={i}
              playerCards={slot.player}
              opponentCards={slot.opponent}
              flagStatus={slot.status}
              isHighlight={selectedCardIdx !== null}
              onSlotClick={handleSlotClick}
            />
          ))}
        </div>
      </main>

      {/* フッター・自分エリア */}
      <footer className="mt-8 flex items-end justify-between gap-8 max-w-6xl mx-auto w-full">
        
        {/* ステータス / 山札 */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Troop Deck</span>
             <div className="w-16 h-24 bg-zinc-800 rounded-lg border-2 border-zinc-700 shadow-xl flex items-center justify-center flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-xl font-bold">54</span>
             </div>
          </div>
          <div className="flex flex-col gap-2">
             <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Tactics</span>
             <div className="w-16 h-24 bg-zinc-900 rounded-lg border-2 border-amber-600/50 shadow-xl flex items-center justify-center flex-col">
                <span className="text-xl font-bold text-amber-500">10</span>
             </div>
          </div>
        </div>

        {/* 手札 */}
        <div className="flex-1 flex justify-center items-end h-32">
          <div className="flex gap-2">
            {hand.map((card, i) => (
              <Card
                key={card.id}
                color={card.color}
                value={card.value}
                isTactic={card.isTactic}
                isSelected={selectedCardIdx === i}
                onClick={() => handleCardClick(i)}
              />
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-col gap-3 items-end">
          <button className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center gap-2">
            <CheckCircle2 size={20} />
            END TURN
          </button>
          
          <div className="bg-zinc-800 p-3 rounded-lg border border-zinc-700 flex items-center gap-3 w-48">
            <div className="w-10 h-10 bg-blue-600 rounded-full border-2 border-white/20 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <div className="text-xs text-zinc-400">YOU</div>
              <div className="font-bold">Commander</div>
            </div>
          </div>
        </div>

      </footer>

      {/* 背景の装飾的なグリッド */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>
  );
}
```
