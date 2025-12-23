# Lobby UI Refactor Specification

## 概要
ロビー画面 (`src/Lobby.tsx`) を、現在のシンプルな「Match ID入力フォーム」から、サーバー上のアクティブなルーム一覧を表示するリッチなUIに刷新します。
ユーザーがルームを選択して参加したり、詳細設定を行って新規ルームを作成できるようにします。

## 目的
-   ユーザーが現在アクティブな対戦ルームを視覚的に確認できるようにする。
-   ルーム作成時のオプション（公開/非公開、部屋名など）を拡充する。
-   ゲームボードの世界観に合わせたリッチなUIを提供する。

## UI仕様

### 全体レイアウト
-   **ヘッダー**:
    -   タイトル: "Battle Line Online"
    -   サブタイトル: "Select a room to join the battle line."
    -   アクション: "Create Room" ボタン
-   **ルームリスト (テーブル形式)**:
    -   **No.**: ルームID (Match ID)
    -   **Room Name**: 部屋名 (ユーザー設定可能)
    -   **Host Name**: ホストプレイヤー名
    -   **Member**: 現在の人数 / 最大人数 (例: 1/2)
    -   **Status**:
        -   `Open`: 空きあり (緑)
        -   `Full`: 満員 (赤)
        -   `Playing`: ゲーム進行中 (グレー)
        -   `Locked`: 非公開/パスワード付き (黄 - 今回はリスト非表示のPrivate運用とするため、リスト上には現れない想定だが、ステータスとしては定義)
    -   **Action**: "JOIN" ボタン (満員/プレイ中は無効化)
-   **フッター**:
    -   Total Rooms: 全ルーム数
    -   Online Players: オンライン人数 (取得可能な場合)

### Create Room モーダル
"Create Room" ボタン押下時に表示されるモーダル。
-   **入力項目**:
    -   **Room Name**: 部屋の表示名 (必須)。デフォルトは "Room {ID}" 等。
    -   **Player Name**: ホストのプレイヤー名 (必須)。
    -   **Visibility**:
        -   `Public`: ルームリストに表示される。
        -   `Private`: ルームリストに表示されない（IDを知っている人のみ参加可能）。
-   **アクション**:
    -   "Create": ルームを作成し、ロビー待機状態へ遷移（または即座に参加）。
    -   "Cancel": モーダルを閉じる。

### Join by ID (Private Room対応)
-   リストに表示されないPrivateルームに参加するための機能。
-   ヘッダーまたはリスト外に "Join by ID" ボタン/リンクを配置。
-   クリックするとID入力モーダルが表示され、ID指定で参加を試みる。

## 技術仕様

### データ取得
-   `boardgame.io` の Lobby API (`GET /games/battle-line`) を使用してルーム一覧を取得する。
-   定期ポーリング (例: 3秒間隔) でリストを更新する。

### データマッピング
APIレスポンス (`matches` 配列) を以下の通りマッピングする:
-   `matchID`: No.
-   `setupData.roomName`: Room Name (新規作成時に `setupData` に保存)
-   `players[0].name`: Host Name
-   `players` の状態: Member count & Status判定

### Private Room 実装
-   `createMatch` 時に `unlisted: true` を指定することで、APIのリストレスポンスから除外されることを検証済み。
-   Private Room はリストに表示されないため、"Join by ID" 機能が必須となる。

### 新規コンポーネント
-   `LobbyTable`: ルーム一覧表示用コンポーネント
-   `CreateRoomModal`: ルーム作成フォーム
-   `JoinByIdModal`: ID直接入力フォーム
-   `StatusBadge`: ステータス表示用バッジ

## 懸念点・制約 (検証済み)
-   `boardgame.io` の標準サーバー実装において、`setupData` が `createMatch` 時に保存され、リスト取得時に参照できることを確認済み。
-   `unlisted: true` が正しく機能し、リストから除外されることを確認済み。
