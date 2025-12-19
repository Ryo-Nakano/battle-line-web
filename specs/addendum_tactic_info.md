# 追加要望: 戦術カードの効果確認機能

## 概要
戦術カードの右上にインフォメーションアイコンを表示し、クリックするとそのカードの効果説明をモーダルで表示する。

## 変更点

### 1. データ定義 (`src/constants/tactics.ts`)
*   戦術カードごとの効果説明テキストを定義する。
    *   キー: カード名 (lowercase)
    *   値: `{ title: string, description: string, category: 'Leader' | 'Environment' | 'Guile' }`

### 2. UI (`src/board/Card.tsx`)
*   **Props追加**:
    *   `onInfoClick?: (card: CardType) => void`
*   **レンダリング**:
    *   戦術カード (`type === 'tactic'`) かつ 表向き (`!faceDown`) の場合、右上に「i」アイコンボタンを表示。
    *   ボタンは `absolute` ポジショニングで配置。
    *   クリック時に `onInfoClick(card)` を実行（バブリング防止）。

### 3. UI (`src/board/CardHelpModal.tsx`)
*   **Props**:
    *   `isOpen`: boolean
    *   `onClose`: () => void
    *   `card`: CardType | null
*   **表示内容**:
    *   カード名 (Title)
    *   カテゴリタグ
    *   説明文 (Description)
    *   カード自体のプレビュー（オプション）

### 4. 統合 (`src/board/Board.tsx`)
*   **State**: `const [infoModalCard, setInfoModalCard] = useState<CardType | null>(null);`
*   **Handler**: `const handleInfoClick = (card: CardType) => setInfoModalCard(card);`
*   **Render**:
    *   `Card` コンポーネントに `onInfoClick={handleInfoClick}` を渡す。
    *   `CardHelpModal` を配置し、`infoModalCard` を渡す。

## 戦術カードデータ案
*   **Alexander, Darius**: 「ワイルドカード。任意の色・数字の部隊カードとして扱える。」
*   **Companion, ShieldBearer**: 「数字のワイルドカード。色は指定色ではなく、任意の色として扱える（数字は8/1, 2/3等ではなく任意）。」-> 正確には「任意の色・数字8(Companion)/数字1,2,3(ShieldBearer)として扱える」など。ルール詳細を確認して記述。
*   **Fog (霧)**: 「このフラッグでは、役（フォーメーション）が無効になり、単純な数字の合計値のみで勝負する。」
*   **Mud (泥沼)**: 「このフラッグのカードスロットが4枚に増える。」
*   **Scout (偵察)**: 「山札から合計3枚引き、手札に加え、その後手札から2枚を選んで山札の上に戻す。」
*   **Redeploy (再配置)**: 「自分の配置済みの部隊カード（確保済みフラッグを除く）を1枚選び、手札に戻すか、空いている他のスロットへ移動させる。」
*   **Deserter (脱走)**: 「相手の配置済みの部隊カード（確保済みフラッグを除く）を1枚選び、捨て札にする。」
*   **Traitor (裏切り)**: 「相手の配置済みの部隊カード（確保済みフラッグを除く）を1枚選び、自分の空いているスロットへ移動させる。」
