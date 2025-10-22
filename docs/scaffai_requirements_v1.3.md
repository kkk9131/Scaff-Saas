# 🏗️ 足場業務支援SaaS 要件定義書（v1.3拡張版）

## 1. プロジェクト概要
**プロジェクト名**：ScaffAI（仮称）  
**開発形態**：個人開発（将来的に法人展開を視野）  
**目的**：  
- 職人でも扱える直感的UIで、足場図面・見積・送信業務を自動化。  
- 建築図面・CADを解析して**自動で足場を生成**するAI搭載SaaS。  
- 現場から「図面を撮る／送る」だけで作業完結を目指す。

---

## 2. フェーズ構成

| フェーズ | 機能範囲 | 目標 |
|-----------|------------|------|
| **v1.0 (MVP)** | 認証・プロジェクト管理・作図（Konva）・DXF出力・AIチャット | 基本操作とAIサポートを統合 |
| **v1.1** | 顧客管理・見積PDF生成・AIメール送信 | 図面〜見積〜送信の一連自動化 |
| **v1.2** | DXF→3D変換・Web3Dプレビュー | 足場の立体可視化 |
| **v1.3 (新)** | 図面OCR＋CAD解析→建物データ化→自動足場生成 | “図面を読み取って自動作図” を実現 |
| **v2.0** | WebAR投影（Three.js + WebXR） | 現場AR表示 |
| **v2.5** | モバイル連携（Expo）＋ARKit対応 | モバイル編集＋現場投影 |
| **v3.0** | 音声＋AI完全統合（音声指令で作図） | “話すだけで足場設計” 完成 |

---

## 3. 技術スタック（拡張対応）

### フロントエンド
- Next.js（React + TypeScript）
- Konva.js（2D作図）
- Tailwind CSS + shadcn/ui
- React Query / Zustand（状態管理）
- react-pdf / jsPDF（見積書出力）
- dxf-writer（CAD出力）
- three.js（3D／AR準備）

### バックエンド
- FastAPI（Python）
- Supabase（DB＋Storage＋Auth）
- OpenAI API（GPT-5／Vision／Function Calling）
- Resend / SendGrid（自動メール送信）
- OpenCV + ezdxf + PaddleOCR（図面解析）

---

## 4. 新機能詳細（v1.3）

### 🧠 概要
建築図面（PDF／画像／CAD）をAIが解析し、建物外形・寸法・階層などを抽出して**建物データとして保存**。  
ユーザーが仕様を設定することで、足場図面を**自動生成**できる。

---

### 🧩 処理フロー
```
1️⃣ 図面アップロード（画像 or DXF）
       ↓
2️⃣ OCR＋線抽出（OpenCV / Vision API）
       ↓
3️⃣ 建物データ（寸法・形状）として保存
       ↓
4️⃣ ユーザーが仕様（部材・高さ・境界）を設定
       ↓
5️⃣ 足場図面自動作図（Konva / DXF出力）
```

---

### ⚙️ 使用技術
| 処理 | 技術 | 詳細 |
|------|------|------|
| 図面OCR | PaddleOCR / OpenAI Vision | 図面内文字や寸法を抽出 |
| 線抽出 | OpenCV.js / cv2 | 外壁・屋根ラインの検出 |
| DXF解析 | ezdxf / dxf-parser | CADファイルのLINE/POLYLINE解析 |
| 構造補完 | GPT-5 Vision | 不足線や誤認識をAI補正 |
| データ変換 | JSON構造体化 | 建物形状・高さを保存 |
| 足場生成 | FastAPIロジック | JSONを元に足場配置を自動生成 |

---

## 5. データモデル拡張

### 新規テーブル
| テーブル名 | カラム | 内容 |
|-------------|---------|------|
| **building_data** | id, project_id, structure_json, source_type, created_at | 建物構造データ（OCR／DXF） |
| **ocr_logs** | id, project_id, file_url, result_json, accuracy | OCR解析履歴 |
| **ai_corrections** | id, project_id, prompt, result_json, confidence | AI補完ログ |

---

## 6. AI連携設計

| 要素 | 詳細 |
|------|------|
| **AIモデル** | GPT-5 Vision（OCR補完＋構造推定） |
| **Function API** | `parse_drawing()`, `generate_scaffold()`, `suggest_correction()` |
| **出力形式** | JSON構造（例：walls, roof, openings, scale, levels） |
| **保存** | Supabase Storage（元図面）＋DB（構造JSON） |
| **チャット連携例** | 「この図面から足場を自動生成して」→ APIトリガー発火 |

---

## 7. 自動生成ロジック例（Python擬似）

```python
def generate_scaffold(building_json, spec):
    for wall in building_json["walls"]:
        height = spec["height"]
        length = wall["length"]
        scaffold_units = calc_units(length, height)
        add_to_canvas(scaffold_units)
```

---

## 8. UIフロー（拡張画面）

| 画面 | 主なUI構成 |
|------|-------------|
| 図面アップロード | ファイル選択／OCR実行ボタン／解析結果プレビュー |
| 建物データ確認 | 抽出された外形を2Dプレビュー表示 |
| 足場仕様設定 | 高さ／段数／部材タイプを選択 |
| 自動作図 | ボタン一つで足場図を生成（Konva）＋DXF出力 |
| AIチャット | 「図面を読み取って足場を作って」→自動実行 |

---

## 9. フェーズ別タスク更新

| フェーズ | 実装内容 | 主要技術 |
|-----------|-----------|-----------|
| **v1.3** | OCR＋DXFパース→構造データ保存 | PaddleOCR + ezdxf |
| **v1.4** | 足場仕様設定＋自動生成アルゴリズム | FastAPI + Konva |
| **v1.5** | AIチャット統合（自動作図命令対応） | OpenAI Function Calling |
| **v2.0** | WebAR投影 | three.js + AR.js |
| **v2.5** | モバイルAR／ARKit対応 | Expo + react-native-arkit |

---

## 10. 成果目標

| 項目 | 評価基準 |
|------|------------|
| OCR精度 | 主要寸法の認識率90%以上 |
| 図面→足場変換 | 自動配置の誤差5%以内 |
| DXF互換性 | AutoCAD / JW-CADで開ける |
| AIチャット統合 | 「図面を読み取って足場作成」命令で一連処理成功 |

---

## 11. 期待される効果
- 手動入力不要：現場で撮影→AI解析→自動図面化  
- 熟練者依存の削減：自動補完による精度均一化  
- 営業スピード向上：図面→見積→送信が自動フロー化  
- 競合との差別化：AI×CAD×OCRを統合した唯一の職人DXツール  

---

✅ **結論**  
このv1.3拡張で、ScaffAIは「現調図面を自動理解し、足場を自動設計するAI SaaS」へ進化します。  
職人→現場→AI→設計→見積まで完全自動のワークフローを実現できます。


📁 推奨ディレクトリ構成
scaffai/
├── frontend/                         # Next.js + TypeScript（UI・描画・AIチャット）
│   ├── app/
│   │   ├── page.tsx                  # メインダッシュボード（プロジェクト一覧）
│   │   ├── draw/
│   │   │   ├── page.tsx              # 足場作図画面（Konva.js）
│   │   │   ├── hooks/                # 作図関連ロジック
│   │   │   └── components/
│   │   │       ├── CanvasStage.tsx   # Konvaステージ
│   │   │       ├── ToolPanel.tsx     # ツールバー（線・矩形・削除）
│   │   │       ├── LayerMenu.tsx     # レイヤー制御（足場・建物・注記）
│   │   │       └── ExportPanel.tsx   # PDF/DXF出力UI
│   │   ├── chat/
│   │   │   ├── page.tsx              # AIチャット画面
│   │   │   ├── ChatWindow.tsx        # メインチャットUI
│   │   │   └── ChatAPI.ts            # AI API呼び出しロジック
│   │   ├── upload/
│   │   │   ├── page.tsx              # 図面アップロード画面
│   │   │   └── OCRPreview.tsx        # OCR結果プレビュー
│   │   └── project/
│   │       └── [id]/page.tsx         # プロジェクト詳細（建物データ・足場設定）
│   ├── lib/
│   │   ├── api.ts                    # API呼び出し（FastAPI連携）
│   │   ├── supabase.ts               # Supabaseクライアント設定
│   │   ├── konvaUtils.ts             # DXF出力用変換ユーティリティ
│   │   └── aiFunctions.ts            # ChatGPT Function定義
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── Toast.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── public/
│   │   └── icons/
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                          # FastAPI（AI・OCR・DXF・足場ロジック）
│   ├── main.py                       # APIエントリーポイント
│   ├── routers/
│   │   ├── upload.py                 # ファイルアップロード処理
│   │   ├── ocr.py                    # OCR解析（PaddleOCR / Vision）
│   │   ├── dxf_parser.py             # DXF解析（ezdxf）
│   │   ├── ai.py                     # OpenAI連携（構造補完・自動作図）
│   │   ├── scaffold.py               # 足場割付ロジック
│   │   └── export.py                 # DXF出力／PDF生成
│   ├── services/
│   │   ├── ocr_service.py
│   │   ├── dxf_service.py
│   │   ├── scaffold_service.py
│   │   └── ai_service.py
│   ├── models/
│   │   ├── project.py
│   │   ├── building_data.py
│   │   ├── drawing.py
│   │   └── estimate.py
│   ├── utils/
│   │   ├── supabase_client.py
│   │   ├── dxf_writer.py
│   │   └── pdf_generator.py
│   ├── tests/
│   │   ├── test_ocr.py
│   │   ├── test_dxf_parser.py
│   │   ├── test_ai_generation.py
│   │   └── test_scaffold_logic.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── shared/                           # 共通リソース（型・定数・AI関数スキーマ）
│   ├── schemas/
│   │   ├── building_schema.json
│   │   ├── scaffold_schema.json
│   │   └── ai_functions.json
│   ├── types/
│   │   ├── project.d.ts
│   │   ├── drawing.d.ts
│   │   ├── ai.ts
│   │   └── scaffold.ts
│   └── constants/
│       ├── scaffold_spec.ts          # 足場仕様定義（標準単位・段数）
│       └── error_codes.ts
│
├── docs/
│   ├── scaffai_requirements_v1.3.md  # 要件定義書
│   ├── scaffai_api_spec_v1.3.md      # API設計書
│   └── architecture_diagram.png      # システム構成図
│
├── scripts/
│   ├── deploy_frontend.sh
│   ├── deploy_backend.sh
│   └── init_supabase.sh
│
└── README.md

🔍 ディレクトリ設計のポイント
セクション    狙い
frontend/    Next.jsのApp Router構成（/draw, /chat, /upload が主要機能）
backend/    FastAPIをマイクロモジュール化。OCR／AI／DXFをrouter単位に分離
shared/    型・スキーマを共通管理（TypeScriptとPythonで共用）
docs/    すべての設計ドキュメントをMarkdownで保存。バージョン別に管理
scripts/    CI/CDやSupabase初期化スクリプトを統一
