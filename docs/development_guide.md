# ScaffAI 開発ガイド

ScaffAIプロジェクトの開発を始めるための包括的なガイドです。

## 📚 目次

1. [開発環境セットアップ](#開発環境セットアップ)
2. [プロジェクト構造](#プロジェクト構造)
3. [開発ワークフロー](#開発ワークフロー)
4. [コーディング規約](#コーディング規約)
5. [テスト](#テスト)
6. [デバッグ](#デバッグ)
7. [よくある質問](#よくある質問)

---

## 🚀 開発環境セットアップ

### 前提条件

- **Node.js**: 20.x以上
- **Python**: 3.11以上
- **Docker**: (オプション) Docker Compose対応版
- **Git**: 最新版
- **Supabaseアカウント**: [supabase.com](https://supabase.com)

### 初回セットアップ

```bash
# 1. リポジトリのクローン
git clone https://github.com/kkk9131/Scaff-Saas.git
cd Scaff-Saas

# 2. セットアップスクリプトの実行
./scripts/setup.sh

# 3. 環境変数の設定
# frontend/.env.local と backend/.env を編集
# Supabase設定とOpenAI APIキーを追加

# 4. 開発サーバーの起動
./scripts/dev.sh
```

### 環境変数の設定

#### フロントエンド (`frontend/.env.local`)

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# API設定
NEXT_PUBLIC_API_URL=http://localhost:8000

# OpenAI（将来のAI機能用）
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

---

## 📁 プロジェクト構造

```
scaffai/
├── frontend/              # Next.js（フロントエンド）
│   ├── app/              # App Router
│   │   ├── page.tsx      # ダッシュボード
│   │   ├── draw/         # 足場作図画面
│   │   ├── chat/         # AIチャット
│   │   └── project/[id]/ # プロジェクト詳細
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
├── scripts/              # 開発用スクリプト
└── supabase/             # Supabase設定
    └── migrations/       # データベースマイグレーション
```

---

## 🔄 開発ワークフロー

### Git Workflow

このプロジェクトは**Feature Branch Workflow**を採用しています。

#### ブランチ構造

```
main (本番環境)
  └── develop (開発統合)
      ├── feature/* (機能開発)
      ├── fix/* (バグ修正)
      └── hotfix/* (緊急修正)
```

#### 新機能開発の流れ

```bash
# 1. developから最新を取得
git checkout develop
git pull origin develop

# 2. 機能ブランチを作成
git checkout -b feature/ocr-pipeline

# 3. 開発作業
# ... コード編集 ...
git add .
git commit -m "✨ OCR処理の基本実装をしたで"

# 4. リモートにプッシュ
git push origin feature/ocr-pipeline

# 5. developにマージ
git checkout develop
git merge feature/ocr-pipeline
git push origin develop

# 6. ブランチ削除（任意）
git branch -d feature/ocr-pipeline
```

### コミットメッセージ規約

**軽い関西弁のトーンで日本語で記述**し、絵文字を使用してコミット内容を視覚的に分かりやすくします。

```bash
# 良い例
git commit -m "✨ OCR処理パイプラインを追加したで"
git commit -m "🐛 図面アップロード時のバグを修正しといた"
git commit -m "♻️ 足場計算ロジックをリファクタリングしたわ"
git commit -m "📝 READMEにセットアップ手順を追記しとく"

# 避けるべき例
git commit -m "Update code"  # 英語は避ける
git commit -m "修正"  # 具体性がない
```

#### よく使う絵文字

- ✨ 新機能追加
- 🐛 バグ修正
- 📝 ドキュメント更新
- 🎨 UI/スタイル改善
- ♻️ リファクタリング
- ⚡ パフォーマンス改善
- 🔧 設定ファイル変更
- ✅ テスト追加/更新
- 🚀 デプロイ関連
- 🔒 セキュリティ関連

### Git Worktree開発

複数タスクの並列開発にはGit Worktreeを活用します。

```bash
# Worktree作成
git worktree add ../scaffai-001 feature/001-frontend-init

# Worktreeで開発
cd ../scaffai-001
# ... 開発作業 ...
git add .
git commit -m "✨ Next.jsプロジェクトを初期化したで"
git push origin feature/001-frontend-init

# developにマージ
cd /path/to/scaffai
git checkout develop
git merge feature/001-frontend-init
git push origin develop

# Worktreeクリーンアップ
git worktree remove ../scaffai-001
git branch -d feature/001-frontend-init
```

---

## 📏 コーディング規約

### フロントエンド（TypeScript/React）

#### ファイル命名

- **コンポーネント**: PascalCase (`UserProfile.tsx`)
- **ユーティリティ**: camelCase (`formatDate.ts`)
- **定数**: UPPER_SNAKE_CASE (`API_ENDPOINTS.ts`)

#### コンポーネント構造

```typescript
// ✅ 良い例
import { useState } from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate: (data: UserData) => void;
}

/**
 * ユーザープロフィールを表示するコンポーネント
 * @param userId - ユーザーID
 * @param onUpdate - 更新時のコールバック関数
 */
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  const [isLoading, setIsLoading] = useState(false);

  // ユーザーデータを取得する処理
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // APIコール処理
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-profile">
      {/* UIコンポーネント */}
    </div>
  );
}
```

#### 型定義

```typescript
// ✅ 型を明示的に定義
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ❌ any型は避ける
const data: any = fetchData(); // 避けるべき

// ✅ 適切な型を使用
const data: User = fetchData();
```

### バックエンド（Python/FastAPI）

#### ファイル命名

- **モジュール**: snake_case (`user_service.py`)
- **クラス**: PascalCase (`UserService`)
- **関数/変数**: snake_case (`get_user_data()`)

#### 関数定義

```python
# ✅ 良い例
from typing import Optional

def calculate_scaffold_units(
    wall_length: float,
    height: float,
    unit_length: float = 1.8
) -> int:
    """
    足場の必要単位数を計算する関数

    引数:
        wall_length: 壁の長さ（メートル）
        height: 足場の高さ（メートル）
        unit_length: 標準単位の長さ（デフォルト: 1.8m）

    戻り値:
        必要な足場単位数（整数）
    """
    # 必要な水平方向の単位数を計算（切り上げ）
    horizontal_units = math.ceil(wall_length / unit_length)

    # 必要な垂直方向の段数を計算（1段あたり1.5m）
    vertical_stages = math.ceil(height / 1.5)

    # 合計単位数を返す
    return horizontal_units * vertical_stages
```

#### エラーハンドリング

```python
from fastapi import HTTPException

# ✅ 適切なHTTP例外を使用
@app.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await fetch_project(project_id)

    if not project:
        raise HTTPException(
            status_code=404,
            detail=f"プロジェクトID {project_id} が見つかりません"
        )

    return project
```

### コメント規約

**初心者でも理解できる日本語コメントを必ず記述**します。

```typescript
// ✅ 良いコメント例
// ユーザーの認証状態を確認する関数
// トークンの有効性をチェックし、有効な場合はユーザー情報を返す
async function verifyUser(token: string): Promise<User | null> {
  // トークンの有効性をチェック
  const isValid = await validateToken(token);

  if (!isValid) {
    // トークンが無効な場合はnullを返す
    return null;
  }

  // データベースからユーザー情報を取得
  const user = await fetchUserFromDB(token);
  return user;
}
```

---

## 🧪 テスト

### フロントエンドテスト

```bash
cd frontend

# ユニットテスト
npm test

# E2Eテスト（Playwright）
npm run test:e2e

# テストカバレッジ
npm run test:coverage
```

### バックエンドテスト

```bash
cd backend
source venv/bin/activate

# 全テスト実行
pytest

# 特定のテスト実行
pytest tests/test_scaffold.py

# カバレッジレポート
pytest --cov=. --cov-report=html
```

---

## 🐛 デバッグ

### フロントエンドデバッグ

#### Next.js Dev Tools

```bash
# デバッグモードで起動
npm run dev

# ブラウザのコンソールでログ確認
console.log('デバッグ情報:', data);
```

#### VSCode デバッグ設定

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug full stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "cwd": "${workspaceFolder}/frontend"
    }
  ]
}
```

### バックエンドデバッグ

#### FastAPI デバッグモード

```bash
# リロードモードで起動
uvicorn main:app --reload --log-level debug

# ログ出力
import logging
logger = logging.getLogger(__name__)
logger.debug("デバッグ情報: %s", data)
```

#### VSCode デバッグ設定

`.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["main:app", "--reload"],
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

---

## ❓ よくある質問

### Q1: ローカル開発でSupabaseに接続できない

**回答**: 環境変数が正しく設定されているか確認してください。

```bash
# 環境変数確認（フロントエンド）
cat frontend/.env.local

# 環境変数確認（バックエンド）
cat backend/.env
```

### Q2: Dockerコンテナが起動しない

**回答**: Dockerデーモンが起動しているか確認し、ポート競合をチェックしてください。

```bash
# Dockerデーモン確認
docker info

# ポート使用状況確認
lsof -i :3000  # フロントエンド
lsof -i :8000  # バックエンド
```

### Q3: npm installが失敗する

**回答**: Node.jsのバージョンとnpmキャッシュを確認してください。

```bash
# Node.jsバージョン確認
node -v  # 20.x以上であること

# npmキャッシュクリア
npm cache clean --force

# 再インストール
rm -rf node_modules package-lock.json
npm install
```

### Q4: Pythonの依存関係エラー

**回答**: 仮想環境を再作成してください。

```bash
cd backend

# 仮想環境削除
rm -rf venv

# 仮想環境再作成
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Q5: コミットメッセージの書き方が分からない

**回答**: 以下のテンプレートを使用してください。

```bash
# テンプレート
git commit -m "[絵文字] [何をしたか]したで/しといた/したわ"

# 例
git commit -m "✨ ユーザー認証機能を実装したで"
git commit -m "🐛 ログインエラーを修正しといた"
git commit -m "📝 セットアップガイドを更新したわ"
```

---

## 📞 サポート

問題が発生した場合は、以下の方法でサポートを受けてください：

1. **ドキュメント確認**: `docs/`ディレクトリ内の関連ドキュメントを確認
2. **Issue作成**: [GitHub Issues](https://github.com/kkk9131/Scaff-Saas/issues)で問題を報告
3. **Discussion**: [GitHub Discussions](https://github.com/kkk9131/Scaff-Saas/discussions)で質問

---

**ScaffAI** - 足場業務をAIで革新する 🚀
