# データ永続化戦略の改訂仕様書

## 問題の背景

### 当初の実装での問題点

当初、Redisを boardgame.io のプライマリストレージとして実装しました。具体的には：

1. `RedisStorage` クラスを作成し、すべての読み書き操作をRedis経由で実行
2. `createMatch`, `setState`, `setMetadata`, `fetch` などのメソッドをすべてRedisに対して実行
3. サーバー起動時に `REDIS_URL` があればRedisを使用し、なければインメモリにフォールバック

### 発生した問題

この実装により、以下の問題が発生しました：

1. **ゲーム開始の失敗**: ルーム作成後、参加者がジョインしてもゲームが開始できない
2. **状態同期の不整合**: boardgame.io の内部状態とRedisの状態が同期せず、操作が失敗する
3. **`invalid stateID` エラーの頻発**: 状態更新のタイミングのズレにより、stateIDの不整合が発生

### 根本原因

boardgame.io は元々インメモリでの高速な状態管理を前提に設計されています。すべての操作をRedis経由にすると：

- ネットワークレイテンシーによる遅延
- 非同期処理のタイミング問題
- boardgame.io 内部のキャッシュとの不整合

これらが複合的に作用し、ゲーム進行が正常に機能しなくなりました。

## 新しい方針

### 基本コンセプト

**インメモリDBを主、Redisを従とする階層構造**

- **プライマリストレージ**: `CustomInMemoryDB`（従来通り）
  - ゲームの進行はすべてインメモリで実行
  - 高速で確実な動作を保証
- **バックアップストレージ**: Redis
  - 状態変更時に非同期でバックアップ
  - サーバー再起動時のみ読み込み

### データフロー

#### 1. サーバー起動時

```
[起動] → [Redisに接続] → [既存データを読み込み] → [InMemoryDBに復元] → [ゲーム開始]
```

- Redisから全matchデータを取得
- InMemoryDBの内部Mapに投入
- 以降はInMemoryDBを使用

#### 2. ゲーム進行中

```
[クライアントの操作] → [InMemoryDBで状態更新] → [非同期でRedisにバックアップ]
                    ↓
              [即座にレスポンス]
```

- すべての読み書きはInMemoryDB
- 状態更新後、非同期タスクでRedisに保存
- クライアントへのレスポンスは待たない

#### 3. サーバー再起動後の復帰

```
[再起動] → [Redisからデータ復元] → [InMemoryDBに投入] → [ゲーム継続]
```

- 前回の状態がRedisに保存されている
- サーバー起動時に自動的に復元
- プレイヤーは中断したところから再開可能

## 実装の詳細

### クラス設計

#### 1. `CustomInMemoryDB` クラス（改訂版）

**役割**: プライマリストレージ、すべてのゲーム操作を処理

**内部構造**:
```javascript
class CustomInMemoryDB {
  constructor(redisClient = null) {
    this.matches = new Map();  // インメモリストレージ
    this.redisClient = redisClient;  // バックアップ用（optional）
  }
}
```

**メソッド**:

##### `type()`
```javascript
type() {
  return 'SYNC';
}
```
- boardgame.io に同期ストレージであることを通知

##### `connect()`
```javascript
async connect() {
  if (!this.redisClient) return;
  
  // Redisから全データを読み込み
  const matchIDs = await this.redisClient.sMembers('matches');
  for (const matchID of matchIDs) {
    const key = `match:${matchID}`;
    const dataStr = await this.redisClient.get(key);
    if (dataStr) {
      const data = JSON.parse(dataStr);
      this.matches.set(matchID, data);
    }
  }
  
  console.log(`✅ Restored ${matchIDs.length} matches from Redis`);
}
```
- サーバー起動時に一度だけ実行
- Redisから全matchデータを取得し、内部Mapに復元

##### `createMatch(matchID, opts)`
```javascript
async createMatch(matchID, opts) {
  const matchData = {
    matchID,
    initialState: opts.initialState,
    state: opts.initialState,
    metadata: opts.metadata,
    log: [],
  };
  
  // インメモリに保存
  this.matches.set(matchID, matchData);
  
  // Redisにバックアップ（非同期、結果を待たない）
  this._backupToRedis(matchID, matchData);
}
```
- メインはインメモリへの保存
- Redisバックアップは非同期で実行し、完了を待たない

##### `setState(matchID, state, deltalog)`
```javascript
async setState(matchID, state, deltalog) {
  const match = this.matches.get(matchID);
  if (!match) return;
  
  match.state = state;
  match.log = [...match.log, ...deltalog];
  
  // Redisにバックアップ（非同期）
  this._backupToRedis(matchID, match);
}
```
- インメモリの状態を即座に更新
- Redisへのバックアップは非同期

##### `setMetadata(matchID, metadata)`
```javascript
async setMetadata(matchID, metadata) {
  const players = metadata.players || [];
  const playerList = Array.isArray(players) ? players : Object.values(players);

  for (const player of playerList) {
    if (player.name) {
      validateIdentifier(player.name, 'Player Name');
    }
  }

  const match = this.matches.get(matchID);
  if (!match) return;
  
  match.metadata = metadata;
  
  // Redisにバックアップ（非同期）
  this._backupToRedis(matchID, match);
}
```
- バリデーション後、インメモリを更新
- Redisバックアップは非同期

##### `fetch(matchID, opts)`
```javascript
async fetch(matchID, opts) {
  const match = this.matches.get(matchID);
  if (!match) return {};
  return match;
}
```
- **常にインメモリから読み込み**
- Redisは参照しない（起動時に読み込み済み）

##### `wipe(matchID)`
```javascript
async wipe(matchID) {
  this.matches.delete(matchID);
  
  // Redisからも削除（非同期）
  this._deleteFromRedis(matchID);
}
```
- インメモリから削除
- Redisからも非同期で削除

##### `listMatches(opts)`
```javascript
async listMatches(opts) {
  return Array.from(this.matches.keys());
}
```
- インメモリのキー一覧を返す

##### `_backupToRedis(matchID, matchData)` (private)
```javascript
_backupToRedis(matchID, matchData) {
  if (!this.redisClient) return;
  
  // 非同期で実行、エラーはログに記録するのみ
  setImmediate(async () => {
    try {
      const key = `match:${matchID}`;
      await this.redisClient.set(key, JSON.stringify(matchData));
      await this.redisClient.sAdd('matches', matchID);
    } catch (error) {
      console.error(`Failed to backup ${matchID} to Redis:`, error);
    }
  });
}
```
- `setImmediate` で次のイベントループで実行
- エラーが発生してもゲーム進行に影響しない
- ログに記録のみ

##### `_deleteFromRedis(matchID)` (private)
```javascript
_deleteFromRedis(matchID) {
  if (!this.redisClient) return;
  
  setImmediate(async () => {
    try {
      const key = `match:${matchID}`;
      await this.redisClient.del(key);
      await this.redisClient.sRem('matches', matchID);
    } catch (error) {
      console.error(`Failed to delete ${matchID} from Redis:`, error);
    }
  });
}
```
- Redisから非同期で削除
- エラーはログのみ

#### 2. `RedisStorage` クラス

**削除します。** この実装は使用しません。

### サーバー起動処理

#### `startServer()` 関数（改訂版）

```javascript
async function startServer() {
  let db;
  let redisClient = null;

  // Redisクライアントの初期化
  if (process.env.REDIS_URL) {
    try {
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          tls: process.env.REDIS_URL.startsWith('rediss://'),
          rejectUnauthorized: false
        }
      });
      
      redisClient.on('error', (err) => console.error('Redis Client Error', err));
      await redisClient.connect();
      
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.warn('⚠️ Redis connection failed:', error.message);
      console.log('ℹ️ Continuing with in-memory only (no persistence)');
      redisClient = null;
    }
  } else {
    console.log('ℹ️ REDIS_URL not set, using in-memory storage only');
  }

  // CustomInMemoryDBを作成（Redisクライアントを渡す）
  db = new CustomInMemoryDB(redisClient);
  
  // Redisからデータを復元
  await db.connect();

  // サーバー起動
  const server = Server({
    games: [BattleLine],
    db,
    origins: [
      Origins.LOCALHOST,
      process.env.ALLOWED_ORIGIN || 'https://myapp.vercel.app'
    ],
  });

  // ... 以下従来通り
}
```

**ポイント**:
1. Redisクライアントを先に接続
2. `CustomInMemoryDB` にRedisクライアントを渡す
3. `db.connect()` でRedisからデータを復元
4. 以降は通常のインメモリDBとして動作

## 検証計画

### 1. 基本動作確認

- [ ] サーバー起動時にRedisからデータが復元されるか
- [ ] ルーム作成が正常に動作するか
- [ ] 2人のプレイヤーがジョインしてゲームが開始できるか
- [ ] ゲームの進行が正常に動作するか

### 2. 永続化確認

- [ ] ゲーム途中でサーバーを再起動
- [ ] 再起動後、同じルームにアクセスできるか
- [ ] ゲーム状態が保持されているか（手札、盤面、ターンなど）
- [ ] ゲームを続行できるか

### 3. エラーケース確認

- [ ] Redis接続失敗時もゲームが動作するか（インメモリのみ）
- [ ] Redis切断中もゲームが継続できるか
- [ ] Redisバックアップ失敗時もゲーム進行に影響しないか

### 4. パフォーマンス確認

- [ ] ゲーム開始が以前と同様に高速か
- [ ] 操作のレスポンスが即座に返るか
- [ ] Redisバックアップがゲーム進行を遅延させていないか

## 期待される効果

### ゲーム進行

- ✅ **高速で確実な動作**: インメモリDBによる即座のレスポンス
- ✅ **安定性の向上**: 同期問題が発生しない
- ✅ **既存機能との互換性**: boardgame.io の標準的な使い方に準拠

### データ永続化

- ✅ **サーバー再起動に耐性**: Redisにバックアップされている
- ✅ **復帰の容易性**: サーバー起動時に自動復元
- ✅ **障害時の影響最小化**: Redisエラーでもゲーム自体は継続

### 運用性

- ✅ **シンプルな実装**: 複雑な同期処理が不要
- ✅ **デバッグの容易性**: インメモリDB主体で動作が追いやすい
- ✅ **スケーラビリティ**: 必要に応じてRedis以外のバックアップ先にも対応可能

## 実装の優先順位

1. **High**: `CustomInMemoryDB` クラスの改訂（Redisバックアップ機能追加）
2. **High**: `startServer()` 関数の修正（復元処理追加）
3. **High**: `RedisStorage` クラスの削除
4. **Medium**: エラーハンドリングの強化（Redisバックアップ失敗時のログ）
5. **Low**: モニタリング機能（Redisバックアップ成功率の記録など）

## 移行手順

### 開発環境

1. `server.js` を修正
2. ローカルでサーバー起動し、動作確認
3. ゲームプレイして正常性を確認
4. サーバー再起動して復元を確認

### 本番環境（Render）

1. 開発環境で十分にテスト
2. `REDIS_URL` が設定されていることを確認
3. デプロイ
4. 動作確認
5. 既存のルームが復元されることを確認（もしあれば）

## 注意事項

### Redisバックアップの信頼性

- 非同期バックアップのため、サーバークラッシュ時に最新の状態が保存されていない可能性がある
- 重要な操作の直後にクラッシュした場合、数秒分の操作が失われる可能性
- ただし、通常のサーバー再起動（計画メンテナンス）では問題なし

### スケーリングの制限

- 現状は単一サーバー前提
- 複数サーバーインスタンスで負荷分散する場合は、別途考慮が必要
  - 各サーバーが独自のインメモリDBを持つため、サーバー間で状態が異なる
  - その場合は、Redis Pub/Sub などでサーバー間同期が必要

### データサイズの考慮

- すべてのmatchデータをインメモリに保持
- 長期間運用すると、メモリ使用量が増加
- 定期的な古いmatchデータのクリーンアップが推奨される
