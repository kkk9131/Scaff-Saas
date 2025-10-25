-- プロジェクトテーブルの作成
-- 足場プロジェクトの基本情報を管理

-- プロジェクトステータスのEnum型を作成（既存環境でも安全に実行）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'project_status'
    ) THEN
        EXECUTE $$CREATE TYPE project_status AS ENUM ('draft', 'active', 'completed', 'archived')$$;
    END IF;
END;
$$;

-- 既存のEnum型に不足している値があれば追加（順序は draft → active → completed → archived）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'project_status' AND e.enumlabel = 'draft'
        ) THEN
            EXECUTE 'ALTER TYPE project_status ADD VALUE ''draft''';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'project_status' AND e.enumlabel = 'active'
        ) THEN
            EXECUTE 'ALTER TYPE project_status ADD VALUE ''active'' AFTER ''draft''';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'project_status' AND e.enumlabel = 'completed'
        ) THEN
            EXECUTE 'ALTER TYPE project_status ADD VALUE ''completed'' AFTER ''active''';
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'project_status' AND e.enumlabel = 'archived'
        ) THEN
            EXECUTE 'ALTER TYPE project_status ADD VALUE ''archived'' AFTER ''completed''';
        END IF;
    END IF;
END;
$$;

-- projects テーブルが存在しない環境では新規作成
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'projects'
    ) THEN
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
            CONSTRAINT projects_valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
        );
    END IF;
END;
$$;

-- 既存環境で不足しているカラムを補完（NOT NULL 制約は後段で安全に適用）
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status project_status;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS site_address TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- metadata の既定値を統一（NULL 行は空 JSON へ補完）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'metadata'
    ) THEN
        EXECUTE 'UPDATE public.projects SET metadata = ''{}''::jsonb WHERE metadata IS NULL';
        EXECUTE 'ALTER TABLE public.projects ALTER COLUMN metadata SET DEFAULT ''{}''::jsonb';
    END IF;
END;
$$;

-- created_at / updated_at の既定値を UTC 現在時刻へ統一し、NULL を補完
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'created_at'
    ) THEN
        EXECUTE 'UPDATE public.projects SET created_at = TIMEZONE(''utc'', NOW()) WHERE created_at IS NULL';
        EXECUTE 'ALTER TABLE public.projects ALTER COLUMN created_at SET DEFAULT TIMEZONE(''utc'', NOW())';
    END IF;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'updated_at'
    ) THEN
        EXECUTE 'UPDATE public.projects SET updated_at = TIMEZONE(''utc'', NOW()) WHERE updated_at IS NULL';
        EXECUTE 'ALTER TABLE public.projects ALTER COLUMN updated_at SET DEFAULT TIMEZONE(''utc'', NOW())';
    END IF;
END;
$$;

-- user_id を NOT NULL 化（NULL が残っている場合は通知のみ）
DO $$
DECLARE
    user_id_nulls INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'user_id'
    ) THEN
        SELECT COUNT(*) INTO user_id_nulls FROM public.projects WHERE user_id IS NULL;
        IF user_id_nulls = 0 THEN
            EXECUTE 'ALTER TABLE public.projects ALTER COLUMN user_id SET NOT NULL';
        ELSE
            RAISE NOTICE 'public.projects.user_id に % 件の NULL が存在するため NOT NULL 制約を追加できませんでした。', user_id_nulls;
        END IF;
    END IF;
END;
$$;

-- user_id の外部キー制約を追加（既に存在する場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'projects'
          AND constraint_name = 'projects_user_id_fkey'
    ) THEN
        EXECUTE 'ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
    END IF;
END;
$$;

-- ステータス列を Enum 型へ整形し既定値/NOT NULL を再設定
DO $$
DECLARE
    invalid_status_count INTEGER;
    status_nulls INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'status'
    ) THEN
        SELECT COUNT(*)
        INTO invalid_status_count
        FROM public.projects
        WHERE status IS NOT NULL
          AND status::text NOT IN ('draft', 'active', 'completed', 'archived');

        IF invalid_status_count > 0 THEN
            RAISE EXCEPTION 'projects.status に定義外の値が % 件存在するため、マイグレーションを中断します。', invalid_status_count;
        END IF;

        EXECUTE 'UPDATE public.projects SET status = ''draft'' WHERE status IS NULL';
        EXECUTE 'ALTER TABLE public.projects ALTER COLUMN status TYPE project_status USING status::text::project_status';
        EXECUTE 'ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT ''draft''';

        SELECT COUNT(*) INTO status_nulls FROM public.projects WHERE status IS NULL;
        IF status_nulls = 0 THEN
            EXECUTE 'ALTER TABLE public.projects ALTER COLUMN status SET NOT NULL';
        ELSE
            RAISE NOTICE 'projects.status に NULL が % 件残っているため NOT NULL 制約を追加できませんでした。', status_nulls;
        END IF;
    END IF;
END;
$$;

-- name 列を NOT NULL 化し文字数チェックを追加
DO $$
DECLARE
    name_nulls INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'name'
    ) THEN
        SELECT COUNT(*) INTO name_nulls FROM public.projects WHERE name IS NULL;
        IF name_nulls = 0 THEN
            EXECUTE 'ALTER TABLE public.projects ALTER COLUMN name SET NOT NULL';
        ELSE
            RAISE NOTICE 'projects.name に NULL が % 件存在するため NOT NULL 制約を追加できませんでした。', name_nulls;
        END IF;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'projects'
          AND constraint_name = 'projects_name_length_check'
    ) THEN
        EXECUTE 'ALTER TABLE public.projects ADD CONSTRAINT projects_name_length_check CHECK (char_length(name) BETWEEN 1 AND 200)';
    END IF;
END;
$$;

-- 日付整合性チェックを追加（既存チェック名と重複しないように管理）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
          AND table_name = 'projects'
          AND constraint_name = 'projects_valid_date_range'
    ) THEN
        EXECUTE 'ALTER TABLE public.projects ADD CONSTRAINT projects_valid_date_range CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)';
    END IF;
END;
$$;

-- インデックスの作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- updated_at を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 既存トリガーを置き換えて updated_at 自動更新を保証
DROP TRIGGER IF EXISTS trigger_projects_updated_at ON public.projects;
CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION update_projects_updated_at();

-- Row Level Security (RLS) の有効化とポリシー定義（既存は置き換え）
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'projects'
          AND policyname = 'Users can view their own projects'
    ) THEN
        EXECUTE 'DROP POLICY "Users can view their own projects" ON public.projects';
    END IF;
END;
$$;

CREATE POLICY "Users can view their own projects"
    ON public.projects
    FOR SELECT
    USING (auth.uid() = user_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'projects'
          AND policyname = 'Users can create their own projects'
    ) THEN
        EXECUTE 'DROP POLICY "Users can create their own projects" ON public.projects';
    END IF;
END;
$$;

CREATE POLICY "Users can create their own projects"
    ON public.projects
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'projects'
          AND policyname = 'Users can update their own projects'
    ) THEN
        EXECUTE 'DROP POLICY "Users can update their own projects" ON public.projects';
    END IF;
END;
$$;

CREATE POLICY "Users can update their own projects"
    ON public.projects
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'projects'
          AND policyname = 'Users can delete their own projects'
    ) THEN
        EXECUTE 'DROP POLICY "Users can delete their own projects" ON public.projects';
    END IF;
END;
$$;

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
