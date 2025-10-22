# ScaffAI（足場業務支援SaaS）

AI搭載の足場設計・見積自動化プラットフォーム

## 📖 プロジェクト概要

ScaffAIは、建設業界の足場作業を革新するAI搭載SaaSプラットフォームです。図面撮影から自動設計まで、足場業務を効率化します。

### 主な機能

- 🤖 **AI自動設計**: 図面を撮影するだけで足場設計を自動生成
- ✏️ **2D作図機能**: Konva.jsベースの直感的な作図ツール
- 📄 **DXFエクスポート**: AutoCAD/JW-CAD互換のファイル出力
- 💰 **見積自動生成**: 設計から見積書を自動作成
- 💬 **AIチャット**: 自然言語で足場設計を指示

## 🚀 クイックスタート

### 必要な環境

- **Node.js**: 20.x以上
- **Python**: 3.11以上
- **Docker**: (オプション) Docker Compose対応版
- **Supabase**: アカウントとプロジェクト

### 1. リポジトリのクローン

```bash
git clone https://github.com/kkk9131/Scaff-Saas.git
cd Scaff-Saas
```

### 2. セットアップスクリプトの実行

```bash
./scripts/setup.sh
```

このスクリプトは以下を自動実行します：
- 環境変数ファイルの作成
- フロントエンドの依存関係インストール
- バックエンドの依存関係インストール

### 3. 環境変数の設定

#### フロントエンド (`frontend/.env.local`)

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API設定
NEXT_PUBLIC_API_URL=http://localhost:8000

# OpenAI (将来のAI機能用、オプション)
OPENAI_API_KEY=your_openai_api_key
```

#### バックエンド (`backend/.env`)

```bash
# Supabase設定
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI API
OPENAI_API_KEY=your_openai_api_key
```

### 4. 開発サーバーの起動

#### 方法1: スクリプトで起動（推奨）

```bash
./scripts/dev.sh
```

#### 方法2: Docker Composeで起動

```bash
docker-compose up
```

#### 方法3: 個別に起動

```bash
# フロントエンド
cd frontend
npm run dev

# バックエンド（別ターミナル）
cd backend
source venv/bin/activate  # Python仮想環境
uvicorn main:app --reload
```

### 5. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

## 🏗️ プロジェクト構成

```
scaffai/
├── frontend/              # Next.js（フロントエンド）
│   ├── app/              # App Router
│   ├── components/       # UIコンポーネント
│   ├── lib/              # ユーティリティ
│   └── public/           # 静的ファイル
│
├── backend/              # FastAPI（バックエンド）
│   ├── main.py           # エントリーポイント
│   ├── routers/          # APIルーター
│   ├── services/         # ビジネスロジック
│   ├── models/           # データモデル
│   └── utils/            # ユーティリティ
│
├── shared/               # 共通リソース
│   ├── types/            # TypeScript型定義
│   ├── schemas/          # JSONスキーマ
│   └── constants/        # 定数定義
│
├── docs/                 # ドキュメント
│   ├── scaffai_requirements_v1.3.md  # 要件定義書
│   ├── scaffai_task_tickets.md       # タスク一覧
│   └── supabase_setup.md             # Supabaseセットアップガイド
│
├── scripts/              # 開発用スクリプト
│   ├── setup.sh          # セットアップスクリプト
│   └── dev.sh            # 開発サーバー起動スクリプト
│
└── docker-compose.yml    # Docker Compose設定
```

## 🛠️ 技術スタック

### フロントエンド

- **Next.js 14**: React フレームワーク（App Router）
- **TypeScript**: 型安全な開発
- **Tailwind CSS**: ユーティリティファーストCSS
- **shadcn/ui**: UIコンポーネントライブラリ
- **Konva.js**: 2D描画キャンバス
- **Zustand**: 状態管理
- **React Query**: サーバーステート管理

### バックエンド

- **FastAPI**: Pythonフレームワーク
- **Supabase**: BaaS（認証、DB、ストレージ）
- **PostgreSQL**: データベース
- **OpenAI API**: AI機能（GPT-5）
- **OpenCV**: 画像処理
- **ezdxf**: DXF処理

### インフラ・開発環境

- **Docker / Docker Compose**: コンテナ化
- **GitHub Actions**: CI/CD
- **Vercel**: フロントエンドホスティング
- **Railway**: バックエンドホスティング

## 📚 ドキュメント

- [要件定義書（v1.3）](docs/scaffai_requirements_v1.3.md)
- [タスクチケット一覧](docs/scaffai_task_tickets.md)
- [Supabaseセットアップガイド](docs/supabase_setup.md)

## 🧪 テスト

### フロントエンド

```bash
cd frontend
npm test              # ユニットテスト
npm run test:e2e      # E2Eテスト（Playwright）
```

### バックエンド

```bash
cd backend
source venv/bin/activate
pytest                # 全テスト実行
pytest tests/test_scaffold.py  # 特定のテスト実行
```

## 🚢 デプロイ

### フロントエンド（Vercel）

```bash
cd frontend
vercel deploy
```

### バックエンド（Railway）

```bash
cd backend
railway up
```

## 📝 開発ワークフロー

### Git Worktreeを使った並列開発

```bash
# タスク用のWorktreeを作成
git worktree add ../scaffai-101 feature/101-auth-frontend

# Worktreeで開発
cd ../scaffai-101
# ... 開発作業 ...
git add .
git commit -m "✨ 機能実装したで"
git push origin feature/101-auth-frontend

# developブランチにマージ
cd /path/to/scaffai
git checkout develop
git merge feature/101-auth-frontend
git push origin develop
```

## 🤝 コントリビューション

プルリクエストは歓迎します！

1. フォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m '✨ すごい機能を追加したで'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはプライベートリポジトリです。

## 👤 開発者

- GitHub: [@kkk9131](https://github.com/kkk9131)

## 📞 サポート

問題が発生した場合は、[Issue](https://github.com/kkk9131/Scaff-Saas/issues)を作成してください。

---

**ScaffAI** - 足場業務をAIで革新する 🚀
