
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import OCRService, { DetectedField } from '@/services/ocrService';
import { convertImageToBase64 } from '@/utils/imageUtils';

interface ImageUploadProps {
  onImageUploaded: (imageData: string) => void;
  onFieldsDetected?: (fields: DetectedField[], imageData: string, imageWidth?: number, imageHeight?: number) => void;
}

const ImageUpload = ({ onImageUploaded, onFieldsDetected }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processImageWithOCR = async (imageData: string) => {
    setIsProcessing(true);
    try {
      const ocrService = OCRService.getInstance();
      const result = await ocrService.processImage(imageData);
      
      setDetectedFields(result.fields);
      
      if (onFieldsDetected) {
        // Get image dimensions from the uploaded image
        const img = document.createElement('img');
        img.onload = () => {
          onFieldsDetected(result.fields, imageData, img.width, img.height);
        };
        img.src = imageData;
      }

      toast({
        title: "OCR Processing Complete",
        description: `Detected ${result.fields.length} form fields from the image.`,
        variant: "default",
      });
      
    } catch (error) {
      toast({
        title: "OCR Processing Failed",
        description: "Could not detect form fields from the image. You can still create a template manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (file: File) => {
    if (!file.type.match('image.*')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Convert image to base64 for persistent storage
      const imageData = await convertImageToBase64(file);
      setPreview(imageData);
      onImageUploaded(imageData);
      
      toast({
        title: "Image uploaded",
        description: "Processing image with OCR to detect form fields...",
        variant: "default",
      });

      // Process with OCR
      await processImageWithOCR(imageData);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    // Create a hidden file input and trigger it
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = (e) => {
      const inputEvent = e as unknown as React.ChangeEvent<HTMLInputElement>;
      if (inputEvent.target.files && inputEvent.target.files[0]) {
        processImage(inputEvent.target.files[0]);
      }
    };
    fileInput.click();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 sm:p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            isDragging
              ? "border-brand-500 bg-brand-50"
              : "border-gray-300 hover:border-brand-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Uploaded template"
                className="max-h-64 mx-auto rounded-md object-contain"
              />
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                  <div className="text-white text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Processing with OCR...</p>
                  </div>
                </div>
              )}
              
              {detectedFields.length > 0 && !isProcessing && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                  <h4 className="font-medium text-green-800 mb-2">
                    Detected {detectedFields.length} form fields:
                  </h4>
                  <div className="text-sm text-green-700">
                    {detectedFields.map((field, index) => (
                      <div key={field.id} className="mb-1">
                        • {field.label} ({field.type})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <label className="cursor-pointer mt-4 inline-block">
                <span className="text-brand-600 font-medium hover:text-brand-500">
                  Upload another
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <>
              <div className="mx-auto flex flex-col items-center justify-center">
                {isUploading ? (
                  <div className="animate-pulse">
                    <Image className="h-12 w-12 text-brand-400 mb-3" />
                    <p>Uploading image...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-lg font-semibold mb-1">
                      Drop your template image here
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      or click to browse your files
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-brand-300"
                      onClick={handleButtonClick}
                    >
                      Upload image
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Supports JPG, PNG, GIF up to 5MB. OCR will automatically detect form fields.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUpload;
