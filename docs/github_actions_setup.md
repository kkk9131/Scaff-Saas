# GitHub Actions CI/CD セットアップガイド

ScaffAIプロジェクトのCI/CDパイプライン設定と使用方法のガイドです。

## 📋 概要

このプロジェクトでは2つのGitHub Actionsワークフローを使用します：

1. **CI Pipeline** (`.github/workflows/ci.yml`) - コード品質チェック
2. **Deploy Pipeline** (`.github/workflows/deploy.yml`) - 本番環境へのデプロイ

---

## 🔧 CI Pipeline

### トリガー条件

- `main`ブランチへのpush
- `develop`ブランチへのpush
- `main`または`develop`へのプルリクエスト

### 実行内容

#### フロントエンド (Next.js)
- ✅ ESLintによるコード品質チェック
- ✅ TypeScript型チェック (`tsc --noEmit`)
- ✅ ビルドテスト (`npm run build`)
- 🚧 ユニットテスト（実装後に有効化）

#### バックエンド (FastAPI)
- ✅ Blackによるコードフォーマットチェック
- ✅ Flake8によるLintチェック
- ✅ mypyによる型チェック
- 🚧 Pytestによるテスト実行（実装後に有効化）

### 必要なGitHub Secrets

CIパイプラインを正常に動作させるために、以下のSecretsを設定してください：

```
NEXT_PUBLIC_SUPABASE_URL          # Supabaseプロジェクトのキー
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase匿名キー
SUPABASE_URL                      # バックエンド用SupabaseURL
SUPABASE_ANON_KEY                 # バックエンド用Supabase匿名キー
SUPABASE_SERVICE_ROLE_KEY         # Supabaseサービスロールキー
OPENAI_API_KEY                    # OpenAI APIキー（テスト用）
```

#### Secretsの設定方法

1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret** をクリック
3. 上記のキーと値を登録

---

## 🚀 Deploy Pipeline

### トリガー条件

- `main`ブランチへのpush
- バージョンタグのpush (例: `v1.0.0`)

### デプロイ先

- **フロントエンド**: Vercel
- **バックエンド**: Railway

### 必要なGitHub Secrets（デプロイ用）

```
# Vercel設定
VERCEL_TOKEN          # Vercelアクセストークン
VERCEL_ORG_ID         # Vercel組織ID
VERCEL_PROJECT_ID     # VercelプロジェクトID

# Railway設定
RAILWAY_TOKEN         # Railwayアクセストークン
```

#### Vercel Secrets取得方法

1. Vercelにログイン → **Settings** → **Tokens**
2. **Create Token** で新しいトークンを作成 → `VERCEL_TOKEN`に設定
3. Vercel CLIで以下を実行：
   ```bash
   npx vercel link
   cat .vercel/project.json
   ```
4. 表示された`orgId`と`projectId`をSecretsに登録

#### Railway Secrets取得方法

1. Railwayにログイン → **Account Settings** → **Tokens**
2. **Create Token** で新しいトークンを作成 → `RAILWAY_TOKEN`に設定

---

## 🛠️ ローカルでのCIチェック実行

### フロントエンド

```bash
cd frontend

# ESLintチェック
npm run lint

# 型チェック
npx tsc --noEmit

# ビルドテスト
npm run build
```

### バックエンド

```bash
cd backend

# 依存関係インストール（初回のみ）
pip install black flake8 mypy pytest pytest-cov

# フォーマットチェック
black --check .

# フォーマット自動修正
black .

# Lintチェック
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

# 型チェック
mypy . --ignore-missing-imports

# テスト実行（テスト実装後）
pytest --cov=. --cov-report=xml
```

---

## 📊 CIステータスバッジ

README.mdにCIステータスを表示するには以下を追加：

```markdown
![CI Pipeline](https://github.com/kkk9131/Scaff-Saas/workflows/CI%2FCD%20Pipeline/badge.svg)
```

---

## 🔍 トラブルシューティング

### 問題: CIビルドが失敗する

**原因1: Secrets未設定**
- GitHubリポジトリのSecretsが正しく設定されているか確認
- 特に`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が必須

**原因2: Lint/型エラー**
- ローカルで`npm run lint`と`npx tsc --noEmit`を実行してエラーを修正
- バックエンドは`black .`でフォーマット自動修正

**原因3: ビルドエラー**
- ローカルで`npm run build`を実行して問題を特定
- 環境変数が正しく設定されているか確認

### 問題: デプロイが失敗する

**原因1: Vercel/Railway Secrets未設定**
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`が正しいか確認
- `RAILWAY_TOKEN`が有効か確認

**原因2: ビルド設定の問題**
- Vercel/Railwayのダッシュボードでビルドログを確認
- 環境変数がプラットフォーム側でも設定されているか確認

---

## 📝 ワークフロー拡張

### テストカバレッジレポート追加

将来的にテストを実装したら、以下を有効化：

```yaml
# frontend/.github/workflows/ci.yml
- name: テスト実行
  run: npm test

# backend/.github/workflows/ci.yml
- name: テスト実行
  run: pytest --cov=. --cov-report=xml
```

### E2Eテスト追加

Playwrightを使用したE2Eテストを追加する場合：

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - name: Install dependencies
      run: npm ci
      working-directory: ./frontend
    - name: Install Playwright
      run: npx playwright install --with-deps
      working-directory: ./frontend
    - name: Run E2E tests
      run: npm run test:e2e
      working-directory: ./frontend
```

---

## ✅ チェックリスト

初回セットアップ時に以下を確認してください：

- [ ] GitHub Secretsを全て設定した
- [ ] ローカルでCIチェックが通ることを確認した
- [ ] Vercel/Railwayのアカウントを作成した
- [ ] デプロイ先のプロジェクトを作成した
- [ ] README.mdにCIバッジを追加した（任意）

---

## 📚 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/ja/actions)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments/overview)
- [Railway Deployment Guide](https://docs.railway.app/deploy/deployments)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Black Documentation](https://black.readthedocs.io/)
- [Flake8 Documentation](https://flake8.pycqa.org/)

---

**ScaffAI CI/CD** - 継続的な品質保証と自動デプロイ 🚀
