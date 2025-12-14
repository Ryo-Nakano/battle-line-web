# カードゲームアプリ 開発設計書

## 1. プロジェクト概要

### 目的
学習および友人との対戦用

### ジャンル
2人対戦型ターン制カードゲーム

### 主要要件
*   リアルタイム対戦（WebSocket）
*   低コスト運用（無料枠活用）
*   保守性の高い状態管理

## 2. 技術スタック (Tech Stack)

### Frontend (クライアント)
*   **Framework**: React 18 (boardgame.io との互換性のため v19 ではなく v18 を採用)
*   **Build Tool**: Vite (高速な開発サーバーとビルド環境)
*   **Language**: TypeScript (UIコンポーネントや型定義に使用)
*   **Styling**: Tailwind CSS (または CSS Modules) (素早いスタイリングのため)

### Backend (サーバー)
*   **Runtime**: Node.js (v20/v22 等のLTS)
*   **Entry Point**: `node server.js` (ES Modules として実行)
*   **Communication**: WebSocket (boardgame.io 内部で socket.io を使用)

### Game Engine & State Management
*   **Core Library**: boardgame.io
    *   **Game Logic**: ターン管理、勝敗判定、フェーズ管理を担当。
    *   **Implementation**: 互換性と実行の容易さを優先し、共有ロジック部分は JavaScript (`.js`) で記述する。

## 3. インフラ・デプロイ構成 (Infrastructure)

学習用・小規模利用に最適な「Frontend分離型 + 無料枠構成」を採用する。

| 役割           | サービス名 | プラン      | 選定理由                                  |
| :------------- | :--------- | :---------- | :---------------------------------------- |
| Frontend Host  | Vercel     | Hobby (Free)| Reactアプリのデプロイが容易。Git連携で自動更新。 |
| Backend Host   | Render     | Free        | Node.jsサーバーを無料で常時稼働（スリープあり）可能。 |
| Code Repository| GitHub     | Free        | ソースコード管理。Vercel/Render双方と連携。 |

### デプロイフロー
1.  GitHub の `main` ブランチにプッシュ。
2.  Vercel が自動検知してフロントエンド（React）をビルド＆公開。
3.  Render が自動検知してバックエンド（Node.js）を再起動。

## 4. ディレクトリ構成案 (Monorepo風)

1つのリポジトリでフロントエンドとサーバーの両方を管理する構成。

```
battle-line-web/
├── package.json        # 依存関係管理 ("type": "module" 設定あり)
├── server.js           # [Backend] エントリーポイント (ESM形式, 内部でCJSをrequire)
├── index.html
├── vite.config.ts
├── src/
│   ├── App.tsx         # [Frontend] クライアントのルート
│   ├── Game.js         # [Shared] ゲームのルール・ロジック (JavaScript/ESM)
│   ├── moves.js        # [Shared] アクション定義 (JavaScript/ESM)
│   ├── board/          # [Frontend] ゲーム画面のコンポーネント群
│   └── types/          # [Shared] 型定義ファイル (.ts)
└── public/             # 静的ファイル (画像など)
```

## 5. 実装上の注意点 (Tech Constraints)

### A. TypeScript と JavaScript の混在
*   **サーバー実行**: Node.js で直接実行するため、`server.js` およびそこから読み込まれる `Game.js`, `moves.js` は **JavaScript (ES Modules)** で記述する。
*   **モジュール解決**: `server.js` 内で `boardgame.io/server` を読み込む際は、CommonJS 互換性のため `createRequire` を使用する。
*   **型定義**: `src/types/` ディレクトリに `.ts` ファイルで型を定義し、フロントエンド (`.tsx`) からは `import type` で読み込む。JavaScript ファイル (`Game.js`) には型が付かないため、JSDoc 等で補完するか、フロントエンド側でキャストして対応する。

### B. React バージョン
*   `boardgame.io` (v0.50.x) が React 19 に完全対応していない可能性があるため、**React 18** を使用する。

## 6. デプロイ設定詳細

### A. Render (Backend) 設定
*   **Type**: Web Service
*   **Environment**: Node
*   **Build Command**: `npm install`
*   **Start Command**: `node server.js`
*   **Environment Variables**:
    *   `PORT`: `8000`

### B. Vercel (Frontend) 設定
*   **Framework Preset**: Vite
*   **Build Command**: `vite build`
*   **Output Directory**: `dist`
*   **Environment Variables**:
    *   `VITE_SERVER_URL`: `https://myapp-backend.onrender.com`

## 7. 開発コマンド

```bash
# サーバー起動 (localhost:8000)
npm run serve

# フロントエンド起動 (localhost:5173)
npm run dev
```
