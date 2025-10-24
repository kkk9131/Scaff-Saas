-- プロジェクトテーブルの作成
-- 足場プロジェクトの基本情報を管理

-- 既存のテーブルがある場合は削除（開発環境用）
DROP TABLE IF EXISTS public.projects CASCADE;

-- 既存のEnum型がある場合は削除
DROP TYPE IF EXISTS project_status CASCADE;

-- プロジェクトステータスのEnum型を作成
CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'archived');

-- projectsテーブルの作成
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 200),
    description TEXT CHECK (description IS NULL OR char_length(description) <= 1000),
    status project_status NOT NULL DEFAULT 'draft',
    customer_name TEXT CHECK (customer_name IS NULL OR char_length(customer_name) <= 100),
    site_address TEXT CHECK (site_address IS NULL OR char_length(site_address) <= 300),
    start_date DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,

    -- 終了日が開始日より後であることを保証
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- インデックスの作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- updated_atを自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at自動更新トリガーの作成
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- Row Level Security (RLS) ポリシーの有効化
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のプロジェクトのみ表示可能
CREATE POLICY "Users can view their own projects"
    ON public.projects
    FOR SELECT
    USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のプロジェクトのみ作成可能
CREATE POLICY "Users can create their own projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のプロジェクトのみ更新可能
CREATE POLICY "Users can update their own projects"
    ON public.projects
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分のプロジェクトのみ削除可能
CREATE POLICY "Users can delete their own projects"
    ON public.projects
    FOR DELETE
    USING (auth.uid() = user_id);

-- コメント追加（ドキュメント化）
COMMENT ON TABLE public.projects IS '足場プロジェクトの基本情報を管理するテーブル';
COMMENT ON COLUMN public.projects.id IS 'プロジェクトの一意識別子（UUID）';
COMMENT ON COLUMN public.projects.user_id IS 'プロジェクト所有者のユーザーID';
COMMENT ON COLUMN public.projects.name IS 'プロジェクト名（必須、1〜200文字）';
COMMENT ON COLUMN public.projects.description IS 'プロジェクトの説明（最大1000文字）';
COMMENT ON COLUMN public.projects.status IS 'プロジェクトのステータス（draft/active/completed/archived）';
COMMENT ON COLUMN public.projects.customer_name IS '顧客名（最大100文字）';
COMMENT ON COLUMN public.projects.site_address IS '現場住所（最大300文字）';
COMMENT ON COLUMN public.projects.start_date IS 'プロジェクト開始日';
COMMENT ON COLUMN public.projects.end_date IS 'プロジェクト終了日（start_date以降である必要あり）';
COMMENT ON COLUMN public.projects.metadata IS '追加メタデータ（JSON形式）';
COMMENT ON COLUMN public.projects.created_at IS 'レコード作成日時（UTC）';
COMMENT ON COLUMN public.projects.updated_at IS 'レコード更新日時（UTC、自動更新）';
