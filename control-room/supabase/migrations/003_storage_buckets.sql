-- Create storage buckets for SEFTEC Hub
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('system', 'system', false),
  ('logs', 'logs', false),
  ('exports', 'exports', true);

-- Set up bucket policies
CREATE POLICY "System files for admins only" ON storage.objects
  FOR ALL USING (
    bucket_id = 'system' AND 
    EXISTS (
      SELECT 1 FROM control_room.user_app_access
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Logs viewable by authenticated users" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'logs' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Exports are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'exports');
