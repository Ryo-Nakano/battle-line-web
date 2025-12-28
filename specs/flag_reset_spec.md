# プライベートルームでのフラッグリセット機能仕様

## 概要
プライベートルームにおいて、奪取済みのフラッグを未奪取状態に戻せる機能を追加する。
操作ミスの救済を目的とし、フラッグを奪取したプレイヤーのみがリセット可能。

---

## 背景
フラッグ奪取は不可逆な操作であるため、誤操作時のリカバリ手段がなかった。
パブリックルームでは競技性を維持するため、この機能はプライベートルームに限定する。

---

## 要件

### 1. リセット可能な条件
| 条件 | 説明 |
|------|------|
| ルームタイプ | プライベートルームのみ |
| 操作可能プレイヤー | そのフラッグを奪取したプレイヤーのみ |
| タイミング | いつでも可能（自ターン/相手ターン問わず） |
| ゲーム終了後 | 未定（要確認：ゲーム終了後もリセット可能か？） |

### 2. リセット時の挙動
| 項目 | 挙動 |
|------|------|
| フラッグの `owner` | `null` に戻す |
| 配置されたカード | そのまま残る（変更なし） |
| 勝利判定 | リセット後に再評価が必要な場合がある |

### 3. UI
1. 奪取済みフラッグをクリック
2. 確認モーダルを表示:「このフラッグを未奪取状態に戻しますか？」
3. 「はい」でリセット実行、「いいえ」でキャンセル

### 4. 表示条件
*   プライベートルームでのみ、リセット機能が有効
*   自分が奪取したフラッグをクリックした場合のみモーダル表示
*   相手が奪取したフラッグをクリックしても何も起きない

---

## 実装詳細

### 1. データ構造

#### `src/Game.js`（ゲーム状態）
*   `setup()` の `setupData` からプライベートルーム判定を参照:
    ```javascript
    G.isPrivateRoom = setupData?.isPrivate || false;
    ```

#### `src/types/index.ts`
*   `GameState` に追加:
    ```typescript
    isPrivateRoom: boolean;
    ```

### 2. ロジック (`src/moves.js`)

#### 新規 move: `resetFlag`
```javascript
export const resetFlag = ({ G, ctx, playerID }, flagIndex) => {
  // 1. プライベートルームのみ許可
  if (!G.isPrivateRoom) return INVALID_MOVE;

  // 2. フラッグ存在確認
  const flag = G.flags[flagIndex];
  if (!flag) return INVALID_MOVE;

  // 3. 奪取済みか確認
  if (flag.owner === null) return INVALID_MOVE;

  // 4. 自分が奪取したフラッグのみリセット可能
  if (flag.owner !== playerID) return INVALID_MOVE;

  // 5. リセット実行
  flag.owner = null;
};
```

#### `src/Game.js` への登録
```javascript
moves: {
  // ...existing moves
  resetFlag,
},
```

### 3. UI (`src/board/Board.tsx`)

#### 状態追加
```typescript
const [pendingResetFlagIndex, setPendingResetFlagIndex] = useState<number | null>(null);
```

#### フラッグクリックハンドラの拡張
```typescript
const handleFlagClick = (flagIndex: number) => {
  const flag = G.flags[flagIndex];
  
  // 既存のフラッグ確保ロジック...
  
  // プライベートルームで自分が奪取したフラッグの場合
  if (G.isPrivateRoom && flag.owner === playerID) {
    setPendingResetFlagIndex(flagIndex);
    return;
  }
};
```

#### リセット確認モーダル
```tsx
{pendingResetFlagIndex !== null && (
  <ConfirmModal
    title="フラッグリセット"
    message="このフラッグを未奪取状態に戻しますか？"
    onConfirm={() => {
      moves.resetFlag(pendingResetFlagIndex);
      setPendingResetFlagIndex(null);
    }}
    onCancel={() => setPendingResetFlagIndex(null)}
  />
)}
```

### 4. UI (`src/board/MobileBoard.tsx`)
*   `Board.tsx` と同様の変更

---

## 検証項目

| # | シナリオ | 期待結果 |
|---|----------|----------|
| 1 | パブリックルームで奪取済みフラッグをクリック | リセットモーダルが表示されない |
| 2 | プライベートルームで自分が奪取したフラッグをクリック | リセット確認モーダルが表示される |
| 3 | プライベートルームで相手が奪取したフラッグをクリック | 何も起きない |
| 4 | リセット確認で「はい」を選択 | フラッグの `owner` が `null` になる |
| 5 | リセット確認で「いいえ」を選択 | 何も変わらない |
| 6 | リセット後、カードが残っていることを確認 | カードはそのまま |
| 7 | リセット後、再度同じフラッグを奪取可能 | 奪取できる |
| 8 | 相手のターン中にリセット | リセットできる |

---

## 備考

*   `ConfirmModal` コンポーネントは既存のものを利用（`src/board/ConfirmModal.tsx`）
*   ゲーム終了判定は現状未実装のため、その考慮は不要
