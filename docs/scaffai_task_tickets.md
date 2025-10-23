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
| **Phase 2: プロジェクト管理** | 6 | 3 | 32h |
| **Phase 3: 作図機能** | 12 | 5 | 80h |
| **Phase 4: 見積機能** | 5 | 2 | 24h |
| **Phase 5: AI機能** | 7 | 3 | 40h |
| **Phase 6: 統合テスト** | 4 | 2 | 16h |
| **合計** | **47** | **21** | **248h** |

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

### [TASK-108] ダッシュボードレイアウト構築
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

### [TASK-201] プロジェクトCRUD API実装
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

### [TASK-202] プロジェクト管理フロントエンド実装
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

### [TASK-203] プロジェクト詳細画面実装
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

### [TASK-204] プロジェクト検索・フィルター機能
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

### [TASK-205] プロジェクト統合テスト
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

### [TASK-206] プロジェクトステータス管理機能
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

## ✏️ Phase 3: 作図機能（並列度: 高）

### [TASK-301] Konva.js基盤構築
```yaml
依存: TASK-108
並列可: TASK-302, TASK-303
ブランチ: feature/301-konva-foundation
優先度: 🔴 最重要
工数: 8h
担当技術: Konva.js, React Konva
```

**作業内容**:
- Konva.jsセットアップ
- CanvasStageコンポーネント実装
- レイヤー管理（足場・建物・注記）
- ズーム・パン機能
- グリッド表示

**成果物**:
```
app/(protected)/draw/
├── page.tsx
└── components/
    ├── CanvasStage.tsx
    ├── LayerManager.tsx
    └── GridOverlay.tsx
```

**完了条件**:
- Konvaキャンバスが表示
- ズーム・パンが動作
- レイヤー切替が可能

---

### [TASK-302] 描画ツールパネル実装
```yaml
依存: TASK-301
並列可: TASK-303, TASK-304
ブランチ: feature/302-tool-panel
優先度: 🔴 最重要
工数: 8h
担当技術: React, Konva.js
```

**作業内容**:
- ツールパネルUI実装
- 線描画ツール
- 矩形描画ツール
- 円描画ツール
- テキストツール
- 削除ツール
- 選択・移動ツール

**成果物**:
```
app/(protected)/draw/components/
├── ToolPanel.tsx
└── tools/
    ├── LineTool.tsx
    ├── RectTool.tsx
    ├── CircleTool.tsx
    ├── TextTool.tsx
    └── DeleteTool.tsx
```

**完了条件**:
- 全描画ツールが動作
- ツール切替がスムーズ

---

### [TASK-303] 図形プロパティ編集機能
```yaml
依存: TASK-301
並列可: TASK-302, TASK-304
ブランチ: feature/303-shape-properties
優先度: 🟡 重要
工数: 6h
担当技術: React, Konva.js
```

**作業内容**:
- プロパティパネル実装
- 色変更
- 線幅変更
- 透明度変更
- 図形削除
- レイヤー移動

**成果物**:
```
app/(protected)/draw/components/
└── PropertyPanel.tsx
```

**完了条件**:
- 選択図形のプロパティが編集可能

---

### [TASK-304] 作図データ保存・読込機能
```yaml
依存: TASK-301
並列可: TASK-302, TASK-303
ブランチ: feature/304-drawing-save-load
優先度: 🔴 最重要
工数: 6h
担当技術: Supabase Storage, Konva.js
```

**作業内容**:
- Konva JSONシリアライゼーション
- Supabase Storageへの保存API実装
- 読込API実装
- 自動保存機能

**成果物**:
```
backend/routers/
└── drawings.py
    ├── POST /api/drawings/save
    └── GET /api/drawings/{id}
frontend/hooks/
└── useDrawingSave.ts
```

**完了条件**:
- 作図データが保存・読込可能
- 自動保存が動作

---

### [TASK-305] 足場割付ロジック実装（バックエンド）
```yaml
依存: TASK-103, TASK-004
並列可: TASK-306
ブランチ: feature/305-scaffold-calculation
優先度: 🔴 最重要
工数: 10h
担当技術: Python, FastAPI
```

**作業内容**:
- 足場割付アルゴリズム実装
  - 1800/900単位計算
  - 高さ段数計算
  - 部材配置ロジック
- 割付API実装（POST /api/scaffold/calculate）

**成果物**:
```
backend/
├── services/
│   └── scaffold_service.py
└── routers/
    └── scaffold.py
```

**完了条件**:
- 躯体幅・高さから自動割付が計算される
- APIが正確な結果を返す

---

### [TASK-306] 足場割付UI統合
```yaml
依存: TASK-301, TASK-305
並列可: なし
ブランチ: feature/306-scaffold-ui-integration
優先度: 🔴 最重要
工数: 8h
担当技術: React, Konva.js
```

**作業内容**:
- 割付設定パネル実装
- 自動割付ボタン
- 割付結果のKonvaキャンバスへの反映
- プレビュー機能

**成果物**:
```
app/(protected)/draw/components/
├── ScaffoldPanel.tsx
└── ScaffoldPreview.tsx
```

**完了条件**:
- 自動割付ボタンで足場が配置される
- 設定変更が即座に反映

---

### [TASK-307] DXF出力機能実装
```yaml
依存: TASK-301, TASK-004
並列可: TASK-308
ブランチ: feature/307-dxf-export
優先度: 🔴 最重要
工数: 10h
担当技術: dxf-writer, Konva.js
```

**作業内容**:
- Konva JSON → DXF変換ロジック実装
- DXFライブラリ統合（dxf-writer）
- レイヤー別出力
- DXFファイル生成

**成果物**:
```
lib/
└── dxfConverter.ts
    ├── konvaToDxf()
    └── exportDxf()
```

**完了条件**:
- DXFファイルがダウンロード可能
- AutoCAD/JW-CADで開ける

---

### [TASK-308] 作図データSupabase Storage連携
```yaml
依存: TASK-304, TASK-307
並列可: なし
ブランチ: feature/308-drawing-storage
優先度: 🔴 最重要
工数: 4h
担当技術: Supabase Storage
```

**作業内容**:
- DXFファイルのStorage保存
- ファイルURL管理
- ダウンロード機能

**成果物**:
- Storage連携完了

**完了条件**:
- DXFファイルがStorageに保存される
- URLからダウンロード可能

---

### [TASK-309] 作図履歴・Undo/Redo機能
```yaml
依存: TASK-301
並列可: なし
ブランチ: feature/309-drawing-history
優先度: 🟡 重要
工数: 6h
担当技術: React, Zustand
```

**作業内容**:
- 履歴管理ロジック実装
- Undo/Redoボタン
- キーボードショートカット（Ctrl+Z, Ctrl+Y）

**成果物**:
```
stores/
└── historyStore.ts
hooks/
└── useHistory.ts
```

**完了条件**:
- Undo/Redoが動作

---

### [TASK-310] 作図ショートカットキー実装
```yaml
依存: TASK-301, TASK-302
並列可: なし
ブランチ: feature/310-drawing-shortcuts
優先度: 🟡 重要
工数: 4h
担当技術: React
```

**作業内容**:
- キーボードショートカット実装
  - L: 線ツール
  - R: 矩形ツール
  - C: 円ツール
  - T: テキストツール
  - Delete: 削除
  - Ctrl+S: 保存
  - Ctrl+Z/Y: Undo/Redo

**成果物**:
- ショートカット機能

**完了条件**:
- 全ショートカットが動作

---

### [TASK-311] 作図機能統合テスト
```yaml
依存: TASK-301~310（全作図タスク）
並列可: なし
ブランチ: feature/311-drawing-integration-test
優先度: 🔴 最重要
工数: 6h
担当技術: Playwright, Vitest
```

**作業内容**:
- E2Eテスト（作図〜保存〜DXF出力フロー）
- ユニットテスト（割付ロジック、DXF変換）
- バグ修正

**成果物**:
- `tests/e2e/drawing.spec.ts`
- `tests/unit/scaffold.test.ts`

**完了条件**:
- 全テストがパス

---

### [TASK-312] 作図画面パフォーマンス最適化
```yaml
依存: TASK-311
並列可: なし
ブランチ: feature/312-drawing-performance
優先度: 🟡 重要
工数: 4h
担当技術: React, Konva.js
```

**作業内容**:
- レンダリング最適化
- 大量図形時の描画速度改善
- メモリ使用量削減

**成果物**:
- 最適化されたコード

**完了条件**:
- 1000個以上の図形でもスムーズに動作

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
- TASK-301（Konva基盤）
- TASK-302（ツールパネル）
- TASK-303（プロパティ）

**第2波（並列度: 2）**:
- TASK-305（割付ロジック）
- TASK-307（DXF出力）

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
