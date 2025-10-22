-- ストレージポリシー設定（最もシンプルなバージョン）
-- Supabase Dashboard → SQL Editor で実行してください

-- blueprintsバケット用ポリシー
CREATE POLICY "Allow authenticated uploads to blueprints"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blueprints');

CREATE POLICY "Allow users to view own blueprints"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'blueprints' AND (name LIKE auth.uid()::text || '/%'));

CREATE POLICY "Allow users to update own blueprints"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'blueprints' AND (name LIKE auth.uid()::text || '/%'));

CREATE POLICY "Allow users to delete own blueprints"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blueprints' AND (name LIKE auth.uid()::text || '/%'));

-- exportsバケット用ポリシー
CREATE POLICY "Allow authenticated uploads to exports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exports');

CREATE POLICY "Allow users to view own exports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exports' AND (name LIKE auth.uid()::text || '/%'));

CREATE POLICY "Allow users to update own exports"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'exports' AND (name LIKE auth.uid()::text || '/%'));

CREATE POLICY "Allow users to delete own exports"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exports' AND (name LIKE auth.uid()::text || '/%'));
