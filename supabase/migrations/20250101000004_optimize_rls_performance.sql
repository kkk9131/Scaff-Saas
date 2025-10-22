-- 外部キーにインデックスを追加してパフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_scaffold_designs_building_data_id
  ON public.scaffold_designs(building_data_id);

-- RLSポリシーのパフォーマンス最適化
-- auth.uid()を(select auth.uid())に変更して行ごとの再評価を防ぐ

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- Projects policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Building data policies
DROP POLICY IF EXISTS "Users can view own building data" ON public.building_data;
DROP POLICY IF EXISTS "Users can create building data for own projects" ON public.building_data;
DROP POLICY IF EXISTS "Users can update own building data" ON public.building_data;
DROP POLICY IF EXISTS "Users can delete own building data" ON public.building_data;

CREATE POLICY "Users can view own building data"
  ON public.building_data FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = building_data.project_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can create building data for own projects"
  ON public.building_data FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = building_data.project_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can update own building data"
  ON public.building_data FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = building_data.project_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can delete own building data"
  ON public.building_data FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = building_data.project_id
    AND projects.user_id = (select auth.uid())
  ));

-- Scaffold designs policies
DROP POLICY IF EXISTS "Users can view own scaffold designs" ON public.scaffold_designs;
DROP POLICY IF EXISTS "Users can create scaffold designs for own projects" ON public.scaffold_designs;
DROP POLICY IF EXISTS "Users can update own scaffold designs" ON public.scaffold_designs;
DROP POLICY IF EXISTS "Users can delete own scaffold designs" ON public.scaffold_designs;

CREATE POLICY "Users can view own scaffold designs"
  ON public.scaffold_designs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scaffold_designs.project_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can create scaffold designs for own projects"
  ON public.scaffold_designs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scaffold_designs.project_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can update own scaffold designs"
  ON public.scaffold_designs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scaffold_designs.project_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can delete own scaffold designs"
  ON public.scaffold_designs FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = scaffold_designs.project_id
    AND projects.user_id = (select auth.uid())
  ));

-- OCR logs policies
DROP POLICY IF EXISTS "Users can view own ocr logs" ON public.ocr_logs;
DROP POLICY IF EXISTS "Users can create ocr logs for own building data" ON public.ocr_logs;

CREATE POLICY "Users can view own ocr logs"
  ON public.ocr_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.building_data
    INNER JOIN public.projects ON projects.id = building_data.project_id
    WHERE building_data.id = ocr_logs.building_data_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can create ocr logs for own building data"
  ON public.ocr_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.building_data
    INNER JOIN public.projects ON projects.id = building_data.project_id
    WHERE building_data.id = ocr_logs.building_data_id
    AND projects.user_id = (select auth.uid())
  ));

-- AI corrections policies
DROP POLICY IF EXISTS "Users can view own ai corrections" ON public.ai_corrections;
DROP POLICY IF EXISTS "Users can create ai corrections for own building data" ON public.ai_corrections;

CREATE POLICY "Users can view own ai corrections"
  ON public.ai_corrections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.building_data
    INNER JOIN public.projects ON projects.id = building_data.project_id
    WHERE building_data.id = ai_corrections.building_data_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can create ai corrections for own building data"
  ON public.ai_corrections FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.building_data
    INNER JOIN public.projects ON projects.id = building_data.project_id
    WHERE building_data.id = ai_corrections.building_data_id
    AND projects.user_id = (select auth.uid())
  ));

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create chat messages for own projects" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;

CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = chat_messages.project_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can create chat messages for own projects"
  ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = chat_messages.project_id
    AND projects.user_id = (select auth.uid())
  ));

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = chat_messages.project_id
    AND projects.user_id = (select auth.uid())
  ));
