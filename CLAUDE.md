# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ScaffAI (足場業務支援SaaS)** - An AI-powered SaaS platform for automating scaffolding design, estimation, and quotation workflows for construction workers.

**Core Concept**: Enable workers to photograph building blueprints → AI analyzes → Automatic scaffolding design generation

**Current Stage**: Planning/Pre-development phase (no code implementation yet)

## Architecture Vision

### Multi-Phase Development Strategy

The project follows a phased rollout from v1.0 (MVP) through v3.0 (voice-controlled design):

- **v1.0 (MVP)**: Auth, project management, 2D drawing (Konva.js), DXF export, AI chat
- **v1.1**: Customer management, quote PDF generation, AI email automation
- **v1.2**: DXF→3D conversion, Web 3D preview
- **v1.3**: OCR/CAD analysis → Building data extraction → Automatic scaffolding generation
- **v2.0**: WebAR projection (Three.js + WebXR)
- **v2.5**: Mobile integration (Expo) + ARKit
- **v3.0**: Voice + full AI integration (voice-commanded design)

### Planned Tech Stack

**Frontend** (Next.js Ecosystem):
- Next.js (React + TypeScript, App Router architecture)
- Konva.js (2D drawing canvas)
- Tailwind CSS + shadcn/ui
- React Query / Zustand (state management)
- react-pdf / jsPDF (quote generation)
- dxf-writer (CAD export)
- three.js (3D/AR preparation)

**Backend** (FastAPI):
- FastAPI (Python)
- Supabase (DB + Storage + Auth)
- OpenAI API (GPT-5 / Vision / Function Calling)
- Resend / SendGrid (automated email)
- OpenCV + ezdxf + PaddleOCR (blueprint analysis)

### Planned Directory Structure

```
scaffai/
├── frontend/              # Next.js + TypeScript
│   ├── app/
│   │   ├── page.tsx      # Dashboard (project list)
│   │   ├── draw/         # Scaffolding drawing screen (Konva.js)
│   │   ├── chat/         # AI chat interface
│   │   ├── upload/       # Blueprint upload + OCR preview
│   │   └── project/[id]/ # Project details (building data, scaffold settings)
│   ├── lib/
│   │   ├── api.ts        # FastAPI integration
│   │   ├── supabase.ts   # Supabase client
│   │   ├── konvaUtils.ts # DXF export utilities
│   │   └── aiFunctions.ts # ChatGPT function definitions
│   └── components/       # Shared UI components
│
├── backend/              # FastAPI
│   ├── main.py
│   ├── routers/
│   │   ├── upload.py     # File upload handling
│   │   ├── ocr.py        # OCR analysis (PaddleOCR / Vision)
│   │   ├── dxf_parser.py # DXF analysis (ezdxf)
│   │   ├── ai.py         # OpenAI integration
│   │   ├── scaffold.py   # Scaffolding layout logic
│   │   └── export.py     # DXF output / PDF generation
│   ├── services/         # Business logic layer
│   ├── models/           # Data models
│   └── tests/            # Test suites
│
├── shared/               # Common resources (types, constants, AI schemas)
│   ├── schemas/          # JSON schemas
│   ├── types/            # TypeScript definitions
│   └── constants/        # Scaffold specifications, error codes
│
└── docs/                 # Design documentation
    └── scaffai_requirements_v1.3.md  # Requirements specification
```

## Key Technical Concepts

### AI-Powered Blueprint Analysis Pipeline (v1.3 Core Feature)

```
1. Blueprint Upload (Image or DXF)
   ↓
2. OCR + Line Extraction (OpenCV / Vision API)
   ↓
3. Building Data (dimensions, shapes) Storage
   ↓
4. User Specification (materials, height, boundaries)
   ↓
5. Automatic Scaffolding Drawing (Konva / DXF output)
```

**Analysis Technologies**:
- **OCR**: PaddleOCR / OpenAI Vision (extract text and dimensions)
- **Line Extraction**: OpenCV.js / cv2 (detect walls and roof lines)
- **DXF Analysis**: ezdxf / dxf-parser (parse LINE/POLYLINE from CAD files)
- **Structure Completion**: GPT-5 Vision (AI correction for missing/misrecognized elements)
- **Data Conversion**: JSON structured storage (building shape, height)
- **Scaffold Generation**: FastAPI logic (automatic placement based on JSON data)

### Database Schema Extensions (v1.3)

**New Tables**:
- `building_data`: Stores building structure data (OCR/DXF extracted)
- `ocr_logs`: OCR analysis history and accuracy tracking
- `ai_corrections`: AI completion logs with confidence scores

### AI Integration Design

- **Model**: GPT-5 Vision (OCR completion + structure estimation)
- **Function API**: `parse_drawing()`, `generate_scaffold()`, `suggest_correction()`
- **Output Format**: JSON structure (walls, roof, openings, scale, levels)
- **Storage**: Supabase Storage (original blueprints) + DB (structure JSON)
- **Chat Integration**: "Automatically generate scaffolding from this blueprint" → triggers API workflow

### Quality Targets (v1.3)

- OCR Accuracy: 90%+ recognition rate for primary dimensions
- Blueprint→Scaffold Conversion: <5% error margin in automatic placement
- DXF Compatibility: Opens in AutoCAD / JW-CAD
- AI Chat Integration: "Read blueprint and create scaffolding" command executes full workflow successfully

## Development Workflow (When Implementation Begins)

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run tests
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload    # Start FastAPI dev server
pytest                       # Run tests
pytest tests/test_ocr.py     # Run specific test
```

### Supabase Setup
```bash
# Initialize Supabase project
./scripts/init_supabase.sh

# Run migrations
supabase db push
```

## AI/ML Development Considerations

### OpenAI Integration
- Function Calling: Define clear schemas in `shared/schemas/ai_functions.json`
- Vision API: Optimize image preprocessing for blueprint analysis
- Rate Limiting: Implement retry logic and caching for API calls
- Cost Management: Monitor token usage for blueprint analysis operations

### OCR Pipeline
- Preprocessing: Image enhancement for blueprint clarity (contrast, noise reduction)
- Multi-language: Support Japanese text recognition (PaddleOCR supports Japanese)
- Confidence Scoring: Track and log OCR accuracy per operation
- Human-in-the-Loop: Allow manual correction for low-confidence results

### CAD Processing
- DXF Standards: Support multiple DXF versions (AutoCAD compatibility)
- Coordinate Systems: Handle different unit systems and scale factors
- Layer Management: Preserve and process relevant layers (walls, dimensions, annotations)

## Project Management Integration

This repository uses `.kamui/` for task management and AI competition tracking:
- Task state persists across sessions in `.kamui/tasks-state.json`
- Support for AI model competition workflows (multiple models solving same task)
- Worktree-based task isolation with branch management

## Documentation

Primary requirements document: `docs/scaffai_requirements_v1.3.md`
- Complete technical specifications
- Phase-by-phase feature breakdown
- Success metrics and evaluation criteria
- Japanese language (primary development language for UI/documentation)

## Language and Localization

- **Primary Language**: Japanese (UI, documentation, requirements)
- **Code**: English (variable names, comments, commit messages)
- **User-Facing Content**: Japanese (scaffolding industry terminology in Japanese)
- **Technical Terms**: Bilingual (e.g., "足場" (scaffolding), "見積" (estimate))

## Communication Guidelines for Claude Code

### Core Principles
- **正確性を最優先**: わからないことは「わからない」と正直に伝える
- **ハルシネーション（幻覚）を避ける**: 推測や憶測で答えない。確実な情報のみを提供
- **できないことは明確に伝える**: 技術的制約や実装の難しさを隠さない
- **質問を恐れない**: 曖昧な要件や不明点は必ずユーザーに確認する
- **タスクチケットを正確に読む**: 思い込みではなく、ドキュメントの記載内容に従う

### Output Language
- **すべての出力は日本語で行うこと** (All outputs must be in Japanese)
- コード説明、エラーメッセージ、提案、進捗報告などは日本語で記述
- ユーザーとのコミュニケーションは常に日本語を使用

### Code Comments
- **コード内には初心者でも理解できる日本語コメントを必ず記述**
- 複雑なロジックには処理の意図を日本語で説明
- 関数やクラスの説明にはJSDoc/Docstring形式で日本語ドキュメントを追加
- 変数名は英語でも、その役割をコメントで日本語説明

**コメント例**:
```typescript
// ユーザーの認証状態を確認する関数
// 引数: token - JWTトークン文字列
// 戻り値: 認証が成功した場合はユーザー情報、失敗した場合はnull
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

```python
def calculate_scaffold_units(wall_length: float, height: float) -> int:
    """
    足場の必要単位数を計算する関数

    引数:
        wall_length: 壁の長さ（メートル）
        height: 足場の高さ（メートル）

    戻り値:
        必要な足場単位数（整数）
    """
    # 標準単位の長さは1.8m
    standard_unit_length = 1.8

    # 必要な水平方向の単位数を計算（切り上げ）
    horizontal_units = math.ceil(wall_length / standard_unit_length)

    # 必要な垂直方向の段数を計算（1段あたり1.5m）
    vertical_stages = math.ceil(height / 1.5)

    # 合計単位数を返す
    return horizontal_units * vertical_stages
```

### Git Operations
- **mainブランチへのgit操作（push, merge, rebase等）は必ずユーザーに確認を取ること**
- 確認なしでmainブランチに直接変更を加えることは禁止
- ブランチ作成、featureブランチへのコミットは自由に実行可能
- mainへのマージ前には必ず「mainブランチにマージしてもよろしいですか？」と確認

### Commit Messages
- **コミットメッセージは日本語で記述すること**
- **軽い関西弁のトーンで書くこと**（親しみやすく、カジュアルな雰囲気）
- 何をしたのかが明確に分かるように具体的に記述
- 絵文字を適度に使用してコミット内容を視覚的に分かりやすく

**コミットメッセージの例**:
```bash
# ✅ 良い例
git commit -m "✨ OCR処理パイプラインを追加したで"
git commit -m "🐛 図面アップロード時のバグを修正しといた"
git commit -m "♻️ 足場計算ロジックをリファクタリングしたわ"
git commit -m "📝 READMEにセットアップ手順を追記しとく"
git commit -m "🎨 ダッシュボードのUIを改善したった"
git commit -m "🔧 Supabaseの設定ファイルを更新や"
git commit -m "✅ OCRサービスのテストを追加しといたで"
git commit -m "⚡ 画像処理のパフォーマンスを向上させたわ"

# ❌ 避けるべき例
git commit -m "Update code"  # 英語は避ける
git commit -m "修正"  # 何を修正したか不明
git commit -m "機能追加"  # 具体性がない
```

**よく使う絵文字とその意味**:
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

**Git操作の例**:
```bash
# OK: featureブランチでの作業
git checkout -b feature/add-ocr-pipeline
git add .
git commit -m "✨ OCR処理パイプラインを実装したで"
git push origin feature/add-ocr-pipeline

# ⚠️ 確認必須: mainへのマージ
# 「mainブランチにマージしてもよろしいですか？変更内容: OCR処理パイプラインの追加」
# とユーザーに確認してから実行
git checkout main
git merge feature/add-ocr-pipeline
git push origin main
```

## Git Workflow

このプロジェクトでは、**シンプルなFeature Branch Workflow**を採用します。

### ブランチ戦略

#### 主要ブランチ
```
main (本番環境)
  ├── develop (開発統合ブランチ)
  ├── feature/* (機能開発ブランチ)
  ├── fix/* (バグ修正ブランチ)
  └── hotfix/* (緊急修正ブランチ)
```

**ブランチの役割**:
- **main**: 本番環境にデプロイ可能な安定版。直接コミット禁止
- **develop**: 開発中の機能を統合するブランチ。次のリリース準備用
- **feature/**: 新機能開発用。developから分岐
- **fix/**: バグ修正用。developから分岐
- **hotfix/**: 本番環境の緊急修正用。mainから分岐

#### ブランチ命名規則
```bash
feature/機能名-簡単な説明     # 例: feature/ocr-pipeline
fix/修正内容                 # 例: fix/upload-validation
hotfix/緊急度-内容           # 例: hotfix/critical-auth-bug
```

### 開発フロー

#### 1. 新機能開発
```bash
# developから最新を取得
git checkout develop
git pull origin develop

# 機能ブランチを作成
git checkout -b feature/ocr-pipeline

# 開発作業
# ... コード編集 ...
git add .
git commit -m "✨ OCR処理の基本実装をしたで"

# 複数回コミット可能
git commit -m "🐛 OCRエラーハンドリングを追加しといた"
git commit -m "✅ OCRのテストケースを追加したわ"

# リモートにプッシュ
git push origin feature/ocr-pipeline

# developにマージ（⚠️ 確認必須）
git checkout develop
git merge feature/ocr-pipeline
git push origin develop

# ブランチ削除（任意）
git branch -d feature/ocr-pipeline
```

#### 2. バグ修正
```bash
# developから修正ブランチを作成
git checkout develop
git pull origin develop
git checkout -b fix/upload-validation

# 修正作業
git add .
git commit -m "🐛 ファイルアップロードのバリデーションを修正したで"
git push origin fix/upload-validation

# developにマージ
git checkout develop
git merge fix/upload-validation
git push origin develop
```

#### 3. 本番リリース
```bash
# developが安定したらmainにマージ（⚠️ 必ずユーザー確認）
git checkout main
git pull origin main
git merge develop
git tag -a v1.0.0 -m "🚀 v1.0.0リリース: MVP機能完成や"
git push origin main --tags
```

#### 4. 緊急修正（Hotfix）
```bash
# 本番環境で緊急の問題が発生した場合
git checkout main
git pull origin main
git checkout -b hotfix/critical-auth-bug

# 修正
git add .
git commit -m "🔒 認証の重大なバグを緊急修正したで"
git push origin hotfix/critical-auth-bug

# mainとdevelopの両方にマージ（⚠️ 確認必須）
git checkout main
git merge hotfix/critical-auth-bug
git tag -a v1.0.1 -m "🚑 v1.0.1ホットフィックス: 認証バグ修正"
git push origin main --tags

git checkout develop
git merge hotfix/critical-auth-bug
git push origin develop

git branch -d hotfix/critical-auth-bug
```

### コミット頻度とタイミング

**こまめにコミット**:
- 1つの機能や修正が完了したらコミット
- 大きな変更は小さな単位に分割してコミット
- 動作確認が取れたタイミングでコミット

**プッシュのタイミング**:
- 1日の作業終了時
- 大きな機能の区切りがついた時
- 他の人（または別のClaude Code）と共有したい時

### マージルール

#### developへのマージ
- 機能が完成して動作確認済み
- テストが通っている（テストがある場合）
- コードレビュー不要（個人開発）

#### mainへのマージ（⚠️ 必ずユーザー確認）
- developが十分にテストされている
- リリース可能な状態
- **必ずユーザーに確認してからマージ**
- マージ後はタグ付け（バージョン番号）

### 禁止事項

❌ **絶対にやってはいけないこと**:
1. mainブランチに直接コミット
2. mainブランチへの確認なしマージ
3. 他人のブランチを勝手に削除
4. force push（`git push -f`）をmainやdevelopに実行
5. コミットメッセージを英語で書く

### タグ管理

**バージョンタグのルール**:
```bash
# リリース時
git tag -a v1.0.0 -m "🚀 v1.0.0: MVP機能完成や"

# マイナーアップデート
git tag -a v1.1.0 -m "✨ v1.1.0: 見積PDF生成機能を追加したで"

# パッチ（バグ修正）
git tag -a v1.0.1 -m "🐛 v1.0.1: 認証バグを修正しといた"

# タグをプッシュ
git push origin --tags
```

### 実際の開発例

```bash
# ===== 月曜日: OCR機能の開発開始 =====
git checkout develop
git pull origin develop
git checkout -b feature/ocr-pipeline
# ... 開発 ...
git commit -m "✨ OCRの基本構造を実装したで"
git push origin feature/ocr-pipeline

# ===== 火曜日: OCR機能の続き =====
git commit -m "✨ PaddleOCRを統合したわ"
git commit -m "✅ OCRのテストを追加しといた"
git push origin feature/ocr-pipeline

# ===== 水曜日: OCR機能完成、developにマージ =====
git commit -m "📝 OCRのドキュメントを追加や"
git push origin feature/ocr-pipeline

git checkout develop
git merge feature/ocr-pipeline  # マージOK（develop）
git push origin develop
git branch -d feature/ocr-pipeline

# ===== 木曜日: バグ発見・修正 =====
git checkout -b fix/ocr-encoding
git commit -m "🐛 OCRの日本語エンコーディング問題を修正したで"
git push origin fix/ocr-encoding

git checkout develop
git merge fix/ocr-encoding
git push origin develop

# ===== 金曜日: v1.0.0リリース準備完了 =====
# ⚠️ ユーザーに確認: 「mainブランチにマージしてv1.0.0をリリースしてもよろしいですか？」
git checkout main
git merge develop
git tag -a v1.0.0 -m "🚀 v1.0.0: OCR機能付きMVPリリースや"
git push origin main --tags
```

### トラブルシューティング

#### コンフリクトが発生した場合
```bash
# マージ時にコンフリクト
git merge feature/xxx
# CONFLICT: ファイル名

# コンフリクトを手動解決
# ... ファイルを編集 ...

# 解決後
git add .
git commit -m "🔀 feature/xxxをマージしたで（コンフリクト解決済み）"
```

#### 間違ってコミットした場合
```bash
# 直前のコミットを取り消し（まだpushしていない場合）
git reset --soft HEAD^

# 編集してコミットし直す
git add .
git commit -m "✨ 正しい実装をしたで"
```

#### 間違ってmainにコミットしそうになった場合
```bash
# 現在のブランチを確認
git branch

# mainにいたら即座に停止してユーザーに報告
# 「⚠️ mainブランチにいます。作業を続けてもよろしいですか？」
```

### Git Worktree開発フロー

**基本ルール**: Git Worktreeで並列開発 → developブランチへ統合 → 確認後mainへ統合

#### Worktree開発フロー

```bash
# 1. タスクごとにWorktreeを作成
git worktree add ../scaffai-001 feature/001-frontend-init

# 2. Worktreeで開発
cd ../scaffai-001
# ... 開発作業 ...
git add .
git commit -m "✨ Next.jsプロジェクトを初期化したで"
git push origin feature/001-frontend-init

# 3. developブランチへマージ（自由に実行可能）
cd /path/to/scaffai
git checkout develop
git merge feature/001-frontend-init
git push origin develop

# 4. Worktreeクリーンアップ
git worktree remove ../scaffai-001
git branch -d feature/001-frontend-init
```

#### mainブランチへの統合（⚠️ 必ずユーザー確認）

```bash
# developが安定してテスト完了後にのみ実行

# ⚠️ ユーザーに確認: 「developをmainにマージしてもよろしいですか？」
git checkout main
git pull origin main
git merge develop
git push origin main
```

**統合タイミング**:
- マイルストーン達成時（M1, M2, M3...）
- フェーズ完了時（Phase 0, Phase 1...）
- リリース準備完了時

## タスク管理とチケット運用

### タスクチケットの進捗管理

**チケットドキュメント**: `docs/scaffai_task_tickets.md`

**進捗表記ルール**:
- **未着手**: `[TASK-001] フロントエンドプロジェクト初期化`
- **完了**: `[TASK-001] 🚀 フロントエンドプロジェクト初期化`

**完了時の更新手順**:
```bash
# 1. タスク完了後、チケットドキュメントを更新
vim docs/scaffai_task_tickets.md

# 変更前:
# ### [TASK-001] フロントエンドプロジェクト初期化

# 変更後:
# ### [TASK-001] 🚀 フロントエンドプロジェクト初期化

# 2. 更新をコミット
git add docs/scaffai_task_tickets.md
git commit -m "📝 TASK-001完了マークを追加したで"
git push origin develop
```

**チケット更新のタイミング**:
- タスク完了条件をすべて満たした時
- テストが全てパスした時
- developブランチにマージ済みの時

**進捗確認**:
```bash
# 完了タスク数を確認
grep -c "🚀" docs/scaffai_task_tickets.md

# 未完了タスクを確認
grep "### \[TASK-" docs/scaffai_task_tickets.md | grep -v "🚀"
```

## Future Development Notes

### AR Integration (v2.0+)
- WebXR Device API for browser-based AR
- Three.js scene management for 3D scaffolding visualization
- ARKit/ARCore for mobile native AR experiences
- Real-world scale calibration and positioning

### Mobile Development (v2.5+)
- React Native (Expo) for cross-platform mobile app
- Camera integration for on-site blueprint capture
- Offline-first architecture for construction sites
- Mobile-optimized drawing interface

### Voice Integration (v3.0)
- Speech recognition for hands-free operation
- Natural language to scaffolding specification conversion
- Voice-commanded drawing operations
- Multilingual voice support (Japanese primary)

## Current Status

⚠️ **Pre-Implementation Phase**: The codebase currently contains only planning documents. Implementation has not yet begun. When starting development:

1. Follow the planned directory structure in `docs/scaffai_requirements_v1.3.md`
2. Start with v1.0 MVP features (auth, basic drawing, AI chat)
3. Set up Supabase infrastructure first
4. Implement frontend and backend in parallel using the defined tech stack
5. Test OCR pipeline with real construction blueprints early

## Success Metrics

- **Workflow Automation**: Site survey → Blueprint capture → AI analysis → Design → Estimate (fully automated)
- **User Experience**: Intuitive enough for construction workers with minimal tech experience
- **Accuracy**: 90%+ OCR accuracy, <5% scaffolding placement error
- **Market Differentiation**: Only AI×CAD×OCR integrated tool for construction worker DX

---

**Key Innovation**: "Photograph the blueprint → AI understands → Automatic scaffolding design" - eliminating manual entry and reducing dependency on experienced designers.
