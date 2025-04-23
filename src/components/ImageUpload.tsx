
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Image } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
}

const ImageUpload = ({ onImageUploaded }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processImage = (file: File) => {
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
    
    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onImageUploaded(result);
      setIsUploading(false);
      
      toast({
        title: "Image uploaded",
        description: "Your image has been processed successfully.",
        variant: "default",
      });
    };
    reader.readAsDataURL(file);
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
    fileInput.onchange = (e) => handleFileChange(e as React.ChangeEvent<HTMLInputElement>);
    fileInput.click();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
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
                    <p>Processing image...</p>
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
                Supports JPG, PNG, GIF up to 5MB
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ImageUpload;
