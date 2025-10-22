# 🗺️ ScaffAI 完全開発ロードマップ

**最終更新**: 2025-10-22
**ドキュメントバージョン**: v2.0

---

## 📋 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [MVP機能とスクリーン対応](#mvp機能とスクリーン対応)
3. [フェーズ別開発計画](#フェーズ別開発計画)
4. [技術スタック詳細](#技術スタック詳細)
5. [開発優先順位と依存関係](#開発優先順位と依存関係)
6. [成果指標とマイルストーン](#成果指標とマイルストーン)

---

## 🎯 プロジェクト概要

### プロジェクト名
**ScaffAI（スキャッファイ）** - AI搭載足場業務支援SaaS

### 開発形態
個人開発（将来的に法人展開を視野）

### 核心的価値提案
```
現場で図面を撮影 → AIが解析 → 自動で足場設計
職人でも扱える直感的UIで、図面・見積・送信業務を完全自動化
```

### ターゲットユーザー
- 足場業者の職人・営業担当者
- CAD操作に不慣れな現場スタッフ
- 見積作成・提案業務の効率化を求める事業者

### 競合優位性
**AI×CAD×OCR**を統合した唯一の職人向けDXツール

---

## 🧱 MVP機能とスクリーン対応

### MVP（v1.0）で提供する4本柱

| 機能カテゴリ | 機能内容 | 依存スクリーン | 優先度 | 技術要素 |
|-------------|----------|---------------|--------|----------|
| **🔐 認証** | Supabase Auth（ログイン・新規登録） | 🔹ログイン画面 | ★★★★★ | Supabase Auth, Next.js App Router |
| **📁 プロジェクト管理** | プロジェクトの作成／削除／複製／一覧表示 | 🔹プロジェクト一覧画面<br>🔹プロジェクト詳細画面 | ★★★★★ | Supabase DB, React Query, 看板UI |
| **✏️ 作図機能** | Konva.jsを用いた足場作図（線・矩形・削除・保存） | 🔹作図画面 | ★★★★★ | Konva.js, Canvas API, Zustand |
| **📐 割付ロジック** | 躯体幅や軒出から自動で割付け（1800/900単位） | 🔹作図画面 | ★★★★☆ | カスタムアルゴリズム, FastAPI |
| **📄 DXF出力** | 作図したデータをCAD互換（DXF）形式で出力 | 🔹作図画面 | ★★★★★ | dxf-writer, Supabase Storage |
| **💰 見積機能** | 平米計算＋単価設定→PDF見積書出力 | 🔹見積作成画面 | ★★★★★ | jsPDF, react-pdf, FastAPI |
| **🤖 AIアシスタント** | 「見積作って」「DXFで出して」など自然言語指令 | 🔹AIチャット画面 | ★★★★★ | OpenAI GPT-5, Function Calling |
| **👥 顧客情報管理（簡易）** | 顧客名・メール・単価などを設定 | 🔹設定／顧客管理画面 | ★★★☆☆ | Supabase DB, フォーム管理 |
| **💾 ファイル保存** | JSON, DXF, PDFをSupabase Storageへ保存 | 🔹作図・見積両画面 | ★★★★★ | Supabase Storage API |
| **🎨 UI操作** | 看板ボード型UIで直感的操作（ドラッグ／カード） | 🔹プロジェクト一覧画面 | ★★★★☆ | dnd-kit, Tailwind CSS, shadcn/ui |

### MVPスクリーン構成（計7画面）

```
📱 ScaffAI アプリケーション構造

├─ 🔐 ログイン画面
│   ├─ メール/パスワードログイン
│   └─ 新規登録リンク
│
├─ 🏠 ホーム（プロジェクト一覧画面）
│   ├─ 看板ボード型UI
│   ├─ プロジェクトカード（ドラッグ可能）
│   ├─ 新規作成ボタン
│   └─ 検索・フィルター
│
├─ 📋 プロジェクト詳細画面
│   ├─ プロジェクト基本情報
│   ├─ 作図へ遷移ボタン
│   ├─ 見積へ遷移ボタン
│   └─ ファイル一覧
│
├─ ✏️ 作図画面
│   ├─ Konvaキャンバス（メイン）
│   ├─ ツールパネル（線・矩形・削除）
│   ├─ レイヤーメニュー
│   ├─ 割付設定パネル
│   └─ DXF出力ボタン
│
├─ 💰 見積作成画面
│   ├─ 平米自動計算
│   ├─ 単価設定フォーム
│   ├─ 見積プレビュー
│   └─ PDF出力ボタン
│
├─ 🤖 AIチャット画面
│   ├─ チャットインターフェース
│   ├─ 自然言語入力
│   ├─ 実行履歴
│   └─ 結果表示エリア
│
└─ ⚙️ 設定／顧客管理画面
    ├─ 顧客情報登録フォーム
    ├─ 単価テンプレート設定
    └─ アカウント設定
```

### MVPユーザーフロー

```
1. ログイン
   ↓
2. プロジェクト一覧（看板形式で管理）
   ↓
3. プロジェクト詳細
   ├─ 作図（Konvaで足場作成＋DXF出力）
   ├─ 見積（自動計算＋PDF生成）
   └─ AIチャット（自然文で操作・出力）
   ↓
4. 設定（顧客／単価を登録）
```

---

## 📅 フェーズ別開発計画

### フェーズ全体像

| フェーズ | 期間目安 | 機能範囲 | 目標 | 主要技術 |
|---------|---------|----------|------|----------|
| **v1.0 (MVP)** | 2-3ヶ月 | 認証・プロジェクト管理・作図・DXF出力・AIチャット | 基本操作とAIサポートを統合 | Next.js, Konva.js, Supabase, OpenAI |
| **v1.1** | 1ヶ月 | 顧客管理・見積PDF生成・AIメール送信 | 図面〜見積〜送信の一連自動化 | jsPDF, Resend/SendGrid |
| **v1.2** | 1.5ヶ月 | DXF→3D変換・Web3Dプレビュー | 足場の立体可視化 | three.js, WebGL |
| **v1.3** | 2ヶ月 | 図面OCR＋CAD解析→建物データ化→自動足場生成 | "図面を読み取って自動作図" を実現 | PaddleOCR, OpenCV, ezdxf, GPT-5 Vision |
| **v1.4** | 1ヶ月 | 足場仕様設定＋自動生成アルゴリズム最適化 | 割付精度向上と自動化 | FastAPI, カスタムアルゴリズム |
| **v1.5** | 1ヶ月 | AIチャット統合（自動作図命令対応） | 完全音声＋チャット操作 | OpenAI Function Calling |
| **v2.0** | 2ヶ月 | WebAR投影（Three.js + WebXR） | 現場AR表示 | three.js, WebXR, AR.js |
| **v2.5** | 2ヶ月 | モバイル連携（Expo）＋ARKit対応 | モバイル編集＋現場投影 | React Native, Expo, ARKit |
| **v3.0** | 3ヶ月 | 音声＋AI完全統合（音声指令で作図） | "話すだけで足場設計" 完成 | Web Speech API, OpenAI Whisper |

### 📌 v1.0 (MVP) 詳細タスク分解

#### フェーズ1: 基盤構築（Week 1-2）

**優先度: 🔴 最重要**

| タスク | 内容 | 成果物 | 担当技術 |
|--------|------|--------|----------|
| プロジェクトセットアップ | Next.js + TypeScript環境構築 | package.json, tsconfig.json | Next.js 14, TypeScript |
| Supabase初期化 | DB設計、Auth設定、Storage設定 | Supabaseプロジェクト、初期テーブル | Supabase CLI |
| 共通コンポーネント作成 | Header, Sidebar, Toast, Loading | UI基盤 | shadcn/ui, Tailwind CSS |
| 認証機能実装 | ログイン、新規登録、セッション管理 | ログイン画面 | Supabase Auth |

**データベーススキーマ（v1.0）**:
```sql
-- ユーザーテーブル（Supabase Auth管理）
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP
)

-- プロジェクトテーブル
projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT, -- 'planning', 'in_progress', 'completed'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 作図データテーブル
drawings (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  canvas_data JSONB, -- Konva JSON
  dxf_file_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 見積データテーブル
estimates (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  area_sqm NUMERIC,
  unit_price NUMERIC,
  total_price NUMERIC,
  pdf_file_url TEXT,
  created_at TIMESTAMP
)

-- 顧客テーブル
customers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT,
  unit_price NUMERIC,
  created_at TIMESTAMP
)
```

#### フェーズ2: プロジェクト管理（Week 3-4）

**優先度: 🔴 最重要**

| タスク | 内容 | 成果物 | 担当技術 |
|--------|------|--------|----------|
| プロジェクト一覧UI | 看板ボード型レイアウト実装 | ホーム画面 | dnd-kit, React Query |
| プロジェクトCRUD | 作成・編集・削除・複製機能 | API routes, DB操作 | Next.js API, Supabase |
| プロジェクト詳細画面 | 基本情報表示、遷移ボタン配置 | 詳細画面 | React, Zustand |

#### フェーズ3: 作図機能（Week 5-7）

**優先度: 🔴 最重要**

| タスク | 内容 | 成果物 | 担当技術 |
|--------|------|--------|----------|
| Konvaキャンバス初期化 | ステージ、レイヤー、基本図形 | CanvasStage.tsx | Konva.js, React Konva |
| ツールパネル実装 | 線・矩形・削除ツール | ToolPanel.tsx | React, Zustand |
| レイヤー管理 | 足場・建物・注記レイヤー | LayerMenu.tsx | Konva Layers |
| 割付ロジック実装 | 1800/900単位自動計算 | FastAPI endpoint | FastAPI, Python |
| DXF出力機能 | Konva JSON → DXF変換 | konvaUtils.ts, DXF files | dxf-writer |
| 保存・読込機能 | Supabase Storage連携 | Save/Load API | Supabase Storage |

**作図機能の技術詳細**:
```typescript
// Konva図形データ構造例
interface CanvasData {
  version: string;
  stage: {
    width: number;
    height: number;
    scale: number;
  };
  layers: {
    scaffold: ScaffoldElement[];  // 足場レイヤー
    building: BuildingElement[];  // 建物レイヤー
    annotation: AnnotationElement[]; // 注記レイヤー
  };
}

// 割付ロジック例
function calculateScaffoldUnits(buildingWidth: number, buildingHeight: number) {
  const STANDARD_UNIT = 1800; // mm
  const SMALL_UNIT = 900; // mm
  const STAGE_HEIGHT = 1500; // mm

  const horizontalUnits = Math.ceil(buildingWidth / STANDARD_UNIT);
  const verticalStages = Math.ceil(buildingHeight / STAGE_HEIGHT);

  return {
    horizontal: horizontalUnits,
    vertical: verticalStages,
    total: horizontalUnits * verticalStages
  };
}
```

#### フェーズ4: 見積機能（Week 8-9）

**優先度: 🔴 最重要**

| タスク | 内容 | 成果物 | 担当技術 |
|--------|------|--------|----------|
| 平米計算ロジック | 作図データから自動計算 | 計算API | FastAPI |
| 見積入力フォーム | 単価設定、項目追加 | 見積画面 | React Hook Form |
| PDF生成機能 | 見積書フォーマット出力 | PDF Generator | jsPDF, react-pdf |

#### フェーズ5: AIアシスタント（Week 10-11）

**優先度: 🔴 最重要**

| タスク | 内容 | 成果物 | 担当技術 |
|--------|------|--------|----------|
| チャットUI実装 | メッセージ送受信UI | ChatWindow.tsx | React, WebSocket |
| OpenAI連携 | GPT-5 API統合 | ai_service.py | OpenAI API |
| Function Calling実装 | 作図・見積・出力コマンド | aiFunctions.ts | Function Calling |
| 実行エンジン | AI指令→実際の操作実行 | Execution Engine | FastAPI, Next.js API |

**AI Function定義例**:
```typescript
const aiFunctions = [
  {
    name: "create_scaffold_drawing",
    description: "足場図面を自動生成する",
    parameters: {
      type: "object",
      properties: {
        buildingWidth: { type: "number", description: "建物幅（mm）" },
        buildingHeight: { type: "number", description: "建物高さ（mm）" },
        scaffoldType: { type: "string", description: "足場タイプ" }
      },
      required: ["buildingWidth", "buildingHeight"]
    }
  },
  {
    name: "generate_estimate",
    description: "見積書を生成する",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "プロジェクトID" },
        unitPrice: { type: "number", description: "平米単価" }
      },
      required: ["projectId"]
    }
  },
  {
    name: "export_dxf",
    description: "DXFファイルをエクスポートする",
    parameters: {
      type: "object",
      properties: {
        drawingId: { type: "string", description: "図面ID" }
      },
      required: ["drawingId"]
    }
  }
];
```

#### フェーズ6: 統合・テスト（Week 12）

**優先度: 🔴 最重要**

| タスク | 内容 | 成果物 |
|--------|------|--------|
| E2Eテスト | 全フロー動作確認 | テストスクリプト |
| パフォーマンス最適化 | レンダリング高速化 | 最適化コード |
| バグ修正 | 発見された問題の修正 | 修正コミット |
| ドキュメント整備 | ユーザーガイド、API仕様書 | Markdown文書 |

### 📌 v1.1 詳細タスク（顧客管理・見積PDF・メール送信）

**期間**: 1ヶ月
**優先度**: 🟡 重要

| タスク | 内容 | 技術 |
|--------|------|------|
| 顧客管理画面強化 | 顧客一覧、詳細、編集機能 | React, Supabase |
| メールテンプレート | 見積送付メールフォーマット | React Email |
| メール送信機能 | AI指令でメール自動送信 | Resend/SendGrid API |
| PDF添付送信 | 見積PDFを添付して送信 | Nodemailer, FastAPI |

### 📌 v1.2 詳細タスク（3D可視化）

**期間**: 1.5ヶ月
**優先度**: 🟡 重要

| タスク | 内容 | 技術 |
|--------|------|------|
| DXF → 3Dモデル変換 | DXFデータを3Dジオメトリに変換 | three.js, ezdxf |
| 3Dビューアー実装 | Web上で3Dモデル表示 | React Three Fiber |
| カメラ操作 | ズーム、回転、パン操作 | OrbitControls |
| マテリアル設定 | 足場部材ごとの色分け | three.js Materials |

### 📌 v1.3 詳細タスク（OCR・自動生成）

**期間**: 2ヶ月
**優先度**: 🟢 拡張機能

| タスク | 内容 | 技術 |
|--------|------|------|
| 図面アップロード機能 | PDF/画像/DXFアップロード | Supabase Storage |
| OCRパイプライン | 文字・寸法抽出 | PaddleOCR, OpenAI Vision |
| 線抽出処理 | 壁・屋根ライン検出 | OpenCV.js |
| DXF解析 | LINE/POLYLINE抽出 | ezdxf, dxf-parser |
| AI構造補完 | 不足部分をAI補正 | GPT-5 Vision |
| 建物データ化 | JSON構造体に変換 | FastAPI, Pydantic |
| 自動足場生成 | 建物データ→足場配置 | カスタムアルゴリズム |

**新規データベーススキーマ（v1.3追加）**:
```sql
-- 建物データテーブル
building_data (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  structure_json JSONB, -- 建物形状データ
  source_type TEXT, -- 'ocr', 'dxf', 'manual'
  created_at TIMESTAMP
)

-- OCR解析ログテーブル
ocr_logs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  file_url TEXT,
  result_json JSONB,
  accuracy NUMERIC, -- 認識精度
  created_at TIMESTAMP
)

-- AI補完ログテーブル
ai_corrections (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  prompt TEXT,
  result_json JSONB,
  confidence NUMERIC, -- 信頼度
  created_at TIMESTAMP
)
```

### 📌 v2.0以降（AR・モバイル・音声）

**v2.0 - WebAR（2ヶ月）**:
- three.js + WebXRによるブラウザAR
- 現場での足場投影表示
- マーカーベース位置合わせ

**v2.5 - モバイルAR（2ヶ月）**:
- React Native (Expo)でモバイルアプリ化
- ARKit/ARCore統合
- オフライン対応

**v3.0 - 音声統合（3ヶ月）**:
- Web Speech API統合
- OpenAI Whisperによる音声認識
- 音声指令で作図・見積・出力

---

## 🛠️ 技術スタック詳細

### フロントエンド

| 技術 | バージョン | 用途 | 導入フェーズ |
|------|----------|------|-------------|
| **Next.js** | 14.x | フレームワーク基盤 | v1.0 |
| **TypeScript** | 5.x | 型安全性 | v1.0 |
| **React** | 18.x | UIライブラリ | v1.0 |
| **Tailwind CSS** | 3.x | スタイリング | v1.0 |
| **shadcn/ui** | latest | UIコンポーネント | v1.0 |
| **Konva.js** | 9.x | 2Dキャンバス描画 | v1.0 |
| **React Konva** | 18.x | React統合 | v1.0 |
| **React Query** | 5.x | サーバーステート管理 | v1.0 |
| **Zustand** | 4.x | クライアントステート管理 | v1.0 |
| **dnd-kit** | latest | ドラッグ&ドロップ | v1.0 |
| **jsPDF** | 2.x | PDF生成 | v1.0 |
| **react-pdf** | 7.x | PDF表示 | v1.0 |
| **dxf-writer** | latest | DXF出力 | v1.0 |
| **three.js** | latest | 3D描画 | v1.2 |
| **React Three Fiber** | 8.x | React 3D統合 | v1.2 |
| **OpenCV.js** | latest | 画像処理 | v1.3 |

### バックエンド

| 技術 | バージョン | 用途 | 導入フェーズ |
|------|----------|------|-------------|
| **FastAPI** | 0.100+ | APIフレームワーク | v1.0 |
| **Python** | 3.11+ | バックエンド言語 | v1.0 |
| **Pydantic** | 2.x | データバリデーション | v1.0 |
| **Supabase** | latest | DB・Storage・Auth | v1.0 |
| **PostgreSQL** | 15+ | データベース | v1.0 |
| **OpenAI API** | latest | AI統合 | v1.0 |
| **PaddleOCR** | 2.x | OCR処理 | v1.3 |
| **OpenCV** | 4.x | 画像解析 | v1.3 |
| **ezdxf** | 1.x | DXF解析 | v1.3 |
| **Resend/SendGrid** | latest | メール送信 | v1.1 |

### 開発・運用ツール

| 技術 | 用途 | 導入フェーズ |
|------|------|-------------|
| **ESLint** | コード品質管理 | v1.0 |
| **Prettier** | コードフォーマット | v1.0 |
| **Vitest** | ユニットテスト | v1.0 |
| **Playwright** | E2Eテスト | v1.0 |
| **Docker** | コンテナ化 | v1.0 |
| **GitHub Actions** | CI/CD | v1.0 |
| **Vercel** | フロントエンドデプロイ | v1.0 |
| **Railway/Render** | バックエンドデプロイ | v1.0 |

---

## 📊 開発優先順位と依存関係

### 依存関係グラフ

```
[認証機能] ← [基盤構築]
    ↓
[プロジェクト管理] ← [DB設計]
    ↓
[作図機能] ← [Konva.js統合]
    ↓
    ├─→ [割付ロジック]
    ├─→ [DXF出力]
    └─→ [保存機能]
    ↓
[見積機能] ← [作図データ]
    ↓
[AIアシスタント] ← [全機能]
    ↓
[顧客管理] ← [見積機能]
    ↓
[メール送信] ← [顧客管理]
    ↓
[3D可視化] ← [DXF出力]
    ↓
[OCR・自動生成] ← [作図機能]
    ↓
[AR機能] ← [3D可視化]
    ↓
[音声統合] ← [AIアシスタント]
```

### 開発順序（推奨）

#### 🔴 Phase 1: Core MVP（必須機能）
1. **Week 1-2**: 基盤構築 + 認証
2. **Week 3-4**: プロジェクト管理
3. **Week 5-7**: 作図機能（Konva + DXF）
4. **Week 8-9**: 見積機能
5. **Week 10-11**: AIアシスタント
6. **Week 12**: 統合・テスト

#### 🟡 Phase 2: Enhanced Features（付加価値機能）
7. **Month 4**: v1.1 - 顧客管理 + メール送信
8. **Month 5-6**: v1.2 - 3D可視化

#### 🟢 Phase 3: Advanced AI（差別化機能）
9. **Month 7-8**: v1.3 - OCR + 自動足場生成

#### 🔵 Phase 4: Future Vision（次世代機能）
10. **Month 9-10**: v2.0 - WebAR
11. **Month 11-12**: v2.5 - モバイルAR
12. **Month 13-15**: v3.0 - 音声統合

---

## 🎯 成果指標とマイルストーン

### v1.0 (MVP) 成功基準

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| **機能完成度** | 100% | 全7画面が動作 |
| **認証成功率** | 99%+ | Supabase Auth統計 |
| **作図操作性** | 3回以内で作図完了 | ユーザーテスト |
| **DXF出力成功率** | 95%+ | AutoCAD/JW-CAD互換確認 |
| **見積PDF生成速度** | 3秒以内 | パフォーマンステスト |
| **AI応答精度** | 80%+ | Function Calling成功率 |
| **ページ読込速度** | 2秒以内 | Lighthouse Score 90+ |

### v1.1 成功基準

| 指標 | 目標値 |
|------|--------|
| メール送信成功率 | 98%+ |
| PDF添付送信成功率 | 95%+ |
| 顧客管理データ整合性 | 100% |

### v1.3 成功基準（AI自動生成）

| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| **OCR認識精度** | 90%+ | 主要寸法の認識率 |
| **図面→足場変換精度** | 誤差5%以内 | 自動配置の正確性 |
| **DXF互換性** | AutoCAD/JW-CADで開ける | 互換性テスト |
| **AI自動作図成功率** | 85%+ | 「図面読取→足場作成」成功率 |

### マイルストーン一覧

| マイルストーン | 完了基準 | 期限目安 |
|---------------|----------|---------|
| **M1: プロジェクト初期化** | 環境構築・DB設計完了 | Week 2 |
| **M2: 認証システム稼働** | ログイン・新規登録動作 | Week 2 |
| **M3: プロジェクト管理完成** | CRUD操作全て動作 | Week 4 |
| **M4: 作図機能完成** | Konva描画・DXF出力動作 | Week 7 |
| **M5: 見積機能完成** | PDF生成動作 | Week 9 |
| **M6: AIアシスタント稼働** | 自然言語指令実行 | Week 11 |
| **M7: MVP完成** | 全機能統合・テスト完了 | Week 12 |
| **M8: v1.1完成** | 顧客管理・メール送信動作 | Month 4 |
| **M9: v1.2完成** | 3D可視化動作 | Month 6 |
| **M10: v1.3完成** | OCR自動生成動作 | Month 8 |

---

## 📝 開発時の注意事項

### コーディング規約
- すべての出力とコメントは**日本語**
- コード内には**初心者でも分かる日本語コメント**を必須記述
- 関数・クラスにはJSDoc/Docstring形式で日本語ドキュメント追加
- コミットメッセージは**日本語（軽い関西弁）**で記述

### Git運用
- **mainブランチへの操作は必ずユーザー確認**
- developブランチで開発、動作確認後にmainへマージ
- ブランチ命名: `feature/機能名`, `fix/修正内容`, `hotfix/緊急度-内容`

### テスト戦略
- ユニットテスト: 主要ロジックに対してVitest
- E2Eテスト: ユーザーフローに対してPlaywright
- 手動テスト: 各マイルストーン完了時に実施

### パフォーマンス目標
- First Contentful Paint (FCP): < 1.8秒
- Largest Contentful Paint (LCP): < 2.5秒
- Time to Interactive (TTI): < 3.5秒
- Cumulative Layout Shift (CLS): < 0.1

---

## 🚀 次のアクションステップ

### 今すぐ始めること

1. **✅ プロジェクト初期化**
   ```bash
   npx create-next-app@latest scaffai-frontend --typescript --tailwind --app
   cd scaffai-frontend
   npm install @supabase/supabase-js zustand @tanstack/react-query
   ```

2. **✅ Supabaseプロジェクト作成**
   - https://supabase.com でプロジェクト作成
   - DB設計に従ってテーブル作成
   - Storage設定（drawings, estimates, pdfs バケット作成）

3. **✅ バックエンド初期化**
   ```bash
   mkdir scaffai-backend
   cd scaffai-backend
   python -m venv venv
   source venv/bin/activate  # Windowsは venv\Scripts\activate
   pip install fastapi uvicorn supabase python-dotenv
   ```

4. **✅ 開発環境設定**
   - `.env.local` ファイル作成
   - Supabase接続情報設定
   - OpenAI API Key設定

5. **✅ 最初のコミット**
   ```bash
   git init
   git checkout -b develop
   git add .
   git commit -m "🎉 ScaffAI プロジェクトを初期化したで"
   git push origin develop
   ```

---

**📌 このロードマップは生きたドキュメントです。開発の進捗に応じて随時更新してください。**
