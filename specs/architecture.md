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
*   **Framework**: React (コンポーネント指向でUIを構築)
*   **Build Tool**: Vite (高速な開発サーバーとビルド環境)
*   **Language**: TypeScript (ゲームの状態やカードデータの型定義を共有し、バグを防止)
*   **Styling**: Tailwind CSS (または CSS Modules) (素早いスタイリングのため)

### Backend (サーバー)
*   **Runtime**: Node.js (boardgame.io の Server モジュールを実行)
*   **Communication**: WebSocket (boardgame.io 内部で socket.io を使用)

### Game Engine & State Management
*   **Core Library**: boardgame.io
    *   **Game Logic**: ターン管理、勝敗判定、フェーズ管理を担当。
    *   **Multiplayer**: Socket.io ベースの同期処理を担当。

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
my-card-game/
├── package.json        # 依存関係管理
├── server.js           # [Backend] Renderのエントリーポイント
├── index.html
├── vite.config.ts
├── src/
│   ├── App.tsx         # [Frontend] クライアントのルート
│   ├── Game.ts         # [Shared] ゲームのルール・ロジック (重要)
│   ├── moves.ts        # [Shared] カードを出す等のアクション定義
│   ├── board/          # [Frontend] ゲーム画面のコンポーネント群
│   └── types/          # [Shared] 型定義ファイル
└── public/             # 静的ファイル (画像など)
```

## 5. デプロイ設定詳細

### A. Render (Backend) 設定
*   **Type**: Web Service
*   **Environment**: Node
*   **Build Command**: `npm install`
*   **Start Command**: `node server.js`
*   **Environment Variables**:
    *   `PORT`: `8000` (Renderが自動設定する場合もあるが明示推奨)

**注意点**:
*   CORS設定で Vercel のドメイン (例: `https://myapp.vercel.app`) を許可する必要がある。
*   無料枠は15分アイドルでスリープするため、初回アクセス時は起動に時間がかかる。

### B. Vercel (Frontend) 設定
*   **Framework Preset**: Vite
*   **Build Command**: `vite build`
*   **Output Directory**: `dist`
*   **Environment Variables**:
    *   `VITE_SERVER_URL`: `https://myapp-backend.onrender.com` (RenderのURLを指定)

## 6. 開始コマンド

```bash
# Vite (React + TypeScript) でプロジェクト作成
npm create vite@latest my-card-game -- --template react-ts

# ディレクトリ移動
cd my-card-game

# boardgame.io のインストール
npm install boardgame.io
```