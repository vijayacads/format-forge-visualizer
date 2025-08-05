
import React, { useRef, useState, useEffect } from 'react';
import { FormField, Template } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { usePositionEditor } from '@/hooks/usePositionEditor';
import TemplateRenderer from './TemplateRenderer';
import { getImageSource } from '@/utils/imageUtils';
import { convertFieldPositionsToPixels, PercentagePosition } from '@/utils/positionUtils';
import { supabaseService } from '@/services/supabaseService';

interface TemplatePreviewProps {
  template: Template;
  fields: FormField[];
  onSaveTemplate?: () => void;
  onSaveAsTemplate?: () => void;
  isAdmin?: boolean;
  onTemplateUpdate?: (updatedTemplate: Template) => void;
}

const TemplatePreview = ({ template, fields, onSaveTemplate, onSaveAsTemplate, isAdmin = false, onTemplateUpdate }: TemplatePreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pdfMode, setPdfMode] = useState<'single-page' | 'multi-page'>('single-page');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template>(template);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-calculation when image size changes (viewport resize, mobile toggle, etc.)
  useEffect(() => {
    const handleResize = () => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    
    // Also listen for orientation changes and other viewport changes
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Sync currentTemplate with template prop changes
  useEffect(() => {
    setCurrentTemplate(template);
  }, [template]);

  const getFieldValue = (id: string) => {
    const field = fields.find(f => f.id === id);
    return field?.value || '';
  };

  // Convert percentage positions to pixels for display
  const getDisplayPositions = () => {
    // Force recalculation when viewport changes
    const _ = forceUpdate; // This makes the function depend on forceUpdate
    
    // Use currentTemplate for display to get the latest positions
    const positions = currentTemplate.fieldPositions || {};
    
    // Check if positions are percentages (from database) or pixels (legacy/OCR)
    if (Object.keys(positions).length > 0) {
      const firstPosition = Object.values(positions)[0];
      
      // Simple percentage detection: check if values are in percentage range
      const isPercentage = firstPosition.x >= 0 && firstPosition.x <= 100 && 
                          firstPosition.y >= -100 && firstPosition.y <= 100 && 
                          firstPosition.width > 0 && firstPosition.width <= 100 && 
                          firstPosition.height > 0 && firstPosition.height <= 100;
      
      if (isPercentage && template.imageWidth && template.imageHeight) {
        // Use actual displayed image size for position calculation
        const displayWidth = imageRef?.offsetWidth || template.imageWidth;
        const displayHeight = imageRef?.offsetHeight || template.imageHeight;
        
        // Debug: Check image dimensions
        console.log('Position calculation debug:', {
          storedWidth: template.imageWidth,
          storedHeight: template.imageHeight,
          displayWidth,
          displayHeight,
          actualImageWidth: imageRef?.naturalWidth,
          actualImageHeight: imageRef?.naturalHeight,
          firstPosition
        });
        
        // Convert percentages to pixels using DISPLAYED image dimensions
        const pixelPositions = convertFieldPositionsToPixels(
          positions,
          displayWidth,
          displayHeight
        );
        
        return pixelPositions;
      }
    }
    
    return positions;
  };

  // Use the position editor hook with currentTemplate
  const {
    getFieldPositions,
    handleMouseDown,
    handleResizeStart
  } = usePositionEditor({
    isEditing,
    template: currentTemplate, // Use currentTemplate for position editor
    onTemplateUpdate: (updatedTemplate: any) => {
      setCurrentTemplate(updatedTemplate as Template); // Update local state
      onTemplateUpdate?.(updatedTemplate as Template); // Call parent callback
    }
  });

  const handleDownload = async () => {
    if (!previewRef.current) {
      console.error('Preview ref not found');
      return;
    }
    
    // Validate email field before allowing download
    const emailField = fields.find(field => field.id === 'email');
    if (!emailField || !emailField.value.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address before downloading the PDF.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address before downloading the PDF.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Starting PDF generation...');
      console.log('Template:', template);
      console.log('Template imageWidth:', template.imageWidth);
      console.log('Template imageHeight:', template.imageHeight);
      console.log('Fields:', fields);
      console.log('Preview ref:', previewRef.current);
      
      // Only save to database if NOT in admin mode and template has a valid UUID
      if (!isAdmin && !template.id.startsWith('custom-')) {
        // Save form data to database before generating PDF
        const formData: { [key: string]: string } = {};
        const emailValue = emailField.value.trim();
        
        fields.forEach(field => {
          if (field.value.trim() && field.id !== 'email') {
            // Use field label as key instead of field ID for better readability
            // Exclude email from form_data since it's stored as separate column
            formData[field.label] = field.value;
          }
        });
        
        console.log('Saving form data to database...');
        await supabaseService.createFormSubmission(template.id, emailValue, formData);
        console.log('Form data saved successfully');
      } else {
        console.log('Skipping database save - admin mode or temporary template');
      }
      
      toast({
        title: "Preparing Download",
        description: "Creating your PDF document...",
      });

      // Find the actual template content area (excluding UI elements)
      const templateContent = previewRef.current.querySelector('.relative') as HTMLElement;
      if (!templateContent) {
        console.error('Template content not found in preview ref');
        throw new Error('Template content not found');
      }
      
      console.log('Template content found:', templateContent);
      console.log('Image loaded state:', imageLoaded);

      const canvas = await html2canvas(templateContent, {
        scale: 5, // Increased from 2 to 5 for higher quality (2.5x increase)
        useCORS: true,
        allowTaint: true,
        logging: false, // Disabled logging to reduce processing
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          // Ignore resize handles and editing UI elements
          return element.classList.contains('resize-handle') || 
                 element.classList.contains('resize-handles') ||
                 element.classList.contains('editing-ui');
        }
      });
      
      console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);

      // High quality image data for better PDF quality
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Increased quality from 0.8 to 0.95
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      console.log('PDF object created');
      
      if (pdfMode === 'single-page') {
        // Single page mode - scale to fit with minimal margins
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 5; // Reduced margin to 5mm
        const contentWidth = pageWidth - (2 * margin);
        const contentHeight = pageHeight - (2 * margin);
        
        // Calculate dimensions to fit within page
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight <= contentHeight) {
          // Content fits on one page
          pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        } else {
          // Scale down to fit
          const scale = contentHeight / imgHeight;
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;
          const xOffset = (pageWidth - scaledWidth) / 2;
          pdf.addImage(imgData, 'PNG', xOffset, margin, scaledWidth, scaledHeight);
        }
      } else {
        // Multi-page mode - split content across pages
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const contentWidth = pageWidth - (2 * margin);
        const contentHeight = pageHeight - (2 * margin);
        
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let remainingHeight = imgHeight;
        let currentY = 0;
        let pageNumber = 1;
        
        while (remainingHeight > 0) {
          const heightOnThisPage = Math.min(remainingHeight, contentHeight);
          const sourceY = currentY * (canvas.height / imgHeight);
          const sourceHeight = heightOnThisPage * (canvas.height / imgHeight);
          
          // Create a temporary canvas for this page
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, sourceHeight,
              0, 0, canvas.width, sourceHeight
            );
          }
          
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          
          pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, pageImgHeight);
          
          remainingHeight -= contentHeight;
          currentY += contentHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
            pageNumber++;
          }
        }
      }

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${template.name || 'document'}_${timestamp}.pdf`;
      
      console.log('Saving PDF as:', filename);
      pdf.save(filename);
      
      toast({
        title: "Download Complete",
        description: `Your document has been saved as ${filename}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Download error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      toast({
        title: "Download Failed",
        description: "There was an error creating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderCustomTemplate = () => {
    const imageSource = getImageSource(template.imageData, template.imageUrl);
    
    if (!imageSource) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No image available</p>
        </div>
      );
    }

    return (
      <div className="bg-white shadow p-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Template Preview</h3>
          {isAdmin && (
            <Button 
              variant={isEditing ? "destructive" : "outline"} 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Done Editing" : "Edit Positions"}
            </Button>
          )}
        </div>

        <div className="relative w-full" ref={previewRef}>
          <img
            ref={setImageRef}
            src={imageSource}
            alt="Template background"
            className="rounded border border-gray-300"
            onLoad={() => setImageLoaded(true)}
          />
          
          {imageLoaded && (
            <TemplateRenderer
              template={template}
              fields={fields}
              fieldPositions={getDisplayPositions()}
              isEditing={isEditing}
              imageLoaded={imageLoaded}
              getFieldValue={getFieldValue}
              onMouseDown={handleMouseDown}
              onResizeStart={handleResizeStart}
            />
          )}
        </div>
        
        {isEditing && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              💡 <strong>Edit Mode:</strong> 
              <br/>• <strong>Drag boxes</strong> to move them over form fields
              <br/>• <strong>Drag corners/edges</strong> to resize boxes
              <br/>• Click "Done Editing" when finished
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderTemplate = () => {
    // Use renderCustomTemplate for all templates to enable position editing
    return renderCustomTemplate();
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Preview</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-[50vh] sm:h-[60vh] md:h-[600px] rounded border">
          <div ref={previewRef}>
            {renderTemplate()}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Button 
            onClick={handleDownload} 
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Download as PDF and Save Data</span>
            <span className="sm:hidden">Download PDF</span>
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm">
            <span>PDF Mode:</span>
            <select 
              value={pdfMode} 
              onChange={(e) => setPdfMode(e.target.value as 'single-page' | 'multi-page')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="single-page">Single Page</option>
              <option value="multi-page">Multi Page</option>
            </select>
          </div>
        </div>
        {/* Save Template Buttons for Admin */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {onSaveTemplate && (
              <Button
                onClick={() => onSaveTemplate()}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
              >
                Save Template
              </Button>
            )}
            {onSaveAsTemplate && (
              <Button
                onClick={() => onSaveAsTemplate()}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                Save As Template
              </Button>
            )}
          </div>
        )}
        {(() => {
          const emailField = fields.find(field => field.id === 'email');
          const emailValue = emailField?.value?.trim() || '';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(emailValue);
          
          if (!emailValue) {
            return (
              <div className="text-red-500 text-sm">
                Please enter a valid email address to download PDF
              </div>
            );
          }
          
          if (!isValidEmail) {
            return (
              <div className="text-red-500 text-sm">
                Please enter a valid email format
              </div>
            );
          }
          
          return null;
        })()}
      </CardFooter>
    </Card>
  );
};

export default TemplatePreview;
