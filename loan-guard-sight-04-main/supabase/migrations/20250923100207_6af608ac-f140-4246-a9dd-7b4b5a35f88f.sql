-- Make loan-documents bucket public for easy preview links
UPDATE storage.buckets SET public = true WHERE id = 'loan-documents';

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Public can upload to loan-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can view loan-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can update loan-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete loan-documents" ON storage.objects;

-- Create new policies for public access during demo
CREATE POLICY "Public can upload to loan-documents"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'loan-documents');

CREATE POLICY "Public can view loan-documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'loan-documents');

CREATE POLICY "Public can update loan-documents"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'loan-documents');

CREATE POLICY "Public can delete loan-documents"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'loan-documents');