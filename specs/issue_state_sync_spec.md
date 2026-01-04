# 問題1: stateID 同期ずれ対策

## 概要

boardgame.io における `stateID` 不整合によりmoveが拒否され、ユーザー操作が無効になる問題への対策。

## 問題の詳細

### 発生状況
- 本番環境で20ターン程度プレイ後に発生
- End Turnボタン → ドロー選択モーダルが表示される
- 部隊カード/戦術カードのどちらを選択してもターンが終わらない

### サーバーログ
```
ERROR: move not processed - canPlayerMakeMove=false - playerID=[1] - action[drawAndEndTurn]
ERROR: invalid stateID, was=[0], expected=[1] - playerID=[0] - action[setName]
```

### 技術的原因

#### stateID とは
- boardgame.io における**ゲーム状態のバージョン番号**
- サーバー側で状態が更新されるたびにインクリメント
- クライアントのmove送信時に `stateID` も送られ、サーバーで検証

#### 不整合の発生パターン
1. WebSocket接続が一時的に不安定になる（モバイル回線切り替え、Wi-Fi瞬断など）
2. サーバー側でターン交代が発生するが、クライアントに正しく同期されない
3. クライアントは古い `stateID` でmoveを送信
4. サーバーが「古いstateID」として拒否
5. クライアント側のモーダルが閉じない（moveが成功しなかったため）

---

## 解決策

### 方針
- 同期ずれを完全に防ぐことは不可能（ネットワーク要因のため）
- **発生時に適切にリカバリーする**ことに焦点を当てる

### 実装案

#### A. moveエラー検知 + ユーザー通知

**概要**: moveが失敗した場合を検知し、ユーザーにリロードを促す

**実装箇所**:
- `Board.tsx` / `MobileBoard.tsx` の `DrawSelectionModal` の `onSelect` コールバック

**課題**:
- boardgame.io のクライアントはmove失敗を直接検知するAPIを提供していない
- カスタムイベントまたはタイムアウトによる推測的検知が必要

#### B. 定期的な状態同期チェック

**概要**: 定期的にサーバーと状態を比較し、不整合を検知

**課題**:
- 追加のAPIエンドポイントまたはWebSocketメッセージが必要
- 実装複雑度が高い

#### C. 自動リロードによるリカバリー

**概要**: エラー検知時に自動でページリロード

**メリット**: 確実にサーバー状態と同期される
**デメリット**: ユーザー体験がやや強引

---

## 推奨実装（案A + C のハイブリッド）

### 1. タイムアウトベースのmove失敗検知

```tsx
// Board.tsx / MobileBoard.tsx
const handleDrawAndEndTurn = async (deckType: string) => {
  const timeout = setTimeout(() => {
    // 3秒経ってもターンが終わらなければエラーと判断
    if (isDrawModalOpen && ctx.currentPlayer === myID) {
      setShowSyncErrorModal(true);
    }
  }, 3000);

  moves.drawAndEndTurn(deckType);
  setIsDrawModalOpen(false);
  
  // 成功時はタイムアウトをクリア（状態変化で判定）
};
```

### 2. 同期エラーモーダルの追加

```tsx
// 新規コンポーネント: SyncErrorModal
<SyncErrorModal
  isOpen={showSyncErrorModal}
  onReload={() => window.location.reload()}
  message="通信エラーが発生しました。ページをリロードしてゲームを再開してください。"
/>
```

### 3. ターン変化の監視

```tsx
useEffect(() => {
  // ターンが変わったらタイムアウトをクリア
  if (ctx.currentPlayer !== myID) {
    clearTimeout(timeoutRef.current);
    setShowSyncErrorModal(false);
  }
}, [ctx.currentPlayer]);
```

---

## 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `src/board/Board.tsx` | タイムアウト検知、エラーモーダル表示 |
| `src/board/MobileBoard.tsx` | 同上 |
| `src/board/SyncErrorModal.tsx` | **新規作成** - 同期エラー通知モーダル |

---

## 検証方法

1. ローカル環境で意図的にWebSocket接続を遅延/切断
2. move送信後にタイムアウトが正しく発動するか確認
3. リロード後にゲームが正常に再開できるか確認

---

## 備考

- この対策は**問題2（サーバー再起動によるデータ消失）が解決されていることが前提**
- 問題2が未解決の場合、リロードしてもゲームデータが失われる可能性がある
