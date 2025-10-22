# Repository Guidelines

## プロジェクト構成
現在は設計資料のみが存在し、中心は `CLAUDE.md` と `docs/scaffai_requirements_v1.3.md`。開発開始時は `scaffai/` 配下に `frontend/`（Next.js App Router、`app/`・`lib/`・`components/`）、`backend/`（FastAPI の `routers/`・`services/`・`models/`・`tests/`）、`shared/`（共通スキーマや型、定数）を整備する。AI プロンプトや JSON スキーマは `shared/schemas/` に集約し、UI ガイドラインや要件は `docs/` へ追加する。設計図など大きなバイナリは Supabase Storage に保管し、Git には含めない。

## アーキテクチャとロードマップ
`CLAUDE.md` の段階戦略に従い、v1.0 で認証・案件管理・Konva.js による2D描画・DXF出力・AIチャットを実装、v1.1 で顧客管理と見積PDF自動化、v1.2 で DXF→3D プレビュー、v1.3 で OCR/CAD からの自動足場生成へ拡張する。v2.x では WebXR と three.js による AR、v2.5 で Expo を用いたモバイル連携、v3.0 で音声操作を追加する。技術スタックは Next.js + TypeScript、FastAPI、Supabase（DB・Auth・Storage）、OpenAI Vision、ezdxf・OpenCV・PaddleOCR を核とし、AI 関連の関数定義は `shared/ai/` にまとめて再利用性を高める。

## 開発・ビルドコマンド
各モジュール実装時に `docs/` へ手順を追記する。想定される基本コマンドは次のとおり：フロントエンドは `cd scaffai/frontend && npm install` 後に `npm run dev`・`npm run lint`・`npm run build`。必要に応じて `npm run test` で UI テストを実施する。バックエンドは `cd scaffai/backend && pip install -r requirements.txt`（または `poetry install`）と `uvicorn main:app --reload` でローカル開発、`pytest` でスイート実行。Supabase CLI（`supabase start`、`supabase db reset`、`supabase functions serve`）や CAD/OCR 用スクリプト（例: `npm run export:dxf`、`python -m scripts.export_dxf`）も共通手順として記録する。

## コーディング規約
出力やコミュニケーションは常に日本語で行い、コードには初心者向け日本語コメントと JSDoc/Docstring を必ず付与する。API 仕様や処理意図を関数コメントで説明し、変数や戻り値の役割を日本語で補足する。TypeScript は Prettier+ESLint（2スペース、camelCase、React コンポーネントは PascalCase、shadcn/ui の構成）を遵守し、Tailwind クラスは `class-variance-authority` など再利用可能な形で整理する。Python は Black（4スペース）と Ruff を適用し、pydantic モデルやサービス層で snake_case・PascalCase を徹底する。生成AIの関数呼び出しは `shared/aiFunctions.ts` などに切り出して管理する。

## テスト指針
フロントエンドは Jest/Vitest を `frontend/tests/` に配置し、React Testing Library でダッシュボードや Konva キャンバスの挙動を検証する。バックエンドは Pytest を `backend/tests/` で運用し、OCR パイプラインや足場計算サービスをモジュール単位で検証する。単体テストから統合テストへ広げ、OCR 精度90%以上・足場配置誤差5%未満という品質目標を継続監視する。CI が整備された段階で、`npm run test` と `pytest` の両方が成功しない限りマージを禁止する。

## コミットとプルリク運用
コミットメッセージは日本語＋ゆるい関西弁＋絵文字で要点を示す（例: `✨ OCR処理パイプラインを追加したで`）。1機能ごとにこまめにコミットし、`git commit -m "🐛 図面アップロードのエラー処理を直しといた"` のように内容を具体的に書く。feature ブランチでの作業は自由だが、`main` への push/merge は必ず事前承認を得る。PR には概要、参照チケットやロードマップ箇所、テスト結果、UIやDXF/PDFの成果物を添付し、必要に応じてスクリーンショットやログ抜粋を示す。

## Git ワークフロー
Feature Branch Workflow を採用し、`main`・`develop`・`feature/*`・`fix/*`・`hotfix/*` を目的別に使い分ける。今後の開発は `git worktree` を用いて並行作業し、完了した作業はまず `dev` ブランチに統合、確認後に `main` へ昇格させる。ブランチ名は `feature/ocr-pipeline`、`fix/upload-validation` のように内容を明確にする。`main` への直接コミットや強制 push は禁止で、リリース時は `git tag -a v1.0.0 -m "🚀 v1.0.0: MVPリリースや"` のようにタグを付与する。`main` へマージする前には「mainブランチにマージしてもよろしいですか？」と必ず確認し、承認を得てから `git push origin main --tags` を実行する。

## タスク管理
`task_tickets.md` の各チケット（例: `[TASK-001]`）は完了時にタイトルの横へ 🚀 を追加して達成状況を示す。記録方法は `- [TASK-001] OCR基盤整備 🚀` のように統一し、更新後は変更点を PR またはコミットメッセージで共有する。

## セキュリティと設定
Supabase・OpenAI・Resend などの鍵は `.env.local` など Git に含めないファイルで管理し、新しい環境変数は `docs/` に整理する。OCR/CAD を有効化する前に図面データを匿名化し、指定の Supabase バケットに保存、`CLAUDE.md` で推奨される RLS ポリシーを適用する。
