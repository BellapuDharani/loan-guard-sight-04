-- Create RLS policies for the loan-documents storage bucket

-- Allow anyone to upload files to the loan-documents bucket
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'loan-documents');

-- Allow anyone to view files in the loan-documents bucket  
CREATE POLICY "Allow authenticated users to view files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id = 'loan-documents');

-- Allow users to delete their own files
CREATE POLICY "Allow users to delete their own files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'loan-documents');

-- Allow users to update their own files
CREATE POLICY "Allow users to update their own files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'loan-documents');