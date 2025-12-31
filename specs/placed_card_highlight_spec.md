# 配置カードハイライト機能仕様

## 概要
カードが配置された際に、そのカードを3秒間ハイライト表示し、視認性を向上させる機能。
自分・相手の両画面で同様にハイライトが表示される。

---

## 背景
相手が直近のターンで出したカードが一目でわかりにくいため、配置直後のカードを視覚的に強調することで、ゲームの流れを追いやすくする。

---

## 要件

### 1. ハイライト対象
| 項目 | 仕様 |
|------|------|
| 対象カード | 部隊カード・戦術カードの両方 |
| 対象操作 | カード配置のみ（Guileタクティクスによる移動・破棄は対象外） |

### 2. ハイライトタイミング
| 項目 | 仕様 |
|------|------|
| 開始 | カードが配置された瞬間 |
| 継続時間 | 3秒 |
| 終了 | 3秒経過後、自動的に通常状態に戻る |

### 3. 表示対象
| 画面 | 表示 |
|------|------|
| カードを配置したプレイヤーの画面 | ハイライト表示される |
| 相手プレイヤーの画面 | ハイライト表示される |

### 4. 視覚スタイル
| 項目 | 仕様 |
|------|------|
| エフェクト | カードの周りに光る枠（glow effect） |
| 色 | ゴールド系またはアクセントカラー（既存デザインとの調和を考慮） |

### 5. 対象プラットフォーム
- PC UI
- モバイル UI

---

## 実装詳細

### 1. データ構造

#### `src/Game.js`（ゲーム状態）
*   配置されたカードを記録する新しいフィールドを追加:
    ```javascript
    // setup() 内
    lastPlacedCard: null,
    // 形式: { flagIndex: number, slotIndex: number, playerID: string, timestamp: number } | null
    ```

#### `src/types/index.ts`
*   `GameState` に追加:
    ```typescript
    lastPlacedCard: {
      flagIndex: number;
      slotIndex: number;
      playerID: string;
      timestamp: number;
    } | null;
    ```

### 2. ロジック (`src/moves.js`)

#### `placeCard` move の拡張
```javascript
// カード配置時に lastPlacedCard を更新
G.lastPlacedCard = {
  flagIndex,
  slotIndex: slot.length - 1, // 配置後のインデックス
  playerID,
  timestamp: Date.now(),
};
```

### 3. UI (`src/board/SlotCard.tsx` または関連コンポーネント)

#### ハイライト判定ロジック
```typescript
const isHighlighted = useMemo(() => {
  if (!lastPlacedCard) return false;
  if (lastPlacedCard.flagIndex !== flagIndex) return false;
  if (lastPlacedCard.slotIndex !== slotIndex) return false;
  if (lastPlacedCard.playerID !== slotPlayerID) return false;
  return true;
}, [lastPlacedCard, flagIndex, slotIndex, slotPlayerID]);
```

#### タイマーによる自動解除
```typescript
const [showHighlight, setShowHighlight] = useState(false);

useEffect(() => {
  if (isHighlighted) {
    setShowHighlight(true);
    const timer = setTimeout(() => {
      setShowHighlight(false);
    }, 3000);
    return () => clearTimeout(timer);
  } else {
    setShowHighlight(false);
  }
}, [isHighlighted, lastPlacedCard?.timestamp]);
```

#### CSSクラス適用
```tsx
<div className={`card ${showHighlight ? 'card--highlighted' : ''}`}>
  ...
</div>
```

### 4. CSS (`src/board/Card.css` または関連ファイル)

```css
.card--highlighted {
  box-shadow: 0 0 12px 4px rgba(255, 200, 100, 0.8);
  animation: glow-pulse 0.5s ease-in-out 2;
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 12px 4px rgba(255, 200, 100, 0.8);
  }
  50% {
    box-shadow: 0 0 20px 8px rgba(255, 200, 100, 1);
  }
}
```

### 5. モバイル対応 (`src/board/MobileBoard.tsx`)
*   PC版と同様のロジックを適用
*   カードコンポーネントが共通化されていれば追加対応は不要

---

## 検証項目

| # | シナリオ | 期待結果 |
|---|----------|----------|
| 1 | 部隊カードを配置 | 配置したカードが3秒間ハイライトされる |
| 2 | 戦術カードを配置 | 配置したカードが3秒間ハイライトされる |
| 3 | 3秒経過後 | ハイライトが消え、通常表示に戻る |
| 4 | 相手がカードを配置 | 自分の画面でも相手のカードがハイライトされる |
| 5 | 連続してカードを配置（自分→相手） | 最新の配置カードのみがハイライトされる |
| 6 | PC UIでの表示 | glow effectが正しく表示される |
| 7 | モバイル UIでの表示 | glow effectが正しく表示される |
| 8 | Guileタクティクスでカード移動 | ハイライトされない |

---

## 備考

*   `timestamp` を使用することで、同じ位置に連続してカードが置かれた場合も正しくハイライトをリセットできる
*   ハイライトの3秒はUI側のタイマーで管理し、ゲーム状態 (`lastPlacedCard`) はクリアしない（シンプルな実装のため）
