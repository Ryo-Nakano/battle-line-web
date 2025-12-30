# セッション永続化機能 仕様書

## 概要
画面更新（リロード）やブラウザ再起動後も同じ部屋に戻れるようにする機能を実装する。
localStorage を使用してセッション情報を保存し、再接続を可能にする。

## 背景
現状、ゲーム画面や先攻後攻決定画面で画面を更新すると、ルーム一覧画面に戻ってしまう。
これにより、誤ってリロードした場合や接続が一時的に切れた場合に、ゲームに戻れなくなる問題がある。

---

## 要件

### 1. localStorage への保存

#### 保存するデータ
| キー名 | 説明 |
|--------|------|
| `battleline_matchID` | 参加中のルームID |
| `battleline_playerID` | プレイヤーID (`'0'` or `'1'`) |
| `battleline_playerName` | プレイヤー名 |
| `battleline_credentials` | 認証情報（boardgame.io がセッション認証に使用） |

#### 保存タイミング
- ルーム作成時（`CreateRoomModal` で部屋を作成し、join した直後）
- ルーム参加時（`JoinRoomModal` または `JoinByIdModal` で join した直後）

#### 削除タイミング
- **ユーザーの意思でゲームから退出した場合のみ**
  - UI上の「ゲームから出る」ボタンをクリックした場合
- 以下の場合は **削除しない**：
  - ブラウザをリロードした場合
  - ブラウザを閉じた場合
  - 接続が切れた場合

---

### 2. ページ読み込み時の動作

#### フロー
1. ページ読み込み時に localStorage から保存されたセッション情報を取得
2. セッション情報が存在する場合：
   - **確認ダイアログ**を表示: 「前回のセッションが見つかりました。再接続しますか？」
     - 「再接続」選択時: サーバーに部屋の存在を確認
       - 部屋が存在する: ゲーム画面に遷移
       - 部屋が存在しない: エラーメッセージ「部屋が見つかりませんでした」を表示後、localStorage をクリアしてロビー画面に遷移
     - 「ロビーに戻る」選択時: localStorage をクリアしてロビー画面に遷移
3. セッション情報が存在しない場合：
   - 通常通りロビー画面を表示

---

### 3. 「ゲームから出る」UI

#### 配置方針
- 頻繁に使う機能ではないため、**目立たない位置にメニューとして配置**
- PC・モバイル両方で同様の機能を提供

#### PC版 UI（`Board.tsx`）
- 画面右上（または適切な角）に小さなメニューアイコン（ハンバーガーまたは歯車）を配置
- クリックするとドロップダウンメニューを表示
- メニュー内に「ゲームから出る」オプションを配置

#### モバイル版 UI（`MobileBoard.tsx`）
- PC版と同様に、画面の角に小さなメニューアイコンを配置
- タップするとメニューを表示
- メニュー内に「ゲームから出る」オプションを配置

#### 先攻後攻決定画面
- 同様にメニューまたはボタンを配置し、ゲームから出られるようにする

#### 「ゲームから出る」クリック時の動作
1. 確認ダイアログを表示: 「本当にゲームから出ますか？」
2. 「はい」選択時:
   - localStorage から保存したセッション情報を削除
   - ロビー画面に遷移
3. 「いいえ」選択時:
   - 何もせず、ダイアログを閉じる

---

## 技術的詳細

### localStorage ユーティリティ関数

```typescript
// src/utils/sessionStorage.ts (新規作成)

const STORAGE_KEYS = {
  MATCH_ID: 'battleline_matchID',
  PLAYER_ID: 'battleline_playerID',
  PLAYER_NAME: 'battleline_playerName',
  CREDENTIALS: 'battleline_credentials',
};

interface SessionData {
  matchID: string;
  playerID: string;
  playerName: string;
  credentials?: string;
}

export function saveSession(data: SessionData): void { ... }
export function loadSession(): SessionData | null { ... }
export function clearSession(): void { ... }
```

### 主な変更ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/utils/sessionStorage.ts` | **新規作成** - localStorage 操作ユーティリティ |
| `src/App.tsx` | ページ読み込み時のセッション復元ロジック追加 |
| `src/Lobby.tsx` | join 成功時に `saveSession` を呼び出し |
| `src/board/Board.tsx` | メニュー UI 追加、「ゲームから出る」機能実装 |
| `src/board/MobileBoard.tsx` | メニュー UI 追加、「ゲームから出る」機能実装 |
| 先攻後攻決定画面のコンポーネント | メニュー UI 追加（該当ファイル要調査） |

---

## credentials について

`boardgame.io` の `playerCredentials` はセッション認証用のトークンで、個人情報は含まれていない。
localStorage に保存することで、リロード後も同じプレイヤーとして再接続可能になる。

> [!NOTE]
> 共有PCなどでは、他のユーザーがこの認証情報を使用してゲームにアクセスできる可能性がある。
> ただし、ローカルゲームの範囲内では大きなセキュリティリスクにはならない。

---

## 詳細な実装計画

### Phase 1: 基盤の作成

#### Step 1.1: localStorage ユーティリティの作成
**ファイル**: `src/utils/sessionStorage.ts` (新規作成)

```typescript
const STORAGE_KEYS = {
  MATCH_ID: 'battleline_matchID',
  PLAYER_ID: 'battleline_playerID',
  PLAYER_NAME: 'battleline_playerName',
  CREDENTIALS: 'battleline_credentials',
};

interface SessionData {
  matchID: string;
  playerID: string;
  playerName: string;
  credentials?: string;
}

export function saveSession(data: SessionData): void {
  localStorage.setItem(STORAGE_KEYS.MATCH_ID, data.matchID);
  localStorage.setItem(STORAGE_KEYS.PLAYER_ID, data.playerID);
  localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, data.playerName);
  if (data.credentials) {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, data.credentials);
  }
}

export function loadSession(): SessionData | null {
  const matchID = localStorage.getItem(STORAGE_KEYS.MATCH_ID);
  const playerID = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
  const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
  const credentials = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);

  if (matchID && playerID && playerName) {
    return { matchID, playerID, playerName, credentials: credentials || undefined };
  }
  return null;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.MATCH_ID);
  localStorage.removeItem(STORAGE_KEYS.PLAYER_ID);
  localStorage.removeItem(STORAGE_KEYS.PLAYER_NAME);
  localStorage.removeItem(STORAGE_KEYS.CREDENTIALS);
}
```

---

### Phase 2: セッション保存の実装

#### Step 2.1: Lobby.tsx でセッション保存
**ファイル**: `src/Lobby.tsx`

**変更箇所**:
1. ファイル先頭で `saveSession` をインポート
2. `CreateRoomModal` の `handleCreate` 関数内、`onJoin` 呼び出し前に `saveSession` を呼び出し
3. `JoinByIdModal` の `handleJoin` 関数内、`onJoin` 呼び出し前に `saveSession` を呼び出し
4. `JoinRoomModal` の `handleJoin` 関数内、`onJoin` 呼び出し前に `saveSession` を呼び出し

```typescript
// 各 Modal 内で onJoin を呼ぶ前に追加:
saveSession({
  matchID: matchID,
  playerID: playerID,
  playerName: playerName,
  credentials: joinData.playerCredentials,
});
```

---

### Phase 3: セッション復元の実装

#### Step 3.1: App.tsx に再接続ロジックを追加
**ファイル**: `src/App.tsx`

**変更内容**:
1. `saveSession`, `loadSession`, `clearSession` をインポート
2. `getServerUrl` をインポート（既存）
3. 状態を追加:
   - `sessionCheckState`: `'checking' | 'dialog' | 'error' | 'done'`
   - `savedSession`: 保存されたセッションデータ
4. `useEffect` で初回読み込み時に localStorage をチェック
5. 再接続確認ダイアログ UI を追加
6. 部屋存在確認の API 呼び出しロジックを追加

```typescript
// 状態管理の追加
const [sessionCheckState, setSessionCheckState] = useState<'checking' | 'dialog' | 'error' | 'done'>('checking');
const [savedSession, setSavedSession] = useState<SessionData | null>(null);

// 初回読み込み時のセッションチェック
useEffect(() => {
  const session = loadSession();
  if (session) {
    setSavedSession(session);
    setSessionCheckState('dialog');
  } else {
    setSessionCheckState('done');
  }
}, []);

// 再接続処理
const handleReconnect = async () => {
  if (!savedSession) return;
  // サーバーに部屋の存在を確認
  const res = await fetch(`${getServerUrl()}/games/battle-line/${savedSession.matchID}`);
  if (res.ok) {
    // 部屋が存在する場合、ゲーム画面に遷移
    setMatchID(savedSession.matchID);
    setPlayerID(savedSession.playerID);
    setPlayerName(savedSession.playerName);
    setCredentials(savedSession.credentials);
    setSessionCheckState('done');
  } else {
    // 部屋が存在しない場合
    setSessionCheckState('error');
  }
};

// ロビーに戻る
const handleBackToLobby = () => {
  clearSession();
  setSavedSession(null);
  setSessionCheckState('done');
};
```

#### Step 3.2: 再接続ダイアログ UI
**ファイル**: `src/App.tsx`

新しいダイアログコンポーネントを追加（またはインラインで実装）:
- 「前回のセッションが見つかりました。再接続しますか？」
- 「再接続」ボタン
- 「ロビーに戻る」ボタン
- エラー時: 「部屋が見つかりませんでした」メッセージ + 「OK」ボタン

---

### Phase 4: 「ゲームから出る」UI の実装

#### Step 4.1: PC版ゲーム画面（Board.tsx）
**ファイル**: `src/board/Board.tsx`

**変更内容**:
1. `clearSession` をインポート
2. メニュー開閉の state を追加: `const [isMenuOpen, setIsMenuOpen] = useState(false);`
3. 退出確認モーダルの state を追加: `const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);`
4. ヘッダー右上の `Menu` アイコン（L515-517 付近、既存）をクリックでメニュー開閉するよう修正
5. ドロップダウンメニュー UI を追加
6. 「ゲームから出る」クリック時に確認モーダルを表示
7. 確認後、`clearSession()` を呼び出し、親に通知（`onLeaveRoom` コールバック）

**退出処理の props 追加**:
`BattleLineBoardProps` に `onLeaveRoom?: () => void` を追加

```typescript
// メニュードロップダウン UI (header 内)
{isMenuOpen && (
  <div className="absolute top-full right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl">
    <button
      onClick={() => setIsExitConfirmOpen(true)}
      className="px-4 py-2 text-red-400 hover:bg-zinc-700 w-full text-left"
    >
      ゲームから出る
    </button>
  </div>
)}
```

#### Step 4.2: 先攻後攻決定画面（MiniGame コンポーネント）
**ファイル**: `src/board/Board.tsx` 内の `MiniGame` コンポーネント

**変更内容**:
1. `MiniGameProps` に `onLeaveRoom?: () => void` を追加
2. 画面右上にメニューアイコンとドロップダウンを追加
3. 「ゲームから出る」機能を実装

#### Step 4.3: モバイル版ゲーム画面（MobileBoard.tsx）
**ファイル**: `src/board/MobileBoard.tsx`

**変更内容**:
1. PC版と同様のメニュー機能を追加
2. 適切な位置（画面右上など）にメニューアイコンを配置
3. 「ゲームから出る」機能を実装

---

### Phase 5: App.tsx から Board への props 連携

#### Step 5.1: onLeaveRoom コールバックの実装
**ファイル**: `src/App.tsx`

**変更内容**:
1. `BattleLineClient` に `onLeaveRoom` props を渡す
2. `onLeaveRoom` コールバック内で `clearSession()` を呼び出し、state をリセットしてロビーに戻る

```typescript
const handleLeaveRoom = () => {
  clearSession();
  setMatchID(null);
  setPlayerID(null);
  setPlayerName(null);
  setCredentials(undefined);
};

// BattleLineClient に渡す
<BattleLineClient
  matchID={matchID}
  playerID={playerID}
  playerName={playerName}
  credentials={credentials}
  onLeaveRoom={handleLeaveRoom}
/>
```

---

### 実装順序サマリー

| 順序 | ファイル | 作業内容 |
|------|----------|----------|
| 1 | `src/utils/sessionStorage.ts` | 新規作成 - localStorage ユーティリティ |
| 2 | `src/Lobby.tsx` | `saveSession` 呼び出しを追加 |
| 3 | `src/App.tsx` | セッション復元ロジック、確認ダイアログ、`onLeaveRoom` 実装 |
| 4 | `src/board/Board.tsx` | メニュー UI、退出確認モーダル、`MiniGame` への props 追加 |
| 5 | `src/board/MobileBoard.tsx` | メニュー UI、退出確認モーダル |
| 6 | 動作検証 | 手動テスト実施 |

---

## 検証計画

### 手動テスト
1. ルームを作成し、ゲーム画面に遷移 → 画面をリロード → 再接続ダイアログが表示されることを確認
2. 再接続ダイアログで「再接続」を選択 → ゲーム画面に戻ることを確認
3. 再接続ダイアログで「ロビーに戻る」を選択 → ロビーに遷移し、localStorage がクリアされることを確認
4. ゲーム画面でメニューから「ゲームから出る」を選択 → 確認後、ロビーに遷移し、localStorage がクリアされることを確認
5. 先攻後攻決定画面でメニューから「ゲームから出る」を選択 → 同様に動作することを確認
6. サーバー側で部屋を削除した後、リロード → エラーメッセージ表示後、ロビーに遷移することを確認
7. モバイル UI で同様のテストを実施
