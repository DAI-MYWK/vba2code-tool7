# 住所照合ツール

ジョブオプと HOT 検索の住所データを照合し、不一致を検出する Web アプリケーション

## 機能

- 2 つの CSV ファイル（ジョブオプデータ、HOT 検索データ）をアップロード
- 求人 ID をキーに住所を自動照合
- 住所不一致データを検出・表示
- 修正用 CSV ファイルをエクスポート（ジョブオプに直接アップロード可能）

## 技術スタック

- **フレームワーク**: Next.js 16.1 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **ファイル処理**: xlsx
- **デプロイ**: Vercel

## ローカル開発

### 必要要件

- Node.js 18.x 以上
- npm

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start
```

## デプロイ（Vercel）

### GitHub リポジトリと連携

1. GitHub に新規リポジトリを作成
2. ローカルで Git 初期化と push

```bash
cd web-app
git init
git add .
git commit -m "Initial commit: 住所照合ツール"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

3. [Vercel](https://vercel.com)にログイン
4. 「New Project」→「Import Git Repository」
5. 該当リポジトリを選択
6. Root Directory: `web-app` を指定
7. 「Deploy」をクリック

### 環境変数

現在、環境変数は不要です（将来的に API キー等が必要になった場合は追加）

## 使い方

1. ジョブオプから全求人データを CSV エクスポート
2. HOT 検索から全求人データを CSV エクスポート
3. 2 つのファイルをアップロード
4. 「照合開始」ボタンをクリック
5. 住所不一致データが表示されます
6. 「修正用 CSV をダウンロード」でジョブオプアップロード用ファイルを取得

## ファイル構成

```
web-app/
├── app/
│   ├── globals.css       # グローバルスタイル
│   ├── layout.tsx        # レイアウトコンポーネント
│   └── page.tsx          # メインページ
├── components/
│   ├── FileUploader.tsx  # ファイルアップロードUI
│   ├── ProgressBar.tsx   # 進捗バー
│   └── ResultTable.tsx   # 結果テーブル
├── lib/
│   ├── types.ts          # TypeScript型定義
│   ├── parser.ts         # CSVパース処理
│   ├── matcher.ts        # 住所照合ロジック
│   └── exporter.ts       # CSVエクスポート
└── package.json
```

## 処理ロジック

### 1. CSV パース

- xlsx ライブラリで CSV/Excel ファイルを読み込み
- ヘッダー行とデータ行に分離
- 必須列の存在を検証

### 2. 住所照合

- 管理コメントから求人 ID 抽出（例: `[251125380015]`）
- HOT 検索データを Map 化（O(1)検索）
- 住所の前方一致判定
  - 「ケ」「ヶ」の表記揺れに対応
  - 番地重複チェック

### 3. 出力生成

- 不一致データのみフィルタリング
- 操作コード「02」（更新）を設定
- 住所フィールドを HOT 検索の値で置換
- CSV 形式でエクスポート（BOM 付き UTF-8）

## ライセンス

社内ツールのため、外部への配布は禁止
