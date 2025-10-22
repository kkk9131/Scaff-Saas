-- サブスクリプションプラン管理テーブル作成マイグレーション
-- TASK-105: サブスクリプションプラン管理機能

-- ===================================================================
-- 0. 必要な関数の作成（update_updated_at_column関数）
-- ===================================================================

-- updated_at自動更新用の関数を作成（存在しない場合のみ）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- 1. subscription_plans テーブル（サブスクリプションプラン定義）
-- ===================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                    -- プラン名（例: "無料プラン", "プロプラン"）
  description TEXT,                              -- プラン説明
  stripe_price_id VARCHAR(255),                  -- Stripe Price ID（null=無料プラン）
  monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- 月額料金
  currency VARCHAR(3) NOT NULL DEFAULT 'JPY',    -- 通貨コード

  -- 機能制限
  max_projects INTEGER,                          -- 最大プロジェクト数（null=無制限）
  max_drawings_per_project INTEGER,              -- プロジェクトごとの最大図面数（null=無制限）
  max_storage_mb INTEGER,                        -- 最大ストレージ容量（MB）（null=無制限）
  ai_chat_enabled BOOLEAN NOT NULL DEFAULT false, -- AIチャット機能有効化
  advanced_drawing_enabled BOOLEAN NOT NULL DEFAULT false, -- 高度な描画機能有効化
  export_dxf_enabled BOOLEAN NOT NULL DEFAULT false,       -- DXFエクスポート機能有効化
  export_pdf_enabled BOOLEAN NOT NULL DEFAULT false,       -- PDFエクスポート機能有効化
  ocr_analysis_enabled BOOLEAN NOT NULL DEFAULT false,     -- OCR図面解析機能有効化

  -- プラン設定
  is_active BOOLEAN NOT NULL DEFAULT true,       -- プランが有効かどうか
  display_order INTEGER NOT NULL DEFAULT 0,      -- 表示順序（画面上の並び順）

  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- インデックス作成
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_display_order ON subscription_plans(display_order);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 2. user_subscriptions テーブル（ユーザーのサブスクリプション状態）
-- ===================================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Stripe関連情報
  stripe_customer_id VARCHAR(255),               -- Stripe Customer ID
  stripe_subscription_id VARCHAR(255),           -- Stripe Subscription ID
  stripe_payment_method_id VARCHAR(255),         -- Stripe Payment Method ID

  -- サブスクリプション状態
  status VARCHAR(50) NOT NULL DEFAULT 'active',  -- active, canceled, past_due, trialing, incomplete
  current_period_start TIMESTAMP WITH TIME ZONE, -- 現在の請求期間開始日
  current_period_end TIMESTAMP WITH TIME ZONE,   -- 現在の請求期間終了日
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false, -- 期間終了時に解約するか
  canceled_at TIMESTAMP WITH TIME ZONE,          -- 解約日時

  -- タイムスタンプ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- 制約: 1ユーザーは1つのアクティブなサブスクリプションのみ
  CONSTRAINT unique_active_subscription UNIQUE(user_id, status)
);

-- インデックス作成
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 3. subscription_usage テーブル（使用量トラッキング）
-- ===================================================================
CREATE TABLE IF NOT EXISTS subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,

  -- 使用量カウンター
  projects_count INTEGER NOT NULL DEFAULT 0,     -- 現在のプロジェクト数
  drawings_count INTEGER NOT NULL DEFAULT 0,     -- 現在の図面数
  storage_used_mb DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- 使用ストレージ容量（MB）

  -- 月次使用量（リセット対象）
  monthly_ai_chat_count INTEGER NOT NULL DEFAULT 0,     -- 月次AIチャット使用回数
  monthly_ocr_count INTEGER NOT NULL DEFAULT 0,         -- 月次OCR解析回数
  monthly_export_count INTEGER NOT NULL DEFAULT 0,      -- 月次エクスポート回数

  -- タイムスタンプ
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), -- 最終リセット日時
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- 制約: 1サブスクリプションに1つの使用量レコード
  CONSTRAINT unique_usage_per_subscription UNIQUE(subscription_id)
);

-- インデックス作成
CREATE INDEX idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_subscription_usage_updated_at
  BEFORE UPDATE ON subscription_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 4. RLSポリシー設定
-- ===================================================================

-- subscription_plans: 全ユーザーが読み取り可能、管理者のみ編集可能
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プランは全員が閲覧可能" ON subscription_plans
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "管理者のみプラン作成可能" ON subscription_plans
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "管理者のみプラン更新可能" ON subscription_plans
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- user_subscriptions: 自分のサブスクリプションのみ閲覧可能
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分のサブスクリプションのみ閲覧可能" ON user_subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "サブスクリプション作成は認証済みユーザーのみ" ON user_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "自分のサブスクリプションのみ更新可能" ON user_subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- subscription_usage: 自分の使用量のみ閲覧・更新可能
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の使用量のみ閲覧可能" ON subscription_usage
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "使用量作成は認証済みユーザーのみ" ON subscription_usage
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "自分の使用量のみ更新可能" ON subscription_usage
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ===================================================================
-- 5. 初期データ投入（デフォルトプラン）
-- ===================================================================

-- 無料プラン
INSERT INTO subscription_plans (
  name, description, stripe_price_id, monthly_price, currency,
  max_projects, max_drawings_per_project, max_storage_mb,
  ai_chat_enabled, advanced_drawing_enabled, export_dxf_enabled,
  export_pdf_enabled, ocr_analysis_enabled,
  is_active, display_order
) VALUES (
  '無料プラン',
  '基本的な図面作成機能が利用可能。プロジェクト数や機能に制限あり。',
  NULL,  -- Stripe Price IDなし（無料）
  0.00,
  'JPY',
  3,      -- 最大3プロジェクト
  5,      -- プロジェクトごと最大5図面
  100,    -- 最大100MBストレージ
  false,  -- AIチャット無効
  false,  -- 高度描画無効
  false,  -- DXFエクスポート無効
  true,   -- PDFエクスポート有効
  false,  -- OCR解析無効
  true,
  1
);

-- プロプラン
INSERT INTO subscription_plans (
  name, description, stripe_price_id, monthly_price, currency,
  max_projects, max_drawings_per_project, max_storage_mb,
  ai_chat_enabled, advanced_drawing_enabled, export_dxf_enabled,
  export_pdf_enabled, ocr_analysis_enabled,
  is_active, display_order
) VALUES (
  'プロプラン',
  'すべての機能が利用可能。AIチャット、OCR図面解析、DXFエクスポート対応。',
  'price_XXXXXXXXXXXX',  -- ※実際のStripe Price IDに置き換える
  9800.00,
  'JPY',
  NULL,   -- 無制限
  NULL,   -- 無制限
  10240,  -- 10GB
  true,   -- AIチャット有効
  true,   -- 高度描画有効
  true,   -- DXFエクスポート有効
  true,   -- PDFエクスポート有効
  true,   -- OCR解析有効
  true,
  2
);

-- エンタープライズプラン
INSERT INTO subscription_plans (
  name, description, stripe_price_id, monthly_price, currency,
  max_projects, max_drawings_per_project, max_storage_mb,
  ai_chat_enabled, advanced_drawing_enabled, export_dxf_enabled,
  export_pdf_enabled, ocr_analysis_enabled,
  is_active, display_order
) VALUES (
  'エンタープライズプラン',
  '大規模チーム向け。無制限のプロジェクト数とストレージ、優先サポート付き。',
  'price_YYYYYYYYYYYY',  -- ※実際のStripe Price IDに置き換える
  29800.00,
  'JPY',
  NULL,   -- 無制限
  NULL,   -- 無制限
  NULL,   -- 無制限
  true,   -- AIチャット有効
  true,   -- 高度描画有効
  true,   -- DXFエクスポート有効
  true,   -- PDFエクスポート有効
  true,   -- OCR解析有効
  true,
  3
);

-- ===================================================================
-- 6. ビュー作成（使いやすいクエリのため）
-- ===================================================================

-- ユーザーの現在のサブスクリプション情報（プラン詳細含む）
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT
  us.id AS subscription_id,
  us.user_id,
  us.status,
  us.current_period_start,
  us.current_period_end,
  us.cancel_at_period_end,
  sp.id AS plan_id,
  sp.name AS plan_name,
  sp.description AS plan_description,
  sp.monthly_price,
  sp.currency,
  sp.max_projects,
  sp.max_drawings_per_project,
  sp.max_storage_mb,
  sp.ai_chat_enabled,
  sp.advanced_drawing_enabled,
  sp.export_dxf_enabled,
  sp.export_pdf_enabled,
  sp.ocr_analysis_enabled,
  usage.projects_count,
  usage.drawings_count,
  usage.storage_used_mb,
  usage.monthly_ai_chat_count,
  usage.monthly_ocr_count,
  usage.monthly_export_count
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
LEFT JOIN subscription_usage usage ON us.id = usage.subscription_id
WHERE us.status = 'active';

-- RLSポリシー（ビュー）
ALTER VIEW user_subscription_details SET (security_invoker = true);

COMMENT ON TABLE subscription_plans IS 'サブスクリプションプラン定義テーブル';
COMMENT ON TABLE user_subscriptions IS 'ユーザーのサブスクリプション状態管理テーブル';
COMMENT ON TABLE subscription_usage IS 'サブスクリプション使用量トラッキングテーブル';
COMMENT ON VIEW user_subscription_details IS 'ユーザーの現在のサブスクリプション詳細情報（プラン+使用量統合ビュー）';
