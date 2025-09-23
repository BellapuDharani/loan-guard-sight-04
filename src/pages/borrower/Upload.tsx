import React, { useState, useRef, useEffect } from 'react';
import { Upload as UploadIcon, Camera, File, MapPin, CheckCircle, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload, UploadedFile } from '@/hooks/useFileUpload';

export const Upload: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, deleteFile, uploading, uploadProgress } = useFileUpload();

  useEffect(() => {
    const existingFiles = JSON.parse(localStorage.getItem('uploadedFiles') || '[]');
    const userFiles = existingFiles.filter((file: any) => {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      return file.userId === userData.id;
    });
    setFiles(userFiles);
  }, []);

  const handleFiles = async (fileList: FileList) => {
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not supported. Please upload images or PDF files.`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} is too large. Please upload files smaller than 10MB.`,
          variant: 'destructive',
        });
        continue;
      }

      try {
        const uploadedFile = await uploadFile(file);
        if (uploadedFile) {
          setFiles(prev => [...prev, uploadedFile]);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeFile = async (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove) {
      const success = await deleteFile(id);
      if (success) {
        setFiles(files.filter(file => file.id !== id));
      }
    }
  };

  const viewFile = (file: UploadedFile) => {
    setSelectedFile(file);
    setViewDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Proof Documents</h1>
          <p className="text-muted-foreground mt-1">
            Upload invoices, receipts, and other proof documents for loan verification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>Drag and drop files or click to browse</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Supports JPG, PNG, PDF files up to 10MB
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                    className="hidden"
                  />
                </div>

                {uploading && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-foreground">Your Files ({files.length})</h4>
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            {file.type.startsWith('image/') ? (
                              <Camera className="w-5 h-5 text-primary" />
                            ) : (
                              <File className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.location && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              GPS
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => viewFile(file)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="card-hero">
              <CardHeader>
                <CardTitle className="text-lg">Upload Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Clear Images</h4>
                    <p className="text-sm text-muted-foreground">
                      Ensure photos are well-lit and all text is readable
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">GPS Location</h4>
                    <p className="text-sm text-muted-foreground">
                      Location is automatically captured when available
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{selectedFile?.name}</DialogTitle>
            </DialogHeader>
            {selectedFile && (
              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>Uploaded: {new Date(selectedFile.uploadedAt).toLocaleString()}</span>
                  {selectedFile.location && (
                    <span>GPS: {selectedFile.location.latitude.toFixed(4)}, {selectedFile.location.longitude.toFixed(4)}</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {selectedFile.type.startsWith('image/') ? (
                    <img 
                      src={selectedFile.url} 
                      alt={selectedFile.name}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Preview not available</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => window.open(selectedFile.url, '_blank')}
                        >
                          Download File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};