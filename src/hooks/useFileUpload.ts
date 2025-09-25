import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadFile = async (file: File, loanId?: string): Promise<UploadedFile | null> => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Get current position if available
      let location: { latitude: number; longitude: number } | undefined;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true
            });
          });
          
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (error) {
          console.log('Location access denied or unavailable');
        }
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('loan-documents')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('loan-documents')
        .getPublicUrl(filePath);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Get current user data
      const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');

      const uploadedFile: UploadedFile = {
        id: uploadData.path,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date(),
        location
      };

      // Store file metadata with user info for cross-session persistence
      const fileWithUserInfo = {
        ...uploadedFile,
        loanId: loanId || 'default',
        userId: currentUser.id || 'unknown',
        userName: currentUser.name || 'Unknown User',
        userMobile: currentUser.mobile || ''
      };

      // Store in a more persistent way for officer dashboard
      const allUploadedFiles = JSON.parse(localStorage.getItem('allUploadedFiles') || '[]');
      allUploadedFiles.push(fileWithUserInfo);
      localStorage.setItem('allUploadedFiles', JSON.stringify(allUploadedFiles));

      // Also keep the existing storage for user-specific view
      const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      existingFiles.push(fileWithUserInfo);
      localStorage.setItem('uploadedFiles', JSON.stringify(existingFiles));

      toast({
        title: 'Upload Successful',
        description: `${file.name} has been uploaded successfully.`,
      });

      return uploadedFile;

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from('loan-documents')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      // Remove from both storage locations
      const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
      const updatedFiles = existingFiles.filter((file: any) => file.id !== filePath);
      localStorage.setItem('uploadedFiles', JSON.stringify(updatedFiles));

      const allFiles = JSON.parse(localStorage.getItem('allUploadedFiles') || '[]');
      const updatedAllFiles = allFiles.filter((file: any) => file.id !== filePath);
      localStorage.setItem('allUploadedFiles', JSON.stringify(updatedAllFiles));

      toast({
        title: 'File Deleted',
        description: 'File has been deleted successfully.',
      });

      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    uploadProgress
  };
};