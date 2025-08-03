
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
import { supabaseService } from '@/services/supabaseService';

interface TemplatePreviewProps {
  template: Template;
  fields: FormField[];
  onSaveTemplate?: () => void;
  isAdmin?: boolean;
  onTemplateUpdate?: (updatedTemplate: Template) => void;
}

const TemplatePreview = ({ template, fields, onSaveTemplate, isAdmin = false, onTemplateUpdate }: TemplatePreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [pdfMode, setPdfMode] = React.useState<'multi-page' | 'single-page'>('multi-page');
  const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 800, height: 600 });

  // Track container dimensions for percentage-based positioning
  useEffect(() => {
    const updateContainerDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    // Update dimensions on mount and window resize
    updateContainerDimensions();
    window.addEventListener('resize', updateContainerDimensions);
    
    // Also update when image loads
    if (imageLoaded) {
      updateContainerDimensions();
    }

    return () => {
      window.removeEventListener('resize', updateContainerDimensions);
    };
  }, [imageLoaded]);

  // Use the position editor hook with container dimensions
  const {
    getFieldPositions,
    getFieldPosition,
    handleMouseDown,
    handleResizeStart,
    resizing
  } = usePositionEditor({
    isEditing,
    template,
    onTemplateUpdate: onTemplateUpdate || (() => {}),
    containerWidth: containerDimensions.width,
    containerHeight: containerDimensions.height
  });

  const getFieldValue = (id: string) => {
    const field = fields.find(f => f.id === id);
    return field ? field.value : '';
  };

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
      const templateContent = containerRef.current as HTMLElement;
      if (!templateContent) {
        console.error('Template content not found in container ref');
        throw new Error('Template content not found');
      }
      
      console.log('Template content found:', templateContent);
      console.log('Image loaded state:', imageLoaded);

      const canvas = await html2canvas(templateContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: true, // Enable logging to see what's happening
        backgroundColor: '#ffffff',
      });
      
      console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);

      const imgData = canvas.toDataURL('image/png');
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
          pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
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
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          
          pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
          
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

        <div className="relative w-full" ref={containerRef}>
          <img
            ref={setImageRef}
            src={imageSource}
            alt="Template background"
            className="w-full h-auto object-contain rounded border border-gray-300"
            onLoad={() => setImageLoaded(true)}
            style={{ maxWidth: '100%' }}
          />
          
          {imageLoaded && (
            <TemplateRenderer
              template={template}
              fields={fields}
              fieldPositions={getFieldPositions()}
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
        <ScrollArea className="h-[400px] sm:h-[600px] rounded border">
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
        {/* Save Template Button for Admin */}
        {isAdmin && onSaveTemplate && (
          <Button
            onClick={onSaveTemplate}
            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
          >
            Save Template
          </Button>
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
