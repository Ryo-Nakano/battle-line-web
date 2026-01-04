# 問題2: サーバー再起動によるゲームデータ消失対策

## 概要

現在のサーバー実装はインメモリストレージを使用しているため、サーバー再起動時に全てのゲームデータが消失する。**Upstash（無料 Redis サービス）** を導入して永続化を実現する。

## 問題の詳細

### 現状の実装

`server.js` で使用している `CustomInMemoryDB`:

```javascript
class CustomInMemoryDB {
  constructor() {
    this.matches = new Map();  // メモリ上に保持
  }
  // ...
}
```

### 問題点
1. サーバープロセスが終了するとデータが全て消失
2. Render 環境ではエラー多発時に自動再起動が発生
3. 問題1（stateID同期ずれ）でエラーが多発 → 再起動 → データ消失 の悪循環

---

## 解決策: Upstash Redis 導入

### なぜ Upstash か
- **無料プラン**: 256 MB / 500,000 commands/月（趣味プロジェクトに十分）
- REST API + 標準 Redis プロトコル両対応
- 永続化あり（データ消失なし）
- Render の外部サービスとして接続可能
- boardgame.io 公式の `@boardgame.io/storage-redis` と互換

### 依存パッケージ

```bash
npm install @boardgame.io/storage-redis redis
```

---

## 実装計画

### 1. Upstash でデータベース作成

1. [Upstash](https://upstash.com/) でアカウント作成（GitHub連携可）
2. ダッシュボード → Create Database
3. リージョン選択（例: AWS Tokyo）
4. 作成後、以下の情報を取得:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**
   - **Redis URL** (例: `rediss://default:xxxxx@xxxxx.upstash.io:6379`)

### 2. Render 環境変数設定

Render ダッシュボード → Environment で以下を追加:

| 変数名 | 値 |
|--------|-----|
| `REDIS_URL` | `rediss://default:xxxxx@xxxxx.upstash.io:6379` |

> **注意**: Upstash は TLS 必須のため `rediss://` プロトコルを使用

### 3. server.js の変更

#### 変更後のコード

```javascript
import { createRequire } from 'module';
import { BattleLine } from './src/Game.js';
import { createClient } from 'redis';

const require = createRequire(import.meta.url);
const { Server, Origins } = require('boardgame.io/server');
const { Redis: RedisStorage } = require('@boardgame.io/storage-redis');

// 既存の CustomInMemoryDB クラスは残す（フォールバック用）

async function startServer() {
  let db;

  if (process.env.REDIS_URL) {
    try {
      const redisClient = createClient({
        url: process.env.REDIS_URL,
      });
      
      redisClient.on('error', (err) => console.error('Redis Client Error', err));
      await redisClient.connect();
      
      db = new RedisStorage({ client: redisClient });
      console.log('✅ Using Upstash Redis storage');
    } catch (error) {
      console.warn('⚠️ Redis connection failed, falling back to in-memory:', error.message);
      db = new CustomInMemoryDB();
    }
  } else {
    console.log('ℹ️ REDIS_URL not set, using in-memory storage');
    db = new CustomInMemoryDB();
  }

  const server = Server({
    games: [BattleLine],
    db,
    origins: [
      Origins.LOCALHOST,
      process.env.ALLOWED_ORIGIN || 'https://myapp.vercel.app'
    ],
  });

  // Error Handling Middleware (既存のまま)
  server.app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      if (err.message && (
        err.message.startsWith('Invalid Room Name') ||
        err.message.startsWith('Invalid Player Name')
      )) {
        ctx.status = 400;
        ctx.body = { error: err.message };
      } else {
        throw err;
      }
    }
  });

  const PORT = parseInt(process.env.PORT || '8000', 10);
  server.run(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
```

---

## 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `server.js` | Redis ストレージへの切り替え、非同期起動 |
| `package.json` | 依存パッケージ追加 |

---

## ローカル開発環境

### オプション1: Upstash の開発用 DB を使用
- 別途 Upstash で開発用 DB を作成
- `.env` に `REDIS_URL` を設定

### オプション2: ローカル Redis (Docker)
```bash
docker run -d -p 6379:6379 redis
# REDIS_URL=redis://localhost:6379
```

### オプション3: インメモリのまま（推奨）
```bash
# REDIS_URL を設定しなければ自動的にインメモリにフォールバック
npm run dev
```

---

## 検証方法

1. Upstash で DB 作成し、Render に環境変数設定
2. デプロイ後、ゲームを開始してしばらくプレイ
3. Render ダッシュボードからサーバーを手動で再起動
4. ブラウザをリロード
5. **ゲームが前の状態から再開できることを確認**

---

## コスト

| プラン | 料金 | 制限 |
|--------|------|------|
| Upstash Free | $0/月 | 256 MB, 500k commands/月 |

ゲームの規模であれば無料プランで十分。

---

## 注意事項

1. **古いゲームデータのクリーンアップ**: 長期運用時は TTL 設定または手動クリーンアップが必要になる可能性
2. **問題1との依存関係**: この永続化実装後に、問題1（stateID同期ずれ）の対策が有効になる
