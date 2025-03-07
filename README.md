# LoL Team Maker

League of Legendsのチーム分けツールです。プレイヤーのレートに基づいて、バランスの取れたチームを作成します。

## 機能

### プレイヤー管理
- プレイヤーの新規登録
- プレイヤー一覧の表示
- プレイヤーの削除
- 勝敗数、勝率、レートの管理

### チーム分け
- 10人のプレイヤーを選択
- 各プレイヤーの希望ロールを設定
- レートに基づいた自動チーム分け
- 試合結果の登録とレートの更新

### 試合履歴
- 過去の試合結果の表示
- 参加者、チーム分け、勝者の確認

## 技術スタック

- Next.js
- TypeScript
- Chakra UI
- Firebase (Firestore)

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/satokota1/Team-auto-split-tool.git
cd Team-auto-split-tool
```

2. 依存関係のインストール
```bash
npm install
```

3. 環境変数の設定
`.env.local`ファイルを作成し、以下の環境変数を設定してください：
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. 開発サーバーの起動
```bash
npm run dev
```

## デプロイ

このプロジェクトはVercelにデプロイされています。mainブランチへのプッシュで自動的にデプロイされます。

## ライセンス

MIT
