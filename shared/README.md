# Shared Types & Constants

フロントエンド・バックエンド共通で使用する型定義、スキーマ、定数を管理するディレクトリです。

## ディレクトリ構成

```
shared/
├── types/              # TypeScript型定義
│   ├── project.d.ts    # プロジェクト関連型
│   ├── drawing.d.ts    # 作図関連型
│   ├── estimate.d.ts   # 見積関連型
│   ├── ai.ts           # AI機能関連型
│   └── index.ts        # エクスポートまとめ
├── schemas/            # JSONスキーマ
│   ├── building_schema.json    # 建物データスキーマ
│   ├── scaffold_schema.json    # 足場設定スキーマ
│   └── ai_functions.json       # AI Function定義
├── constants/          # 定数定義
│   ├── scaffold_spec.ts        # 足場仕様定数
│   ├── error_codes.ts          # エラーコード定数
│   └── index.ts                # エクスポートまとめ
└── README.md           # このファイル
```

## 使用方法

### フロントエンド（TypeScript）

```typescript
// 型定義のインポート
import type { Project, Drawing, Estimate } from '@/shared/types';

// 定数のインポート
import { SCAFFOLD_UNIT_WIDTHS, ERROR_MESSAGES } from '@/shared/constants';

// 使用例
const project: Project = {
  id: '123',
  user_id: 'user-1',
  name: 'テストプロジェクト',
  status: 'planning',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const unitWidth = SCAFFOLD_UNIT_WIDTHS.STANDARD; // 1800
```

### バックエンド（Python）

JSONスキーマを使用してバリデーションを行います。

```python
import json
from jsonschema import validate

# スキーマ読み込み
with open('shared/schemas/building_schema.json') as f:
    schema = json.load(f)

# バリデーション
building_data = {
    "id": "building-1",
    "project_id": "project-1",
    "width": 10.5,
    "height": 8.0,
    "walls": []
}

validate(instance=building_data, schema=schema)
```

## 型定義の説明

### Project（プロジェクト）
- プロジェクトの基本情報を管理
- ステータス管理（planning, in_progress, completed等）
- 顧客情報、現場住所などを含む

### Drawing（作図）
- Konva.jsで作成した作図データ
- 図形（Shape）の配列を管理
- レイヤー別（building, scaffold, annotation）に管理

### Estimate（見積）
- 見積項目の配列を管理
- 自動計算（小計、消費税、合計）
- PDF生成オプション対応

### AI関連
- チャットメッセージ
- Function Calling定義
- OCR解析結果
- 足場自動生成結果

## 定数の説明

### 足場仕様（scaffold_spec.ts）
- 標準単位幅（1800mm / 900mm）
- 1段あたりの高さ（1500mm）
- 安全基準（手すり高さ、幅木高さ等）
- 部材重量

### エラーコード（error_codes.ts）
- カテゴリ別エラーコード定義
- 日本語エラーメッセージマッピング
- フロントエンド・バックエンド共通で使用

## バージョン管理

型定義・スキーマ・定数の変更は以下のルールに従います：

1. **破壊的変更**: メジャーバージョンアップ
   - 既存のフィールド削除
   - 型の変更

2. **後方互換性のある追加**: マイナーバージョンアップ
   - 新しいオプショナルフィールド追加
   - 新しい定数追加

3. **バグ修正**: パッチバージョンアップ
   - 型の修正
   - ドキュメント修正
