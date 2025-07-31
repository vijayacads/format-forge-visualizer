
import React, { useRef } from 'react';
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

interface TemplatePreviewProps {
  template: Template;
  fields: FormField[];
  onSaveTemplate?: () => void;
  isAdmin?: boolean;
  onPositionsChange?: (positions: {[key: string]: {x: number, y: number, width: number, height: number}}) => void;
}

const TemplatePreview = ({ template, fields, onSaveTemplate, isAdmin = false, onPositionsChange }: TemplatePreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [pdfMode, setPdfMode] = React.useState<'multi-page' | 'single-page'>('multi-page');
  const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  // Use the position editor hook
  const {
    fieldPositions,
    initializePositions,
    handleMouseDown,
    handleResizeStart
  } = usePositionEditor({
    isEditing,
    onPositionsChange
  });

  // Initialize positions when fields change
  React.useEffect(() => {
    initializePositions(fields, template);
  }, [fields, template]);

  const getFieldValue = (id: string) => {
    const field = fields.find(f => f.id === id);
    return field ? field.value : '';
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    try {
      toast({
        title: "Preparing Download",
        description: "Creating your PDF document...",
      });

      // Find the actual template content area (excluding UI elements)
      const templateContent = previewRef.current.querySelector('.relative') as HTMLElement;
      if (!templateContent) {
        throw new Error('Template content not found');
      }

      const canvas = await html2canvas(templateContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
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
          const xOffset = margin + (contentWidth - scaledWidth) / 2;
          
          pdf.addImage(imgData, 'PNG', xOffset, margin, scaledWidth, scaledHeight);
        }
      } else {
        // Multi-page mode with minimal margins
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 5; // Reduced margin to 5mm
        const contentWidth = pageWidth - (2 * margin);
        const contentHeight = pageHeight - (2 * margin);
        
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const totalPages = Math.ceil(imgHeight / contentHeight);
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }
          
          const sourceY = page * contentHeight * (canvas.width / imgWidth);
          const sourceHeight = Math.min(
            contentHeight * (canvas.width / imgWidth),
            canvas.height - sourceY
          );
          
          const destHeight = (sourceHeight * imgWidth) / canvas.width;
          
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          
          if (tempCtx) {
            tempCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, sourceHeight,
              0, 0, canvas.width, sourceHeight
            );
            
            const pageImgData = tempCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, destHeight);
          }
        }
      }
      
      pdf.save(`${template.name || 'template'}.pdf`);
      
      const pageCount = pdfMode === 'multi-page' ? 
        Math.ceil((canvas.height * (210 - 10) / canvas.width) / (297 - 10)) : 1;
      
      toast({
        title: "Download Complete",
        description: `Your template has been saved as a PDF with ${pageCount} page${pageCount > 1 ? 's' : ''}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error creating your PDF. Please try again.",
        variant: "destructive",
      });
      console.error("PDF generation error:", error);
    }
  };

  const renderCustomTemplate = () => {
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
        
        <div className="relative">
          {/* Background Image */}
          {template.imageUrl && (
            <img 
              ref={setImageRef}
              src={template.imageUrl} 
              alt="Template Background" 
              className="w-full h-auto object-contain rounded border border-gray-300" 
              onLoad={() => setImageLoaded(true)}
            />
          )}
          
          {/* Form Data Overlay with Positioned Fields */}
          <TemplateRenderer
            template={template}
            fields={fields}
            fieldPositions={fieldPositions}
            isEditing={isEditing}
            imageLoaded={imageLoaded}
            getFieldValue={getFieldValue}
            onMouseDown={handleMouseDown}
            onResizeStart={handleResizeStart}
          />
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
        <ScrollArea className="h-[600px] rounded border">
          <div ref={previewRef}>
            {renderTemplate()}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleDownload} 
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download as PDF
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">PDF Mode:</span>
              <select 
                value={pdfMode} 
                onChange={(e) => setPdfMode(e.target.value as 'multi-page' | 'single-page')}
                className="border rounded px-2 py-1 text-xs"
                title={pdfMode === 'multi-page' 
                  ? 'Splits long content across multiple pages for better readability' 
                  : 'Scales content to fit on one page (may be smaller)'
                }
              >
                <option value="multi-page">Multi-page (Recommended)</option>
                <option value="single-page">Single-page (Scaled)</option>
              </select>
            </div>
          </div>
          
          {isAdmin && onSaveTemplate && (
            <Button 
              onClick={onSaveTemplate}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save Template
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TemplatePreview;
