# バトルライン（デジタル・テーブルトップ版）実装計画書

## 基本方針
*   **UI駆動**: ルール判定を行わず、ユーザーが物理的なボードゲームのように「自由にコンポーネントを操作できる」ことを最優先する。
*   **技術選定**:
    *   State Management: `boardgame.io` (同期・ターン管理)
    *   UI Library: `React 18` + `@dnd-kit` (ドラッグ＆ドロップ)
    *   Styling: `Tailwind CSS` (高速開発)
    *   Language: Logicは `JavaScript (ESM)`, UI/Typesは `TypeScript`

## 実装ステップ詳細

### Step 1: 開発環境とベースライブラリのセットアップ
*   **目的**: スタイリングとDnD操作の基盤を作る。
*   **作業**:
    1.  **Tailwind CSS 導入**:
        *   `npm install -D tailwindcss postcss autoprefixer`
        *   設定ファイル作成 (`tailwind.config.js`, `postcss.config.js`) と `src/index.css` へのディレクティブ追加。
        *   `tailwind-merge`, `clsx` の導入（動的なクラス制御のため）。
    2.  **dnd-kit 導入**:
        *   `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
        *   React 18 環境での動作確認。

### Step 2: データ構造の定義とゲーム初期化 (Game State)
*   **目的**: アプリケーション全体で扱うデータの型と初期状態を定義する。
*   **ファイル**: `src/types/index.ts`, `src/Game.js`
*   **詳細設計**:
    *   **Card型**:
        ```typescript
        type Card = {
          id: string;      // 例: "troop-red-1", "tactic-alexander"
          type: 'troop' | 'tactic';
          color?: string;  // 部隊カード用 (例: 'red', 'blue')
          value?: number;  // 部隊カード用 (例: 1, 10)
          name?: string;   // 戦術カード用 (例: 'Alexander', 'Fog')
          faceDown?: boolean; // 手札など、裏向きにする必要がある場合
        };
        ```
    *   **FlagState型**:
        ```typescript
        type FlagState = {
          id: string; // 例: "flag-0", "flag-1"
          owner: '0' | '1' | null; // null: 中立, '0': Player 0, '1': Player 1
          p0_slots: Card[]; // Player 0 側のカード配置スロット
          p1_slots: Card[]; // Player 1 側のカード配置スロット
          tactic_zone: Card[]; // そのフラッグに影響する地形戦術カード（霧、泥沼など）
        };
        ```
    *   **PlayerState型**:
        ```typescript
        type PlayerState = {
          hand: Card[]; // 現在の手札
        };
        ```
    *   **GameState (G)型**:
        *   `secret`: 隠匿情報（各プレイヤーの手札、デッキの中身）。※boardgame.ioの `playerView` でフィルタリングするため。
            ```typescript
            interface GameState {
              flags: FlagState[]; // 9つのフラッグの状態
              players: {
                [playerID: string]: PlayerState; // Player 0, Player 1 の状態
              };
              troopDeck: Card[]; // 部隊山札
              tacticDeck: Card[]; // 戦術山札
              discardPile: Card[]; // 捨て札置き場
              // その他、ゲーム全体の状態（例: 先攻プレイヤーID、勝利条件達成状況など）
            }
            ```
        *   `board`: 9つのフラッグエリアを配列で管理。
            *   ※「自由配置」は、各プレイヤーごとのスロット（リスト）に対する追加・並び替えとして表現する（絶対座標管理は複雑すぎるため避ける）。
    *   **Setup関数 (`src/Game.js`)**:
        *   60枚の部隊カード (`Card` 型で生成)。
        *   10枚の戦術カード (`Card` 型で生成)。
        *   生成したカードをシャッフルし、`troopDeck` と `tacticDeck` にセット。
        *   各プレイヤーに7枚ずつ部隊カードを配る（`hands` に追加）。
        *   9つのフラッグを初期化し、`owner` は `null`、`p0_slots`, `p1_slots`, `tactic_zone` は空配列とする。
        *   `discardPile` を空配列で初期化。

### Step 3: 操作ロジックの実装 (Moves)
*   **目的**: ユーザーの操作により状態を変化させる関数群を実装する。
*   **ファイル**: `src/moves.js`
*   **実装するMove**:
    *   `drawCard({ G, ctx }, deckType: 'troop' | 'tactic')`:
        *   指定された `deckType` からカードを1枚引き、`ctx.currentPlayer` の `hand` に追加する。
        *   山札が空の場合はドローできないようにする。
    *   `moveCard({ G, ctx }, payload: { cardId: string, from: LocationInfo, to: LocationInfo })`:
        *   **LocationInfo型**:
            ```typescript
            type LocationInfo = {
              area: 'hand' | 'board' | 'deck' | 'discard';
              playerId?: '0' | '1'; // 'hand'の場合のみ
              flagIndex?: number;   // 'board'の場合のみ (0-8)
              slotType?: 'p0_slots' | 'p1_slots' | 'tactic_zone'; // 'board'かつ'flagIndex'がある場合
              deckType?: 'troop' | 'tactic'; // 'deck'の場合
            };
            ```
        *   `cardId` で指定されたカードを `from` から `to` へ移動させる。
        *   **対応する移動パターン**:
            *   手札 ↔ 盤面 (`p0_slots`, `p1_slots`, `tactic_zone`)
            *   盤面 ↔ 盤面
            *   手札 → 捨て札
            *   盤面 → 捨て札
            *   手札 → 山札 (「偵察」用)
        *   移動元からの削除、移動先への追加を正確に行う。
        *   `boardgame.io` の `events.setStage` などを使用して、カード移動後の状態更新をトリガーできる可能性がある。
    *   `claimFlag({ G, ctx }, flagIndex: number)`:
        *   指定された `flagIndex` のフラッグの `owner` を `ctx.currentPlayer` に切り替える（または `null` に戻すトグル機能）。
    *   `shuffleDeck({ G, ctx }, deckType: 'troop' | 'tactic')`:
        *   指定された山札をシャッフルする（「偵察」カード使用時など）。

### Step 4: UIコンポーネントの実装 (Dumb Components)
*   **目的**: ロジックを持たない表示専用コンポーネントを作成する。
*   **ファイル**: `src/board/` 配下
*   **コンポーネント**:
    *   `Card.tsx`:
        *   `Card` 型を受け取り、部隊カード（色・数字）、戦術カード（名前）、裏面（`faceDown` が `true` の場合）を表示。
        *   Tailwind CSS でサイズ、影、ホバーエフェクトなどをスタイリング。
        *   `onClick` プロパティを受け取り、クリックイベントを親に通知する。
        *   `isSelected` プロパティにより、選択状態（ハイライト）を表現する。
    *   `Flag.tsx`:
        *   `FlagState` を受け取り、赤いポーンのような形状と、`owner` に応じた確保マーカー（色付きの光やアイコン）を表示。
        *   クリックハンドラを持ち、`moves.claimFlag` を呼び出す。
    *   `Zone.tsx`:
        *   カード配置領域として機能。
        *   自身のクリック (`onZoneClick`) と、内部カードのクリック (`onCardClick`) を処理する。
        *   `FlagState` 内の `p0_slots`, `p1_slots`, `tactic_zone` や、`PlayerState` の `hand` など、カードリストをレンダリングするコンポーネントのラッパーとなる。
    *   `Hand.tsx`:
        *   `PlayerState` の `hand` を受け取り、カードを横一列に表示。スクロール機能または縮小表示機能（`specs/game_rule.md`参照）を実装。
        *   クリックイベントを `Zone` へ伝播させる。

### Step 5: メインボードとUI操作の統合 (Click-to-Move)
*   **目的**: ゲーム状態とUIインタラクションを接続する。
*   **ファイル**: `src/board/Board.tsx` (または `src/App.tsx` に近い場所)
*   **作業**:
    *   `boardgame.io` の `Client` コンポーネント内でレンダリングされるメインUI。
    *   **状態管理**: `activeCard` (選択中のカード) を `useState` で管理する。
    *   **イベントハンドリング**:
        *   **カードクリック**: `activeCard` をセットまたは解除（トグル）。
        *   **Zoneクリック**: `activeCard` がある場合、その場所への `moves.moveCard` を呼び出す。
    *   `specs/game_rule.md` に定義された「センターエリア（戦線）」「プレイエリア（カード配置ゾーン）」「ハンドエリア」「デッキエリア」をCSSグリッド等でレイアウトする。
    *   **視点制御**: `playerID` に応じて盤面を反転表示することで、常に自分の陣地が手前に来るように表示する（React Contextなどで `currentPlayerID` を提供し、CSS/コンポーネントの描画順を制御）。

### Step 6: 固有ルール・機能のUIサポート
*   **目的**: バトルライン特有の操作をサポートする。
*   **作業**:
    *   **「泥沼」対応**:
        *   `FlagState.tactic_zone` に「泥沼」カードがある場合、そのフラッグの `p0_slots` および `p1_slots` の表示領域を広げる、またはカードが4枚以上置かれても視認性が保たれるようなCSS（縦にずらすなど）を適用。
    *   **「偵察」対応**:
        *   「偵察」カード使用時、一時的に手札上限を超えてドローできるUIを許容（スクロールや縮小表示で対応）。
        *   手札から任意の2枚を山札（`troopDeck` または `tacticDeck`）の上にドラッグして戻せるようにする。デッキを `DropZone` として機能させる。
    *   **デッキ選択**: 部隊山札と戦術山札それぞれにクリック可能なUI要素を設け、クリック時に `moves.drawCard` を呼び出す。
    *   **捨て札確認**: 捨て札置き場をクリックすると、捨て札一覧をモーダルなどで表示する機能。
    *   **カーソル表示 (推奨)**: `boardgame.io` の `PlayerView` やカスタムロジックを利用して、相手プレイヤーのカーソル位置（またはドラッグ中のカード）をリアルタイム表示する機能を検討。

### Step 7: サーバー実装とオンライン化
*   **目的**: 異なるデバイス間でオンライン対戦（マルチプレイヤー）を可能にする。
*   **ファイル**: `server.js`, `src/App.tsx`
*   **作業**:
    1.  **サーバー実装 (`server.js`)**:
        *   `boardgame.io/server` を使用してゲームサーバーを構築する。
        *   `Game.js` (ロジック) をインポートしてサーバーに登録する。
        *   静的ファイル（`dist/`）の配信設定を行う（フロントエンドとバックエンドを同一起源でホストする場合）。
        *   ポート番号の設定（環境変数 `PORT` 対応）。
    2.  **クライアント設定変更 (`src/App.tsx`)**:
        *   `multiplayer: Local()` を `multiplayer: SocketIO({ server: '...' })` に変更する。
        *   開発環境 (`localhost`) と本番環境で接続先サーバーURLを自動で切り替えるロジックを実装する。
    3.  **依存関係の整理**:
        *   `koa`, `koa-static` など、サーバー実行に必要なパッケージを `package.json` に追加する。
    4.  **動作確認**:
        *   `npm run build` でフロントエンドをビルド。
        *   `node server.js` でサーバーを起動。
        *   複数のブラウザウィンドウ（または別デバイス）でアクセスし、同期が取れているか確認する。

## 実装上の注意点

*   **TypeScript と JavaScript の混在**:
    *   `server.js`, `src/Game.js`, `src/moves.js` は `JavaScript (ES Modules)` で記述する。
    *   `src/types/index.ts` で型を定義し、UI (`.tsx`) 側で厳密な型チェックを行う。
    *   `Game.js` や `moves.js` の関数にはJSDocで型ヒントを記述し、IDEの補完を助ける。
*   **React バージョン**: `boardgame.io` との互換性を考慮し、React 18を使用。
*   **状態の可視性**: `boardgame.io` の `playerView` を活用し、`G.secret` に格納された手札やデッキの内容が適切なプレイヤーにのみ表示されるようにする。

---
