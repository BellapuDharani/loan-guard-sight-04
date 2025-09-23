import React, { useState, useRef } from 'react';
import { Upload as UploadIcon, Camera, MapPin, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

interface UploadFile {
  file: File;
  preview: string;
  id: string;
}

export const Upload: React.FC = () => {
  const [selectedLoan, setSelectedLoan] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newFile: UploadFile = {
            file,
            preview: e.target?.result as string,
            id: Math.random().toString(36).substr(2, 9)
          };
          setUploadedFiles(prev => [...prev, newFile]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast({
            title: 'Location captured',
            description: 'GPS coordinates have been recorded.',
          });
        },
        (error) => {
          toast({
            title: 'Location access denied',
            description: 'Please enable location services for accurate verification.',
            variant: 'destructive',
          });
        }
      );
    }
  };

  const handleUpload = async () => {
    if (!selectedLoan || uploadedFiles.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please select a loan and upload at least one file.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Upload successful',
        description: `${uploadedFiles.length} file(s) uploaded for verification.`,
      });
      
      // Reset form
      setUploadedFiles([]);
      setSelectedLoan('');
      setGpsLocation(null);
      
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Proof Documents</h1>
          <p className="text-muted-foreground mt-1">
            Upload invoices, receipts, and other proof documents for loan verification
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Selection */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Select Loan</CardTitle>
                <CardDescription>Choose which loan these documents are for</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedLoan} onValueChange={setSelectedLoan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LN-123">Loan LN-123 - $50,000</SelectItem>
                    <SelectItem value="LN-124">Loan LN-124 - $25,000</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                  Select images or PDF documents (max 10MB per file)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
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
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-foreground">Uploaded Files</h4>
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{file.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GPS Location */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Location Verification</CardTitle>
                <CardDescription>
                  Capture your current location to verify document authenticity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={getLocation}
                    disabled={!!gpsLocation}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {gpsLocation ? 'Location Captured' : 'Get Current Location'}
                  </Button>
                  {gpsLocation && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle className="w-4 h-4" />
                      GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedLoan || uploadedFiles.length === 0}
              className="w-full btn-upload"
              size="lg"
            >
              {isUploading ? 'Uploading...' : `Upload ${uploadedFiles.length} File(s)`}
            </Button>
          </div>

          {/* Guidelines Sidebar */}
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
                    <h4 className="font-medium text-foreground">Location Required</h4>
                    <p className="text-sm text-muted-foreground">
                      GPS location helps verify document authenticity
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground">Valid Documents</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload invoices, receipts, or purchase orders only
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning">Important</h4>
                    <p className="text-sm text-muted-foreground">
                      Uploaded documents will be analyzed using AI for verification. 
                      Ensure all information is accurate and complete.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};