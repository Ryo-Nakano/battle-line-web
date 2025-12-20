# 戦術カード「配置転換 (Redeploy)」の実装仕様書

## 1. 概要
戦術カード「配置転換 (Redeploy)」の効果を実装する。
自陣のカードを移動または破棄する効果を持つため、「脱走」「裏切り」と同様のインタラクションフローを導入する。

## 2. カード効果定義

### 配置転換 (Redeploy)
*   **効果**: 自分の配置済みのカード（未確保フラッグにあるもの）を1枚選び、別の場所に移動するか、捨て札にする。
*   **制限**: 
    *   確保済みのフラッグにあるカードは対象にできない。
    *   移動先は自分の側の未確保フラッグの空きスロット。
    *   捨て札にする場合、カードの種類（部隊/戦術）に応じた適切な捨て札パイルに送る。

## 3. データ構造の変更

### GameState (`G`)
既存の `activeGuileTactic` フィールドを使用する。

```typescript
interface GameState {
  // ...
  activeGuileTactic: {
    id: string;
    type: string;
    name: 'Redeploy' | 'Traitor' | 'Deserter';
    // ...card properties
  } | null;
}
```

## 4. インタラクションフロー

### 4.1 発動フェーズ
1.  プレイヤーが手札から「配置転換」を戦術フィールドに配置する。
2.  `moveCard` 内で `G.activeGuileTactic` に「配置転換」カードが設定される。
3.  UI上に「配置転換：自陣のカードを選択してください」等のガイドとキャンセルボタンを表示する。

### 4.2 配置転換の処理手順
1.  **Step 1: 対象カードの選択**
    *   プレイヤーが自分の未確保フラッグにあるカード（部隊または戦術）をクリック。
    *   クライアント側の `activeCard` として保持。
2.  **Step 2: 移動先または破棄の選択**
    *   **移動の場合**: 自分の未確保フラッグの空きスロットをクリック。
        *   `moves.resolveRedeploy({ targetCardId, targetLocation, toLocation })` を実行。
    *   **破棄の場合**: 捨て札パイルをクリック。
        *   `moves.resolveRedeploy({ targetCardId, targetLocation, toLocation: { area: 'DISCARD', ... } })` を実行。
        *   ※または専用の `resolveRedeployDiscard` を用意。
3.  **解決ロジック (`resolveRedeploy`)**:
    *   対象カードを元の場所から削除。
    *   移動先（スロットまたは捨て札）に追加。
    *   `activeGuileTactic` をクリア。

## 5. UI/UX詳細

*   **バナー表示**:
    *   「配置転換：自陣のカードを選択して移動または破棄してください」を表示。
*   **ハイライト**:
    *   Step 1: 自分の盤面にある、未確保フラッグ上のカードをハイライト。
    *   Step 2: 自分の空きスロットおよび捨て札パイルをハイライト。
*   **キャンセル**:
    *   キャンセルボタンで手札に戻す。

## 6. 実装タスク

1.  `src/moves.js`: `moveCard` の修正（Redeploy発動時）、`resolveRedeploy` の追加。
2.  `src/board/Board.tsx`: 
    *   `handleCardClick` での自陣カード選択許可。
    *   `handleZoneClick` / `handleDiscardClick` での解決処理。
    *   アクティブ戦術バナーの更新。
