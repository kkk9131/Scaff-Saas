# Supabase セットアップガイド

## プロジェクト情報

- **プロジェクト名**: Scaff-SaaS
- **プロジェクトID**: `jbcltijeibwrblgoymwf`
- **リージョン**: `ap-northeast-1` (東京)
- **PostgreSQLバージョン**: 17.6.1
- **ステータス**: ACTIVE_HEALTHY

## データベーススキーマ

### テーブル一覧

#### 1. profiles (ユーザープロフィール)
auth.usersテーブルを拡張したユーザー情報テーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | ユーザーID (auth.users.idへの外部キー) |
| company_name | VARCHAR(255) | 会社名 |
| phone | VARCHAR(50) | 電話番号 |
| address | TEXT | 住所 |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

#### 2. projects (プロジェクト)
足場設計プロジェクトの管理テーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | プロジェクトID |
| user_id | UUID | ユーザーID |
| name | VARCHAR(255) | プロジェクト名 |
| description | TEXT | 説明 |
| status | project_status | ステータス (draft/in_progress/completed/archived) |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

#### 3. building_data (建物データ)
OCR/DXF解析結果を格納するテーブル

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 建物データID |
| project_id | UUID | プロジェクトID |
| structure_json | JSONB | 建物構造データ (walls, roof, openings, scale, levels) |
| blueprint_url | TEXT | 元の図面ファイルURL (Supabase Storage) |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

**structure_json 構造例**:
```json
{
  "walls": [
    {"x1": 0, "y1": 0, "x2": 10, "y2": 0, "height": 3},
    {"x1": 10, "y1": 0, "x2": 10, "y2": 8, "height": 3}
  ],
  "roof": {
    "type": "gable",
    "height": 5,
    "angle": 30
  },
  "openings": [
    {"type": "door", "x": 5, "y": 0, "width": 1, "height": 2},
    {"type": "window", "x": 2, "y": 0, "width": 1.5, "height": 1.5}
  ],
  "scale": {
    "unit": "meter",
    "scale_ratio": "1:100"
  },
  "levels": 2
}
```

#### 4. scaffold_designs (足場設計)
足場設計データとKonva.js描画データを格納

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | 設計ID |
| project_id | UUID | プロジェクトID |
| building_data_id | UUID | 建物データID (NULL可) |
| material | scaffold_material | 足場材質 (steel/aluminum/bamboo) |
| height_meters | DECIMAL(10,2) | 足場の高さ (メートル) |
| design_json | JSONB | Konva.js描画データ |
| dxf_data | TEXT | DXFエクスポート用データ |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

#### 5. ocr_logs (OCR解析ログ)
OCR処理の履歴と精度を記録

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | ログID |
| building_data_id | UUID | 建物データID |
| input_image_url | TEXT | 入力画像URL |
| recognized_text | TEXT | 認識されたテキスト |
| confidence_score | DECIMAL(5,4) | 信頼度スコア (0.0000～1.0000) |
| processing_time_ms | INTEGER | 処理時間 (ミリ秒) |
| created_at | TIMESTAMP | 作成日時 |

#### 6. ai_corrections (AI補完ログ)
AIによる構造補完の履歴を記録

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | ログID |
| building_data_id | UUID | 建物データID |
| correction_type | VARCHAR(100) | 補完タイプ (dimension_inference/structure_completion等) |
| original_data | JSONB | 元のデータ |
| corrected_data | JSONB | 補完後のデータ |
| confidence_score | DECIMAL(5,4) | 信頼度スコア |
| created_at | TIMESTAMP | 作成日時 |

#### 7. chat_messages (AIチャット履歴)
プロジェクトごとのAIチャット履歴

| カラム名 | 型 | 説明 |
|---------|-----|------|
| id | UUID | メッセージID |
| project_id | UUID | プロジェクトID |
| role | VARCHAR(20) | ロール (user/assistant/system) |
| content | TEXT | メッセージ内容 |
| created_at | TIMESTAMP | 作成日時 |

### インデックス

パフォーマンス最適化のため、以下のインデックスを設定：

- `idx_projects_user_id`: projectsテーブルのuser_id
- `idx_projects_status`: projectsテーブルのstatus
- `idx_building_data_project_id`: building_dataテーブルのproject_id
- `idx_scaffold_designs_project_id`: scaffold_designsテーブルのproject_id
- `idx_scaffold_designs_building_data_id`: scaffold_designsテーブルのbuilding_data_id
- `idx_ocr_logs_building_data_id`: ocr_logsテーブルのbuilding_data_id
- `idx_ai_corrections_building_data_id`: ai_correctionsテーブルのbuilding_data_id
- `idx_chat_messages_project_id`: chat_messagesテーブルのproject_id
- `idx_chat_messages_created_at`: chat_messagesテーブルのcreated_at

## Row Level Security (RLS)

すべてのテーブルでRLSを有効化し、ユーザーは自分のデータのみアクセス可能。

### 主要ポリシー

#### Profiles
- ユーザーは自分のプロフィールのみ閲覧・更新・作成可能

#### Projects
- ユーザーは自分が作成したプロジェクトのみアクセス可能
- SELECT/INSERT/UPDATE/DELETEすべてで`user_id = auth.uid()`をチェック

#### Building Data / Scaffold Designs / Chat Messages
- プロジェクト所有者のみアクセス可能
- `EXISTS`サブクエリでプロジェクトの所有権を確認

#### OCR Logs / AI Corrections
- 建物データの所有者（プロジェクト所有者経由）のみアクセス可能
- 二段階のJOINでプロジェクト所有権を確認

### パフォーマンス最適化

RLSポリシーで`auth.uid()`を`(select auth.uid())`に変更することで、行ごとの再評価を防ぎパフォーマンス向上。

## ストレージ

### バケット構成

#### 1. blueprints (図面ファイル)
- **公開設定**: 非公開
- **ファイルサイズ制限**: 50MB (52,428,800 bytes)
- **許可MIMEタイプ**:
  - `image/png`
  - `image/jpeg`
  - `image/jpg`
  - `application/pdf`
  - `application/dxf`
  - `image/vnd.dxf`

#### 2. exports (エクスポートファイル)
- **公開設定**: 非公開
- **ファイルサイズ制限**: 10MB (10,485,760 bytes)
- **許可MIMEタイプ**:
  - `application/pdf`
  - `application/dxf`
  - `image/vnd.dxf`
  - `application/json`

### ストレージRLSポリシー

認証済みユーザーのみアップロード可能で、ユーザーは自分のフォルダ（`{user_id}/...`）のファイルのみアクセス可能。

**注意**: ストレージポリシーはSupabase Dashboardから手動で設定する必要があります。
マイグレーションファイル: `supabase/migrations/20250101000003_storage_policies.sql`

## マイグレーション

### 適用済みマイグレーション

1. `create_initial_schema`: 基本スキーマとテーブル作成
2. `enable_rls_policies`: RLSポリシーの設定
3. `storage_policies`: ストレージポリシー（手動適用が必要）
4. `fix_function_search_path_cascade`: セキュリティ警告の修正
5. `optimize_rls_performance`: パフォーマンス最適化（手動適用が必要）

### 今後の手動作業

#### 1. ストレージポリシーの設定

Supabase Dashboard → Storage → Policies から以下を設定：

**blueprintsバケット**:
```sql
-- アップロード許可
CREATE POLICY "Authenticated users can upload blueprints"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'blueprints' AND auth.role() = 'authenticated');

-- 閲覧許可
CREATE POLICY "Users can view own blueprints"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blueprints' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**exportsバケット**: 同様のポリシーを設定

#### 2. パフォーマンス最適化マイグレーションの適用

Supabase Dashboard → SQL Editor から以下のファイルを実行：
- `supabase/migrations/20250101000004_optimize_rls_performance.sql`

## セキュリティチェック

### Security Advisors (セキュリティアドバイザー)

✅ すべてのセキュリティ警告をクリア済み

### Performance Advisors (パフォーマンスアドバイザー)

以下の最適化を実施：
- ✅ `handle_updated_at`関数の`search_path`を修正
- ✅ RLSポリシーで`(select auth.uid())`を使用
- ✅ `scaffold_designs.building_data_id`にインデックス追加

未使用インデックスの警告は、データがまだないため正常。

## API情報

### プロジェクトURL
```
https://jbcltijeibwrblgoymwf.supabase.co
```

### データベース接続情報
```
Host: db.jbcltijeibwrblgoymwf.supabase.co
PostgreSQL: 17.6.1
```

### 環境変数設定

フロントエンドとバックエンドで以下の環境変数を設定：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://jbcltijeibwrblgoymwf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anonキー - Dashboardから取得]
SUPABASE_SERVICE_ROLE_KEY=[service_roleキー - Dashboardから取得]
```

## セットアップ完了状況

### ✅ 完了済み

1. ✅ データベーススキーマ作成完了（Supabase MCP）
2. ✅ RLSポリシー設定完了（Supabase MCP）
3. ✅ ストレージバケット作成完了（Supabase MCP）
4. ✅ ストレージポリシー設定完了（SQL Editor）
5. ✅ パフォーマンス最適化マイグレーション適用完了（Supabase MCP）
6. ✅ 環境変数ファイル作成完了（Supabase MCP）

### 🎉 Supabaseセットアップ100%完了！

すべてのデータベース、ストレージ、セキュリティ設定が完了しました。
次のタスク（TASK-101: 認証フロントエンド実装）に進めます。

### ⏳ 次のステップ

7. ⏳ フロントエンドからのSupabase接続テスト
8. ⏳ 認証フローの実装（TASK-101）
9. ⏳ プロジェクト管理機能の実装（TASK-201）
10. ⏳ OCR/AI機能の統合（TASK-501）

## トラブルシューティング

### マイグレーションエラー

エラーが発生した場合、Supabase Dashboard → SQL Editor から直接SQLを実行してください。

### RLSポリシーのテスト

```sql
-- ユーザーとして実行（auth.uid()をテスト用UUIDに置換）
SELECT * FROM public.projects WHERE user_id = 'test-user-id';
```

### パフォーマンス確認

```sql
-- クエリプランの確認
EXPLAIN ANALYZE SELECT * FROM public.projects WHERE user_id = auth.uid();
```

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [ストレージガイド](https://supabase.com/docs/guides/storage)
- [パフォーマンス最適化](https://supabase.com/docs/guides/database/database-linter)
