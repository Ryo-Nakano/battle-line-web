# Step 1: 開発環境とベースライブラリのセットアップ

## 目的
プロジェクトのスタイリング基盤として Tailwind CSS を導入し、カード操作の核となるドラッグ＆ドロップ機能のために dnd-kit をセットアップする。また、不要なテンプレートファイルを削除して開発のベースを整える。

## 作業内容

### 1. Tailwind CSS の導入
*   **インストール**:
    ```bash
    npm install -D tailwindcss postcss autoprefixer tailwind-merge clsx
    ```
*   **設定ファイル作成**:
    ```bash
    npx tailwindcss init -p
    ```
    これにより `tailwind.config.js` と `postcss.config.js` が作成される。
*   **Config設定**:
    `tailwind.config.js` の `content` 配列を以下のように設定し、ソースコード内のクラス名をスキャンできるようにする。
    ```javascript
    export default {
      content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
      ],
      theme: {
        extend: {},
      },
      plugins: [],
    }
    ```
*   **CSSディレクティブ追加**:
    `src/index.css` の内容を全て削除し、以下のディレクティブのみ記述する。
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```

### 2. dnd-kit の導入
*   **インストール**:
    ```bash
    npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
    ```

### 3. プロジェクトのクリーンアップ
*   **不要ファイルの削除**:
    *   `src/App.css`
    *   `src/assets/react.svg`
    *   `public/vite.svg` (もしあれば)
*   **`src/App.tsx` の確認**:
    *   もし `import './App.css'` が残っていたら削除する。

### 4. 動作検証
*   `src/App.tsx` 内の `BattleLineBoard` コンポーネントに Tailwind CSS のクラス（例: `text-3xl`, `bg-red-500`）を適用し、スタイルが反映されるか確認する。
*   (dnd-kit の検証は Step 4, 5 で本格的に行うが、インストールエラーが出ないことを確認する)

## 完了定義
*   `npm run dev` でサーバーが起動する。
*   ブラウザでアクセスした際、Tailwind CSS のスタイルが適用された画面が表示される。
*   コンソールにエラーが出ていない。
