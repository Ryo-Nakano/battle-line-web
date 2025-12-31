# ターンステータス スピナー機能仕様書

## 1. 概要

相手のターンで待機中であることを視覚的に伝えるため、ターンステータス表示にアニメーションスピナーを追加する。
自分のターンと待機中で異なるスピナーを表示し、状態を直感的に把握できるようにする。

## 2. 現状

| UI | 表示場所 | YOUR TURN | WAITING |
|----|----------|-----------|---------|
| PC | ヘッダー右上 (`Board.tsx` L566-570) | `<Info>` アイコン + "YOUR TURN" | `<Info>` アイコン + "WAITING..." |
| Mobile | ヘッダー右エリア (`MobileGameInfo.tsx` L115-122) | "YOUR TURN" (アイコンなし) | "WAIT" (アイコンなし) |

## 3. 要件

### 3.1 スピナーデザイン

| 状態 | アニメーション | イメージ |
|------|----------------|----------|
| **YOUR TURN** | バウンスするドット3つ（波状アニメーション） | 元気な動きで「操作してください」感を出す |
| **WAITING** | 回転するアーク（シンプルなスピナー） | 静かな動きで「待機中」感を出す |

### 3.2 テキスト統一

| UI | YOUR TURN | WAITING |
|----|-----------|---------|
| PC | YOUR TURN | WAITING |
| Mobile | YOUR TURN | WAITING |

※ 現在の Mobile の "WAIT" を "WAITING" に統一

### 3.3 表示位置

- **PC**: 現在の `<Info>` アイコンをスピナーに置き換え（テキストの左側）
- **Mobile**: テキストの左側にスピナーを追加

### 3.4 実装方式

- CSS/SVGアニメーションで実装（Canvas不使用）
- 共通コンポーネント `TurnStatusIndicator` を作成し、PC/Mobileで共有

## 4. 技術設計

### 4.1 新規コンポーネント

#### `src/components/TurnStatusIndicator.tsx`

```tsx
interface TurnStatusIndicatorProps {
  isMyTurn: boolean;
  size?: 'sm' | 'md'; // sm: モバイル用, md: PC用
}
```

### 4.2 スピナー実装詳細

#### YOUR TURN: バウンスドット

```css
/* 3つのドットが順番に上下にバウンス */
@keyframes bounce-wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-25%); }
}
```

- ドット数: 3
- 色: `#3b82f6` (blue-500)
- アニメーション遅延: 各ドットで 0ms, 150ms, 300ms

#### WAITING: 回転アーク

```css
/* 円弧が回転するスピナー */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

- 色: `#94a3b8` (slate-400) - 控えめな色
- 背景トラック: `rgba(148, 163, 184, 0.2)`
- 回転速度: 1.5秒/回転

### 4.3 修正ファイル一覧

| ファイル | 変更内容 |
|----------|----------|
| `src/components/TurnStatusIndicator.tsx` | 【新規】スピナーコンポーネント |
| `src/board/Board.tsx` | `<Info>` アイコンを `<TurnStatusIndicator>` に置き換え |
| `src/board/MobileGameInfo.tsx` | テキスト前に `<TurnStatusIndicator>` を追加、"WAIT" → "WAITING" |

## 5. UIイメージ

### 5.1 PC (YOUR TURN)

```
┌─────────────────────────────────────────┐
│  • • •  YOUR TURN  │  ☰  │
│ (bouncing)                              │
└─────────────────────────────────────────┘
```

### 5.2 PC (WAITING)

```
┌─────────────────────────────────────────┐
│   ◌   WAITING     │  ☰  │
│ (spinning arc)                          │
└─────────────────────────────────────────┘
```

### 5.3 Mobile (YOUR TURN / WAITING)

```
┌──────────────────────────────────────────────────────────┐
│ [相手情報]  |  山札  |  • • • YOUR TURN  |  ☰  │
└──────────────────────────────────────────────────────────┘
```

## 6. 検証項目

- [ ] PC: YOUR TURN 時にバウンスドットが表示される
- [ ] PC: WAITING 時に回転アークが表示される
- [ ] Mobile: YOUR TURN 時にバウンスドットが表示される
- [ ] Mobile: WAITING 時に回転アークが表示される
- [ ] Mobile: テキストが "WAITING" に統一されている
- [ ] アニメーションがスムーズに動作する（パフォーマンス問題なし）
