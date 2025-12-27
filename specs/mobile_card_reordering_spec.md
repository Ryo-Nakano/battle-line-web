# モバイル版カード並び替え機能仕様書

## 概要
PC版と同様に、モバイルUIでも手札の並び替え（ソート）を可能にします。これにより、モバイル端末でも色や数字順に手札を整理できるようになります。

## 現状の実装
- **PC (`Board.tsx` / `Hand.tsx`)**:
  - `Board.tsx` が `Hand` コンポーネントに `onSort={() => moves.sortHand()}` を渡しています。
  - `Hand.tsx` は `onSort` プロパティが存在する場合、ソートボタン（上下矢印アイコン）を表示します。
- **モバイル (`MobileBoard.tsx` / `MobileHand.tsx`)**:
  - `MobileBoard.tsx` は `MobileHand` コンポーネントに `onSort` を渡していません。
  - `MobileHand.tsx` は `onSort` プロパティを受け取っておらず、ソートボタンもありません。

## 変更内容

### 1. `MobileHand.tsx` の更新
- `MobileHandProps` に `onSort?: () => void` を追加します。
- `ExpandedModal`（手札展開ビュー）にソートボタンを追加します。
  - **配置**: "YOUR HAND" ヘッダーの近く、またはモーダル内の適切な位置。
  - **アイコン**: `ArrowUpDown`（PC版と同様）などを使用。
  - **アクション**: クリック時に `onSort()` を実行します。

### 2. `MobileBoard.tsx` の更新
- `MobileHand` コンポーネントに `onSort={() => moves.sortHand()}` を渡します。

## UI/UX 詳細
- ソートボタンは、手札が展開された状態（`ExpandedModal`）でのみ表示・使用可能とします。
- 既存のモバイルデザイン（Zinc/Amber配色）と調和し、タップしやすいデザインにします。

## 検証計画
- **手動検証**:
  1. モバイルビュー（幅1024px未満）でゲームを開く。
  2. 手札プレビューをタップして展開ビューを開く。
  3. ソートボタンが表示されていることを確認する。
  4. ソートボタンをタップし、手札が並び替えられることを確認する。
