import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  open,
  onClose,
  onCapture
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      setIsCapturing(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Unable to access camera. Please check permissions.',
        variant: 'destructive',
      });
    } finally {
      setIsCapturing(false);
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Get image data
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();
  }, [stopCamera]);

  const savePhoto = useCallback(() => {
    if (!capturedImage || !canvasRef.current) return;

    // Convert canvas to blob
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
        const file = new File([blob], `camera_capture_${timestamp}.jpg`, {
          type: 'image/jpeg',
        });
        onCapture(file);
        onClose();
        setCapturedImage(null);
      }
    }, 'image/jpeg', 0.9);
  }, [capturedImage, onCapture, onClose]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  React.useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera, capturedImage]);

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Camera Capture
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {capturedImage ? (
            // Preview captured image
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </Button>
                <Button
                  onClick={savePhoto}
                  className="flex items-center gap-2 btn-primary"
                >
                  <Download className="w-4 h-4" />
                  Save Photo
                </Button>
              </div>
            </div>
          ) : (
            // Camera view
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Starting camera...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  disabled={!stream || isCapturing}
                  className="flex items-center gap-2 btn-primary"
                >
                  <Camera className="w-4 h-4" />
                  Capture Photo
                </Button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};