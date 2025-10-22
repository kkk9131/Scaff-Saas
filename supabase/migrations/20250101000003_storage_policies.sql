-- ストレージバケットのRLSポリシー設定
-- 注意: これらのポリシーはSupabase Dashboardから手動で設定する必要があります
-- または、service_role keyを使用したスクリプトで実行してください

-- Blueprints bucket policies (認証済みユーザーのみアクセス可能)
CREATE POLICY "Authenticated users can upload blueprints"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'blueprints'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view own blueprints"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'blueprints'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own blueprints"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'blueprints'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own blueprints"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'blueprints'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Exports bucket policies (認証済みユーザーのみアクセス可能)
CREATE POLICY "Authenticated users can upload exports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exports'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own exports"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own exports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
