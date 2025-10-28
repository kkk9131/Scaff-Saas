# 🎫 ScaffAI タスクチケット一覧表

**作成日**: 2025-10-22
**バージョン**: v1.0

---

## 📖 このドキュメントについて

このタスク一覧表は、ScaffAI開発を**Git Worktreeによる並列実装**を前提に設計されています。

### Worktree並列実装の利点
- 複数のタスクを独立したブランチで同時に開発可能
- タスク間の干渉を最小限に抑制
- 依存関係のないタスクを効率的に並行実装

### タスク表記ルール

```
[チケットID] タスク名
├─ 依存: 前提となるチケットID
├─ 並列可: 同時実行可能なチケットID
├─ ブランチ: feature/チケットID-タスク名
├─ 優先度: 🔴最重要 / 🟡重要 / 🟢通常
├─ 工数: 作業時間見積もり
└─ 成果物: 完成時の成果物
```

---

## 📊 チケット概要統計

| フェーズ | チケット数 | 並列可能数 | 総工数見積 |
|---------|-----------|-----------|-----------|
| **Phase 0: セットアップ** | 5 | 2 | 16h |
| **Phase 1: 基盤構築** | 8 | 4 | 40h |
| **Phase 2: プロジェクト管理** | 7 | 3 | 44h |
| **Phase 3: 作図機能** | 12 | 5 | 80h |
| **Phase 4: 見積機能** | 5 | 2 | 24h |
| **Phase 5: AI機能** | 7 | 3 | 40h |
| **Phase 6: 統合テスト** | 4 | 2 | 16h |
| **合計** | **48** | **21** | **260h** |

---

## 🎯 Phase 0: プロジェクトセットアップ（並列度: 中）

### [TASK-001] 🚀 フロントエンドプロジェクト初期化
```yaml
依存: なし
並列可: TASK-002, TASK-003, TASK-004
ブランチ: feature/001-frontend-init
優先度: 🔴 最重要
工数: 2h
担当技術: Next.js 14, TypeScript, Tailwind CSS
```

**作業内容**:
- Next.js 14 + TypeScript + App Router構成でプロジェクト作成
- Tailwind CSS + shadcn/ui セットアップ
- ESLint + Prettier設定
- `.env.local.example` 作成

**成果物**:
```
scaffai-frontend/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── .env.local.example
```

**完了条件**:
- `npm run dev` でアプリケーション起動
- Tailwind CSSが適用されている
- TypeScriptエラーなし

---

### [TASK-002] 🚀 バックエンドプロジェクト初期化
```yaml
依存: なし
並列可: TASK-001, TASK-003, TASK-004
ブランチ: feature/002-backend-init
優先度: 🔴 最重要
工数: 2h
担当技術: FastAPI, Python 3.11+, Poetry/pip
```

**作業内容**:
- FastAPIプロジェクト構造作成
- 仮想環境セットアップ（venv or Poetry）
- 依存パッケージインストール（fastapi, uvicorn, pydantic, python-dotenv）
- `main.py` エントリーポイント作成
- `.env.example` 作成

**成果物**:
```
scaffai-backend/
├── main.py
├── routers/
├── services/
├── models/
├── utils/
├── requirements.txt (or pyproject.toml)
└── .env.example
```

**完了条件**:
- `uvicorn main:app --reload` でAPI起動
- `/docs` でSwagger UI表示
- ヘルスチェックエンドポイント動作

---

### [TASK-003] 🚀 Supabaseプロジェクト作成とDB設計
```yaml
依存: なし
並列可: TASK-001, TASK-002, TASK-004
ブランチ: feature/003-supabase-setup
優先度: 🔴 最重要
工数: 4h
担当技術: Supabase, PostgreSQL
```

**作業内容**:
- Supabaseプロジェクト作成（Web UI）
- データベーステーブル設計実装
  - users（Auth管理）
  - projects
  - drawings
  - estimates
  - customers
- Row Level Security (RLS) ポリシー設定
- Storage バケット作成（drawings, estimates, pdfs）

**成果物**:
- `supabase/migrations/` にマイグレーションSQL
- DB接続情報（環境変数）
- Storage設定完了

**完了条件**:
- 全テーブルが作成されている
- RLSポリシーが適用されている
- Storageバケットが利用可能

---

### [TASK-004] 🚀 共通型定義とスキーマ設計
```yaml
依存: なし
並列可: TASK-001, TASK-002, TASK-003
ブランチ: feature/004-shared-types
優先度: 🟡 重要
工数: 3h
担当技術: TypeScript, Pydantic
```

**作業内容**:
- TypeScript型定義作成（`shared/types/`）
  - project.d.ts
  - drawing.d.ts
  - estimate.d.ts
  - ai.ts
- JSONスキーマ作成（`shared/schemas/`）
  - building_schema.json
  - scaffold_schema.json
  - ai_functions.json
- 定数定義（`shared/constants/`）
  - scaffold_spec.ts（標準単位・段数）
  - error_codes.ts

**成果物**:
```
shared/
├── types/
│   ├── project.d.ts
│   ├── drawing.d.ts
│   ├── estimate.d.ts
│   └── ai.ts
├── schemas/
│   ├── building_schema.json
│   ├── scaffold_schema.json
│   └── ai_functions.json
└── constants/
    ├── scaffold_spec.ts
    └── error_codes.ts
```

**完了条件**:
- 型定義がフロントエンド・バックエンド双方で利用可能
- JSONスキーマがバリデーションに使用可能

---

### [TASK-005] 🚀 開発環境統合とドキュメント整備
```yaml
依存: TASK-001, TASK-002, TASK-003
並列可: なし
ブランチ: feature/005-dev-integration
優先度: 🟡 重要
工数: 5h
担当技術: Docker, Docker Compose, Markdown
```

**作業内容**:
- Docker Compose設定（フロントエンド・バックエンド統合）
- 開発用スクリプト作成（`scripts/dev.sh`）
- README.md 更新
- 開発環境セットアップガイド作成
- GitHub Actions CI/CD基本設定

**成果物**:
- `docker-compose.yml`
- `scripts/dev.sh`, `scripts/setup.sh`
- 更新されたREADME.md

**完了条件**:
- `docker-compose up` で全サービス起動
- 開発環境が一発でセットアップ可能

---

## 🏗️ Phase 1: 基盤構築（並列度: 高）

### [TASK-101] 🚀 Supabase Auth統合（フロントエンド）
```yaml
依存: TASK-001, TASK-003
並列可: TASK-102, TASK-103
ブランチ: feature/101-auth-frontend
優先度: 🔴 最重要
工数: 6h
担当技術: Next.js, Supabase Auth, React Hook Form
```

**作業内容**:
- Supabaseクライアント設定（`lib/supabase.ts`）
- 認証コンテキスト作成（`contexts/AuthContext.tsx`）
- ログイン画面実装（`app/login/page.tsx`）
- 新規登録画面実装（`app/signup/page.tsx`）
- 認証保護ミドルウェア実装

**成果物**:
```
app/
├── login/page.tsx
├── signup/page.tsx
├── (protected)/
│   └── layout.tsx
lib/
├── supabase.ts
└── auth.ts
contexts/
└── AuthContext.tsx
```

**完了条件**:
- メール/パスワードでログイン成功
- 新規登録が機能
- 認証状態がアプリ全体で共有
- 未認証時のリダイレクト動作

---

### [TASK-102] 🚀 共通UIコンポーネント作成
```yaml
依存: TASK-001
並列可: TASK-101, TASK-103, TASK-104
ブランチ: feature/102-common-components
優先度: 🔴 最重要
工数: 8h
担当技術: React, shadcn/ui, Tailwind CSS
```

**作業内容**:
- Header コンポーネント（ナビゲーション・ユーザーメニュー）
- Sidebar コンポーネント（メインナビゲーション）
- Toast 通知コンポーネント
- LoadingSpinner コンポーネント
- Modal コンポーネント（汎用ダイアログ）
- Button, Input, Card など基本コンポーネント

**成果物**:
```
components/
├── layout/
│   ├── Header.tsx
│   └── Sidebar.tsx
├── ui/
│   ├── Toast.tsx
│   ├── LoadingSpinner.tsx
│   ├── Modal.tsx
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
└── index.ts
```

**完了条件**:
- 全コンポーネントが単独で動作
- レスポンシブ対応
- アクセシビリティ考慮（ARIA属性）

---

### [TASK-103] 🚀 バックエンドAPI基盤構築
```yaml
依存: TASK-002, TASK-003
並列可: TASK-101, TASK-102, TASK-104
ブランチ: feature/103-api-foundation
優先度: 🔴 最重要
工数: 6h
担当技術: FastAPI, Supabase Python Client
```

**作業内容**:
- Supabaseクライアント設定（`utils/supabase_client.py`）
- ミドルウェア実装（CORS、認証、ログ）
- エラーハンドリング統一
- レスポンスフォーマット標準化
- ヘルスチェックエンドポイント

**成果物**:
```
backend/
├── main.py
├── utils/
│   ├── supabase_client.py
│   ├── middleware.py
│   └── responses.py
├── models/
│   └── base.py
└── routers/
    └── health.py
```

**完了条件**:
- `/api/health` エンドポイント動作
- CORS設定が機能
- エラーレスポンスが統一フォーマット

---

### [TASK-104] 🚀 状態管理セットアップ
```yaml
依存: TASK-001
並列可: TASK-101, TASK-102, TASK-103
ブランチ: feature/104-state-management
優先度: 🟡 重要
工数: 4h
担当技術: Zustand, React Query
```

**作業内容**:
- Zustand ストア設計
  - authStore（認証状態）
  - projectStore（プロジェクト選択状態）
  - drawingStore（作図状態）
- React Query設定
  - QueryClient設定
  - カスタムフック作成（useProjects, useDrawing）

**成果物**:
```
stores/
├── authStore.ts
├── projectStore.ts
└── drawingStore.ts
hooks/
├── useProjects.ts
├── useDrawing.ts
└── useEstimate.ts
lib/
└── queryClient.ts
```

**完了条件**:
- 状態管理が全画面で利用可能
- サーバーステートとクライアントステートが分離

---

### [TASK-105] 🚀 フロントエンド・バックエンド通信層実装
```yaml
依存: TASK-101, TASK-103
並列可: なし
ブランチ: feature/105-api-integration
優先度: 🔴 最重要
工数: 4h
担当技術: Axios/Fetch, FastAPI
```

**作業内容**:
- APIクライアント作成（`lib/api.ts`）
- エンドポイント定義
- 認証トークン自動付与
- エラーハンドリング
- リトライロジック

**成果物**:
```
lib/
└── api.ts
    ├── projectsApi
    ├── drawingsApi
    ├── estimatesApi
    └── aiApi
```

**完了条件**:
- フロントエンドからバックエンドAPIが呼び出せる
- 認証トークンが自動送信される
- エラー時の処理が統一

---

### [TASK-106] 🚀 ログイン画面UI完成
```yaml
依存: TASK-101, TASK-102
並列可: なし
ブランチ: feature/106-login-ui
優先度: 🔴 最重要
工数: 4h
担当技術: React, shadcn/ui, React Hook Form
```

**作業内容**:
- ログインフォームUI実装
- バリデーション追加
- エラー表示
- ローディング状態表示
- 新規登録リンク

**成果物**:
- 完成したログイン画面
- 新規登録画面

**完了条件**:
- ログイン・新規登録が視覚的に完成
- バリデーションエラーが表示される
- UX的に問題ない操作性

---

### [TASK-107] 🚀 認証フロー統合テスト
```yaml
依存: TASK-101, TASK-103, TASK-106
並列可: なし
ブランチ: feature/107-auth-integration-test
優先度: 🔴 最重要
工数: 4h
担当技術: Playwright, Vitest
```

**作業内容**:
- E2Eテスト作成（ログイン・ログアウトフロー）
- ユニットテスト（認証関数）
- 認証バグ修正

**成果物**:
- `tests/e2e/auth.spec.ts`
- `tests/unit/auth.test.ts`

**完了条件**:
- 全テストがパス
- 認証フローに問題なし

---

### [TASK-108] 🚀 ダッシュボードレイアウト構築
```yaml
依存: TASK-102, TASK-104
並列可: なし
ブランチ: feature/108-dashboard-layout
優先度: 🟡 重要
工数: 4h
担当技術: Next.js App Router, React
```

**作業内容**:
- ダッシュボードレイアウト作成（`app/(protected)/layout.tsx`）
- Header統合
- Sidebar統合
- ルーティング設定

**成果物**:
```
app/(protected)/
├── layout.tsx
├── dashboard/
│   └── page.tsx
└── settings/
    └── page.tsx
```

**完了条件**:
- 認証後のレイアウトが表示
- ナビゲーションが機能

---

## 📁 Phase 2: プロジェクト管理（並列度: 中）

### [TASK-201] 🚀 プロジェクトCRUD API実装
```yaml
依存: TASK-103
並列可: TASK-202
ブランチ: feature/201-project-crud-api
優先度: 🔴 最重要
工数: 6h
担当技術: FastAPI, Supabase
```

**作業内容**:
- プロジェクトモデル実装（`models/project.py`）
- プロジェクトルーター実装（`routers/projects.py`）
  - POST /api/projects（作成）
  - GET /api/projects（一覧取得）
  - GET /api/projects/{id}（詳細取得）
  - PUT /api/projects/{id}（更新）
  - DELETE /api/projects/{id}（削除）
  - POST /api/projects/{id}/duplicate（複製）

**成果物**:
```
backend/
├── models/
│   └── project.py
├── routers/
│   └── projects.py
└── services/
    └── project_service.py
```

**完了条件**:
- 全エンドポイントが動作
- Swagger UIで動作確認
- RLSポリシーが適用されている

---

### [TASK-202] 🚀 プロジェクト管理フロントエンド実装
```yaml
依存: TASK-104, TASK-105
並列可: TASK-201
ブランチ: feature/202-project-management-ui
優先度: 🔴 最重要
工数: 8h
担当技術: React, React Query, dnd-kit
```

**作業内容**:
- プロジェクト一覧画面（看板ボード型UI）
- プロジェクトカードコンポーネント
- ドラッグ&ドロップ機能
- プロジェクト作成モーダル
- プロジェクト編集モーダル
- プロジェクト削除確認モーダル

**成果物**:
```
app/(protected)/projects/
├── page.tsx
└── components/
    ├── ProjectBoard.tsx
    ├── ProjectCard.tsx
    ├── CreateProjectModal.tsx
    └── EditProjectModal.tsx
```

**完了条件**:
- 看板ボード型UIが動作
- ドラッグ&ドロップが機能
- CRUD操作が全て可能

---

### [TASK-203] 🚀 プロジェクト詳細画面実装
```yaml
依存: TASK-201, TASK-202
並列可: TASK-204
ブランチ: feature/203-project-detail
優先度: 🔴 最重要
工数: 6h
担当技術: Next.js, React
```

**作業内容**:
- プロジェクト詳細画面実装（`app/(protected)/projects/[id]/page.tsx`）
- 基本情報表示
- 作図へ遷移ボタン
- 見積へ遷移ボタン
- ファイル一覧表示

**成果物**:
```
app/(protected)/projects/[id]/
├── page.tsx
└── components/
    ├── ProjectInfo.tsx
    ├── ActionButtons.tsx
    └── FileList.tsx
```

**完了条件**:
- プロジェクト詳細が表示される
- 各機能への遷移が可能

---

### [TASK-204] 🚀 プロジェクト検索・フィルター機能
```yaml
依存: TASK-202
並列可: TASK-203
ブランチ: feature/204-project-search
優先度: 🟡 重要
工数: 4h
担当技術: React, Fuse.js
```

**作業内容**:
- 検索バー実装
- フィルター機能（ステータス、日付）
- ソート機能（作成日、更新日、名前）

**成果物**:
```
app/(protected)/projects/components/
├── SearchBar.tsx
├── FilterPanel.tsx
└── SortDropdown.tsx
```

**完了条件**:
- 検索が動作
- フィルター・ソートが機能

---

### [TASK-205] 🚀 プロジェクト統合テスト
```yaml
依存: TASK-201, TASK-202, TASK-203
並列可: なし
ブランチ: feature/205-project-integration-test
優先度: 🔴 最重要
工数: 4h
担当技術: Playwright, Vitest
```

**作業内容**:
- E2Eテスト（プロジェクト作成〜削除フロー）
- API統合テスト
- バグ修正

**成果物**:
- `tests/e2e/project.spec.ts`
- `tests/api/project.test.ts`

**完了条件**:
- 全テストがパス

---

### [TASK-206] 🚀 プロジェクトステータス管理機能
```yaml
依存: TASK-201, TASK-202
並列可: なし
ブランチ: feature/206-project-status
優先度: 🟡 重要
工数: 4h
担当技術: React, FastAPI
```

**作業内容**:
- ステータス変更API実装
- ステータスバッジUI
- ステータス変更ドロップダウン

**成果物**:
- ステータス管理機能

**完了条件**:
- ステータスが変更可能
- UIに反映される

---

### [TASK-207] 🚀 Agent Builder連携によるプロジェクト管理エージェント実装
```yaml
依存: TASK-201, TASK-202, TASK-203, TASK-205
並列可: なし
ブランチ: feature/207-project-agent-builder
優先度: 🟡 重要
工数: 12h
担当技術: Agent Builder, ChatKit, MCP, Supabase, FastAPI
```

**作業内容**:
- Agent Builderワークスペースにプロジェクト管理用ワークフロー（案件検索→要約→更新アクション）を構築
- Supabase CRUDと連携するMCPコネクタを本番承認済みWorkspaceへ登録し、ガードレール設定（権限・操作確認）を実装
- ChatKit経由でフロントエンドに埋め込むチャットウィジェットを追加し、プロジェクト操作のハンドオフUIを調整
- Responses/Traces APIでランログを取得し、Evalsに接続する評価データセットを初期化
- docs配下に導入手順・運用ガイド（権限管理、ログ活用方法、評価ループ）を追記

**成果物**:
```
shared/ai/
├── agentBuilder/
│   ├── projectAgent.workflow.json
│   └── guardrails.policy.json
frontend/app/(protected)/projects/
└── components/ProjectAgentChat.tsx
backend/mcp/
└── supabase_project_connector.py
docs/
└── guides/agent_builder_project_management.md
```

**完了条件**:
- Agent Builder上でプロジェクト管理エージェントのデプロイが完了し、ChatKit UIから操作できる
- MCP経由のプロジェクト作成・更新・要約アクションが権限チェック付きで成功する
- Tracesダッシュボードでランログが確認でき、Evalsに評価データセットが登録済み
- 導入手順と運用ガイドが最新状態で`docs/`に公開されている

---

## ✏️ Phase 3: 作図機能（並列度: 高）

> 参照: `docs/scaffai_drawing_mvp_requirements.md`（MVP要件のソース）

### [TASK-301] 🚀 キャンバス基盤・UIレイアウト ✅
```yaml
依存: TASK-108
並列可: TASK-302, TASK-309
ブランチ: feature/301-canvas-layout
優先度: 🔴 最重要
工数: 8h
担当技術: React, React-Konva, Tailwind, shadcn/ui
```

**作業内容**:
- Konva Stageの初期化とレイヤー構成（足場/注記）
- ズーム・パン（ホイールズーム、スペース＋ドラッグでパン）
- グリッド描画（150/300mm切替、スナップON/OFF）
- UIレイアウト（ヘッダー・左右サイドバー・アンダーバー）

**成果物**:
```
app/(protected)/draw/
├── page.tsx
└── components/
    ├── CanvasStage.tsx
    ├── GridOverlay.tsx
    ├── Sidebars.tsx
    └── Underbar.tsx
```

**完了条件**:
- キャンバスが表示され、ズーム・パン・グリッド切替が機能
- アンダーバーに座標/寸法が表示

---

### [TASK-302] モード切替（タブ＋ショートカット1〜4）
```yaml
依存: TASK-301
並列可: TASK-303, TASK-309
ブランチ: feature/302-mode-switch
優先度: 🔴 最重要
工数: 4h
担当技術: React, Zustand
```

**作業内容**:
- モードストア実装（draw/edit/memo/view）
- タブUIとショートカット（1/2/3/4）の連動
- 現在モードの視覚化（アクティブスタイル）

**成果物**:
- `stores/drawingModeStore.ts`
- `components/ModeTabs.tsx`

**完了条件**:
- タブ/ショートカットでモードが切替わり、UIに反映

---

### [TASK-303] サックスモード・スパン自動生成エンジン（Core）
```yaml
依存: TASK-302
並列可: TASK-304
ブランチ: feature/303-sax-core
優先度: 🔴 最重要
工数: 12h
担当技術: TypeScript, React-Konva
```

**作業内容**:
- 始点→終点ドラッグからスパン長（mm）算出
- スパン長に応じた部材自動生成（布材/柱/ブラケット/アンチ）
- 方向ルール（左→右=下、上→下=左、右→左=上、下→上=右）の適用
- `Shift`=ブラケットW/S切替、`Alt`=方向反転
- `ScaffoldGroup` へのグルーピング

**成果物**:
- `lib/sax/engine.ts`（generateParts(line, settings)）
- `types/scaffold.ts`（ScaffoldGroup/Part 型）

**完了条件**:
- 3600mm入力で要件例どおりの構成が生成される
- グループ単位で選択/移動が可能

---

### [TASK-304] サックスモード・UI/操作（プレビュー＋確定）
```yaml
依存: TASK-303
並列可: なし
ブランチ: feature/304-sax-ui
優先度: 🔴 最重要
工数: 6h
担当技術: React, React-Konva
```

**作業内容**:
- ラバーバンド描画中の寸法プレビュー
- プレビュー中にShift/Alt反映
- マウスアップで確定→Canvasへ配置
- グリッドスナップ（150/300）

**成果物**:
- `components/tools/SaxTool.tsx`

**完了条件**:
- プレビューと確定配置が直感的に操作できる

---

### [TASK-305] 編集モード・ポップアップUI
```yaml
依存: TASK-301
並列可: TASK-306
ブランチ: feature/305-edit-popover
優先度: 🔴 最重要
工数: 8h
担当技術: React, shadcn/ui, React-Konva
```

**作業内容**:
- 対象クリックで丸角ポップ（対象右上付近）
- `Esc`で閉じる/`Enter`で確定、即時反映
- 複数選択（Shift+クリック/投げ縄）
- セクション別項目（柱/布材/ブラケット/アンチ/階段/梁枠）

**成果物**:
- `components/edit/EditPopover.tsx`

**完了条件**:
- 各部材の数量・種別・分割・追加が編集可能

---

### [TASK-306] 柱の高さ計算・マーカー/ジャッキ集計
```yaml
依存: TASK-305
並列可: TASK-307
ブランチ: feature/306-pillar-height
優先度: 🟡 重要
工数: 6h
担当技術: TypeScript
```

**作業内容**:
- `totalHeight=(levels×1900)+jack.height` の導入
- マーカー（⚪/△/◻）による集計ルール実装
- 集計値の導出（ジャッキ数量=丸マーカー数）

**成果物**:
- `lib/scaffold/pillar.ts`（height/marking/aggregate）

**完了条件**:
- 単体テストで計算/集計が正しい

---

### [TASK-307] メモモード（注記）
```yaml
依存: TASK-301
並列可: TASK-306
ブランチ: feature/307-memo-mode
優先度: 🟡 重要
工数: 4h
担当技術: React, React-Konva
```

**作業内容**:
- クリック配置/直接編集/削除
- JSONへ `meta.memo` で保存
- PNG出力時の表示ON/OFF

**成果物**:
- `components/tools/MemoTool.tsx`

**完了条件**:
- メモの作成/編集/削除と保存が可能

---

### [TASK-308] ビューモード（ホバーカード）
```yaml
依存: TASK-303
並列可: TASK-310
ブランチ: feature/308-view-hovercard
優先度: 🟡 重要
工数: 6h
担当技術: React, Tailwind
```

**作業内容**:
- 部材ホバーで情報カード表示（白/0.8、radius-2xl）
- カーソル右上10px、アウト時フェードアウト
- 表示項目: 種別/数量/段数/タイプ/長さ(mm)

**成果物**:
- `components/view/HoverCard.tsx`

**完了条件**:
- 編集無効の閲覧専用で情報確認できる

---

### [TASK-309] 保存・読込（Supabase JSON）＋自動保存
```yaml
依存: TASK-301
並列可: TASK-302
ブランチ: feature/309-save-load
優先度: 🔴 最重要
工数: 8h
担当技術: Supabase, React
```

**作業内容**:
- `stage.toJSON()` ベースで保存/読込
- 差分自動保存（10秒 or 10アクション）
- バージョン/プロジェクト紐付け

**成果物**:
```
backend/routers/drawings.py
frontend/hooks/useDrawingSave.ts
```

**完了条件**:
- プロジェクト別に保存・復元でき、自動保存が動作

---

### [TASK-310] ショートカットと方向ルールの単体テスト
```yaml
依存: TASK-302, TASK-303
並列可: TASK-308
ブランチ: feature/310-shortcuts-tests
優先度: 🟡 重要
工数: 4h
担当技術: Vitest
```

**作業内容**:
- 1/2/3/4によるモード切替のテスト
- Shift/Altの切替・反転挙動テスト
- 方向ルール（描画→外向き）のテスト

**成果物**:
- `tests/unit/mode-shortcuts.test.ts`
- `tests/unit/sax-direction.test.ts`

**完了条件**:
- 全テストがパスし、回帰を防止

---

### [TASK-311] 集計・アンダーバー（数量/座標/寸法）
```yaml
依存: TASK-301, TASK-306
並列可: なし
ブランチ: feature/311-underbar-aggregate
優先度: 🟡 重要
工数: 4h
担当技術: React
```

**作業内容**:
- 選択情報/マウス座標/現在スパン寸法の表示
- 柱/布材/ブラケット/アンチ/ジャッキ数量の集計表示

**成果物**:
- `components/Underbar.tsx` の集計領域

**完了条件**:
- 表示がリアルタイムに更新され正確

---

### [TASK-312] E2E（MVP Done条件）＋PNG出力
```yaml
依存: TASK-301~311
並列可: なし
ブランチ: feature/312-drawing-e2e
優先度: 🔴 最重要
工数: 10h
担当技術: Playwright, Vitest, React-Konva
```

**作業内容**:
- E2E: 作図→編集→メモ→ビュー→保存→PNG出力
- 性能計測（主要操作0.2秒以内）
- バグ修正/安定化

**成果物**:
- `tests/e2e/drawing-mvp.spec.ts`

**完了条件**:
- 本要件書のDone条件を満たし、E2Eがパス

---

## 💰 Phase 4: 見積機能（並列度: 低）

### [TASK-401] 見積計算ロジック実装（バックエンド）
```yaml
依存: TASK-103, TASK-305
並列可: TASK-402
ブランチ: feature/401-estimate-calculation
優先度: 🔴 最重要
工数: 6h
担当技術: Python, FastAPI
```

**作業内容**:
- 平米計算ロジック実装
- 単価適用ロジック
- 見積項目計算
- 見積API実装

**成果物**:
```
backend/
├── services/
│   └── estimate_service.py
└── routers/
    └── estimates.py
```

**完了条件**:
- 作図データから正確な平米が計算される
- 単価適用が正確

---

### [TASK-402] 見積入力フォームUI実装
```yaml
依存: TASK-108
並列可: TASK-401
ブランチ: feature/402-estimate-form
優先度: 🔴 最重要
工数: 6h
担当技術: React, React Hook Form
```

**作業内容**:
- 見積作成画面実装
- 単価入力フォーム
- 項目追加・削除機能
- 自動計算表示

**成果物**:
```
app/(protected)/estimates/
├── page.tsx
└── components/
    ├── EstimateForm.tsx
    └── EstimatePreview.tsx
```

**完了条件**:
- 見積フォームが動作
- 自動計算が正確

---

### [TASK-403] PDF生成機能実装
```yaml
依存: TASK-401, TASK-402
並列可: なし
ブランチ: feature/403-pdf-generation
優先度: 🔴 最重要
工数: 8h
担当技術: jsPDF, react-pdf
```

**作業内容**:
- PDF見積書テンプレート作成
- jsPDF統合
- PDF生成ロジック実装
- プレビュー機能

**成果物**:
```
lib/
└── pdfGenerator.ts
templates/
└── estimateTemplate.tsx
```

**完了条件**:
- PDFがダウンロード可能
- フォーマットが整っている

---

### [TASK-404] 見積データ保存機能
```yaml
依存: TASK-401, TASK-403
並列可: なし
ブランチ: feature/404-estimate-storage
優先度: 🔴 最重要
工数: 4h
担当技術: Supabase Storage
```

**作業内容**:
- 見積データDB保存
- PDF Storage保存
- 見積履歴管理

**成果物**:
- 見積保存機能

**完了条件**:
- 見積とPDFが保存される

---

### [TASK-405] 見積機能統合テスト
```yaml
依存: TASK-401~404（全見積タスク）
並列可: なし
ブランチ: feature/405-estimate-integration-test
優先度: 🔴 最重要
工数: 4h
担当技術: Playwright, Vitest
```

**作業内容**:
- E2Eテスト（見積作成〜PDF生成フロー）
- 計算ロジックテスト
- バグ修正

**成果物**:
- `tests/e2e/estimate.spec.ts`

**完了条件**:
- 全テストがパス

---

## 🤖 Phase 5: AI機能（並列度: 中）

### [TASK-501] OpenAI API統合基盤
```yaml
依存: TASK-103
並列可: TASK-502
ブランチ: feature/501-openai-integration
優先度: 🔴 最重要
工数: 6h
担当技術: OpenAI API, FastAPI
```

**作業内容**:
- OpenAI APIクライアント設定
- AIサービス基盤実装
- エラーハンドリング
- レート制限対策

**成果物**:
```
backend/
├── services/
│   └── ai_service.py
└── utils/
    └── openai_client.py
```

**完了条件**:
- OpenAI APIが呼び出せる

---

### [TASK-502] AI Function Calling定義
```yaml
依存: TASK-004
並列可: TASK-501
ブランチ: feature/502-function-calling
優先度: 🔴 最重要
工数: 8h
担当技術: OpenAI Function Calling, TypeScript
```

**作業内容**:
- Function定義作成
  - create_scaffold_drawing
  - generate_estimate
  - export_dxf
  - send_email
- Function実行エンジン実装

**成果物**:
```
shared/schemas/
└── ai_functions.json
backend/services/
└── function_executor.py
```

**完了条件**:
- 全Functionが定義されている
- 実行エンジンが動作

---

### [TASK-503] AIチャットUI実装
```yaml
依存: TASK-108
並列可: TASK-504
ブランチ: feature/503-chat-ui
優先度: 🔴 最重要
工数: 8h
担当技術: React, WebSocket
```

**作業内容**:
- チャット画面実装
- メッセージ送受信UI
- ストリーミング表示
- 実行履歴表示

**成果物**:
```
app/(protected)/chat/
├── page.tsx
└── components/
    ├── ChatWindow.tsx
    ├── MessageList.tsx
    ├── MessageInput.tsx
    └── ExecutionHistory.tsx
```

**完了条件**:
- チャットUIが動作
- メッセージ送受信可能

---

### [TASK-504] AIチャットバックエンド実装
```yaml
依存: TASK-501, TASK-502
並列可: TASK-503
ブランチ: feature/504-chat-backend
優先度: 🔴 最重要
工数: 8h
担当技術: FastAPI, WebSocket, OpenAI
```

**作業内容**:
- チャットAPI実装
- WebSocket接続管理
- OpenAI API呼び出し
- Function実行統合

**成果物**:
```
backend/routers/
└── chat.py
    ├── WebSocket /api/chat/ws
    └── POST /api/chat/message
```

**完了条件**:
- チャットAPIが動作
- AI応答が返る

---

### [TASK-505] AI指令実行エンジン統合
```yaml
依存: TASK-502, TASK-504, TASK-305, TASK-401
並列可: なし
ブランチ: feature/505-ai-execution-engine
優先度: 🔴 最重要
工数: 6h
担当技術: FastAPI, Python
```

**作業内容**:
- AI指令→実際の機能実行
- 作図機能との統合
- 見積機能との統合
- DXF出力機能との統合

**成果物**:
- 完全統合されたAI実行エンジン

**完了条件**:
- 「見積作って」で見積が生成される
- 「DXFで出して」でDXFが出力される

---

### [TASK-506] AI機能統合テスト
```yaml
依存: TASK-501~505（全AIタスク）
並列可: なし
ブランチ: feature/506-ai-integration-test
優先度: 🔴 最重要
工数: 4h
担当技術: Playwright, Vitest
```

**作業内容**:
- E2Eテスト（AI指令実行フロー）
- Function Calling精度テスト
- バグ修正

**成果物**:
- `tests/e2e/ai-chat.spec.ts`

**完了条件**:
- 全テストがパス

---

### [TASK-507] AI応答最適化とプロンプトチューニング
```yaml
依存: TASK-506
並列可: なし
ブランチ: feature/507-ai-optimization
優先度: 🟡 重要
工数: 4h
担当技術: OpenAI API
```

**作業内容**:
- システムプロンプト最適化
- Function Calling精度向上
- レスポンス速度改善

**成果物**:
- 最適化されたAI応答

**完了条件**:
- AI応答精度80%以上

---

## 🧪 Phase 6: 統合・テスト・リリース準備（並列度: 低）

### [TASK-601] 全機能統合とE2Eテスト
```yaml
依存: TASK-311, TASK-405, TASK-506（全Phase完了）
並列可: TASK-602
ブランチ: feature/601-full-integration-test
優先度: 🔴 最重要
工数: 8h
担当技術: Playwright
```

**作業内容**:
- 全フローE2Eテスト
  - ログイン→プロジェクト作成→作図→見積→AI指令
- クロスブラウザテスト
- バグ修正

**成果物**:
- `tests/e2e/full-flow.spec.ts`

**完了条件**:
- 全E2Eテストがパス

---

### [TASK-602] パフォーマンス最適化
```yaml
依存: TASK-601
並列可: なし
ブランチ: feature/602-performance-optimization
優先度: 🟡 重要
工数: 6h
担当技術: Next.js, React, Lighthouse
```

**作業内容**:
- Lighthouse監査
- バンドルサイズ削減
- 画像最適化
- コード分割

**成果物**:
- Lighthouse Score 90+

**完了条件**:
- LCP < 2.5s
- FCP < 1.8s

---

### [TASK-603] ユーザードキュメント作成
```yaml
依存: TASK-601
並列可: なし
ブランチ: feature/603-user-documentation
優先度: 🟡 重要
工数: 4h
担当技術: Markdown
```

**作業内容**:
- ユーザーガイド作成
- 操作マニュアル
- FAQ作成

**成果物**:
- `docs/user-guide.md`

**完了条件**:
- ドキュメントが完成

---

### [TASK-604] デプロイ準備とCI/CD構築
```yaml
依存: TASK-601, TASK-602
並列可: なし
ブランチ: feature/604-deploy-setup
優先度: 🔴 最重要
工数: 8h
担当技術: Vercel, Railway, GitHub Actions
```

**作業内容**:
- Vercelデプロイ設定（フロントエンド）
- Railway/Renderデプロイ設定（バックエンド）
- 環境変数設定
- CI/CDパイプライン構築
- 本番環境セットアップ

**成果物**:
- `.github/workflows/ci.yml`
- `vercel.json`
- デプロイスクリプト

**完了条件**:
- 自動デプロイが動作
- 本番環境が稼働

---

## 📈 タスク実行ガイド

### Worktreeを使った並列実装手順

#### 1. 並列可能なタスクの特定

依存関係がないタスクは同時実行可能です。

**例: Phase 1での並列実装**
```bash
# メインリポジトリ
cd /path/to/scaffai

# タスク101: 認証フロントエンド
git worktree add ../scaffai-101 feature/101-auth-frontend

# タスク102: UIコンポーネント
git worktree add ../scaffai-102 feature/102-common-components

# タスク103: API基盤
git worktree add ../scaffai-103 feature/103-api-foundation

# タスク104: 状態管理
git worktree add ../scaffai-104 feature/104-state-management
```

#### 2. 各Worktreeで作業

```bash
# Worktree 101で作業
cd ../scaffai-101
# 開発...
git add .
git commit -m "✨ Supabase Auth統合を実装したで"
git push origin feature/101-auth-frontend

# Worktree 102で作業
cd ../scaffai-102
# 開発...
git add .
git commit -m "✨ 共通UIコンポーネントを作成したで"
git push origin feature/102-common-components
```

#### 3. developブランチへマージ

```bash
cd /path/to/scaffai
git checkout develop

# タスク101をマージ
git merge feature/101-auth-frontend
git push origin develop

# タスク102をマージ
git merge feature/102-common-components
git push origin develop
```

#### 4. Worktreeクリーンアップ

```bash
# Worktreeを削除
git worktree remove ../scaffai-101
git worktree remove ../scaffai-102

# ブランチ削除（任意）
git branch -d feature/101-auth-frontend
git branch -d feature/102-common-components
```

### 依存関係の解決

**依存関係がある場合は順次実行**:

```bash
# TASK-105はTASK-101とTASK-103に依存
# → TASK-101, TASK-103完了後に開始

git checkout develop
git pull origin develop
git checkout -b feature/105-api-integration
# 開発...
```

### 並列実装推奨パターン

#### Phase 1: 基盤構築（4並列）
- TASK-101（認証）
- TASK-102（UI）
- TASK-103（API）
- TASK-104（状態管理）

#### Phase 3: 作図機能（最大5並列）

**第1波（並列度: 3）**:
- TASK-301（キャンバス基盤・UI）
- TASK-302（モード切替）
- TASK-309（保存・自動保存）

**第2波（並列度: 2）**:
- TASK-303（サックスCore）
- TASK-304（サックスUI）

**第3波（並列度: 3）**:
- TASK-305（編集ポップ）
- TASK-306（柱高さ/集計）
- TASK-307（メモ）

---

## 📊 進捗管理

### チケットステータス

- **🔵 未着手**: タスク開始前
- **🟡 進行中**: 実装中
- **🟢 完了**: 実装・テスト完了
- **🔴 ブロック**: 依存タスク未完了で進行不可
- **⚪ レビュー待ち**: PRレビュー待ち

### 進捗報告フォーマット

```markdown
## 週次進捗報告（YYYY-MM-DD）

### 完了タスク
- [TASK-101] ✅ Supabase Auth統合（6h）
- [TASK-102] ✅ 共通UIコンポーネント作成（8h）

### 進行中タスク
- [TASK-103] 🟡 バックエンドAPI基盤構築（進捗70%、残り2h）

### 次週予定タスク
- [TASK-104] 状態管理セットアップ
- [TASK-105] API通信層実装

### ブロッカー
- なし
```

---

**📌 このタスク一覧表は生きたドキュメントです。開発の進捗に応じてステータスを更新してください。**
