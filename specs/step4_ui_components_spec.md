# Step 4: UIコンポーネントの実装 (Dumb Components)

## 目的
ゲームの状態（データ）を受け取り、画面に描画する「Dumb Components（プレゼンテーションコンポーネント）」を `src/board/` 配下に実装する。
これらのコンポーネントはロジックを持たず、データの表示と `dnd-kit` を用いたドラッグ＆ドロップのイベント発火のみを担当する。

## 作業内容

### 1. `src/board/Card.tsx` の実装
個々のカードを表示するコンポーネント。ドラッグ操作の起点（Draggable）となる。

*   **Props**:
    ```typescript
    import { Card as CardType } from '../types';

    interface CardProps {
      card: CardType;
      isDraggable?: boolean; // デフォルト true。相手の手札などドラッグ不可の場合に使用
      isSelected?: boolean;  // 選択状態（予備）
    }
    ```
*   **機能**:
    *   `@dnd-kit/core` の `useDraggable` を使用。
    *   `id` は `card.id` を使用。
    *   `data` プロパティに `card` オブジェクト全体を含める（ドロップ時に参照するため）。
*   **スタイリング (Tailwind CSS)**:
    *   サイズ: 幅60px, 高さ90px程度 (レスポンシブ調整可)。
    *   形状: 角丸 (`rounded-md` or `rounded-lg`)。
    *   色:
        *   部隊カード: `card.color` に応じたボーダーまたは背景色。
        *   戦術カード: グレーまたは特別なデザイン。
        *   裏面: 共通の裏面デザイン（単色など）。
    *   内容:
        *   部隊カード: 中央に `value` を大きく表示。
        *   戦術カード: 中央に `name` を表示。
    *   状態:
        *   ドラッグ中 (`isDragging`): 透明度を下げる (`opacity-50`)。

### 2. `src/board/Flag.tsx` の実装
9つのフラッグ（ポーン）を表示するコンポーネント。

*   **Props**:
    ```typescript
    import { FlagState } from '../types';

    interface FlagProps {
      flag: FlagState;
      onClaim?: (id: string) => void; // クリック時のハンドラ
    }
    ```
*   **機能**:
    *   クリック時に `onClaim` を実行。
*   **スタイリング**:
    *   形状: ポーン（円形の上に小さな円、または `svg` アイコン）。
    *   状態:
        *   `owner` が `null`: 中立色（グレー、ベージュ）。
        *   `owner` が存在する: プレイヤーカラー（Player 0: 赤, Player 1: 青 など）に点灯。

### 3. `src/board/Zone.tsx` の実装
カードを配置できる領域（スロット）。ドロップ操作の受け皿（Droppable）となる。

*   **Props**:
    ```typescript
    import { ReactNode } from 'react';
    import { Card as CardType } from '../types';

    interface ZoneProps {
      id: string; // Droppable ID (例: "p0-slot-flag0")
      cards: CardType[]; // 現在配置されているカードのリスト
      type?: 'slot' | 'tactic' | 'deck' | 'discard'; // ゾーンの種類によるスタイル分け
      children?: ReactNode; // 自由なコンテンツ（ラベルなど）
      orientation?: 'horizontal' | 'vertical'; // カードの並べ方
      maxCards?: number; // 最大枚数（スタイル調整用、制限ロジックはここには持たない）
    }
    ```
*   **機能**:
    *   `@dnd-kit/core` の `useDroppable` を使用。
    *   受け取った `cards` をマップし、`Card` コンポーネントをレンダリングする。
*   **スタイリング**:
    *   枠線: 点線 (`border-dashed`) で領域を示す。
    *   レイアウト: Flexbox でカードを並べる。
        *   `slot`: カードを少し重ねて配置 (`-ml-8` など) して省スペース化。

### 4. `src/board/Hand.tsx` の実装
プレイヤーの手札領域。

*   **Props**:
    ```typescript
    import { Card as CardType } from '../types';

    interface HandProps {
      cards: CardType[];
      playerId: string;
      isCurrentPlayer: boolean;
    }
    ```
*   **機能**:
    *   `Zone` コンポーネントのラッパー、または独自の Droppable 領域。
    *   自分の手札 (`isCurrentPlayer` true) の場合、カードは表向き。
    *   相手の手札の場合、カードは裏向き (`card.faceDown = true` として `Card` に渡す、あるいは `Card` 自体が `faceDown` プロパティを持っているのでデータ側で制御されていることを期待するが、表示側で強制も可)。
*   **スタイリング**:
    *   画面下部（自分）または上部（相手）に固定、またはメインボード外に配置。
    *   カードは横一列に並ぶ。枚数が多い場合はスクロールまたは縮小。

## 完了定義
1.  上記4つのファイル (`src/board/*.tsx`) が作成されていること。
2.  各コンポーネントが型エラーなくコンパイルできること（`src/types` を正しくインポートしている）。
3.  `dnd-kit` のフック (`useDraggable`, `useDroppable`) が正しく組み込まれていること。
