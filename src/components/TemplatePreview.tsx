
import React, { useRef } from 'react';
import { FormField, Template } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

  const getFieldValue = (id: string) => {
    const field = fields.find(f => f.id === id);
    return field ? field.value : '';
  };

  const formatTextWithMarkdown = (text: string) => {
    if (!text) return <p className="text-gray-400 italic">No content added yet</p>;

    // Process the text line by line
    const lines = text.split('\n');
    
    return lines.map((line, i) => {
      let alignment = 'left';
      let content = line;
      
      // Check for alignment markers
      if (line.startsWith('← ')) {
        alignment = 'left';
        content = line.substring(2);
      } else if (line.startsWith('↔ ')) {
        alignment = 'center';
        content = line.substring(2);
      } else if (line.endsWith(' →')) {
        alignment = 'right';
        content = line.substring(0, line.length - 2);
      }
      
      // Check for bullet points (• followed by space)
      if (content.trim().match(/^•\s+/)) {
        // Extract the content after the bullet marker
        const bulletContent = content.trim().replace(/^•\s+/, '');
        
        return (
          <li 
            key={i} 
            className="ml-6 list-disc"
            style={{ textAlign: alignment as any }}
          >
            {bulletContent}
          </li>
        );
      }
      
      // Check for markdown bold (**text**)
      if (content.includes('**')) {
        const parts = content.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={i} className="mb-1" style={{ textAlign: alignment as any }}>
            {parts.map((part, j) => {
              if (part.match(/\*\*.*?\*\*/)) {
                return <strong key={j}>{part.replace(/\*\*/g, '')}</strong>;
              }
              return part;
            })}
          </p>
        );
      }
      
      // Check for markdown italic (*text*)
      if (content.includes('*')) {
        const parts = content.split(/(\*.*?\*)/g);
        return (
          <p key={i} className="mb-1" style={{ textAlign: alignment as any }}>
            {parts.map((part, j) => {
              if (part.match(/\*.*?\*/)) {
                return <em key={j}>{part.replace(/\*/g, '')}</em>;
              }
              return part;
            })}
          </p>
        );
      }
      
      // Regular paragraph
      return content ? (
        <p key={i} className="mb-1" style={{ textAlign: alignment as any }}>
          {content}
        </p>
      ) : <br key={i} />;
    });
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
  
  const renderCVTemplate = () => {
    return (
      <div className="bg-white shadow p-6">
        <div className="mb-6 border-b pb-6">
          <h1 className="text-3xl font-bold mb-1">{getFieldValue('name')}</h1>
          <h2 className="text-xl text-gray-600">{getFieldValue('title')}</h2>
          <div className="mt-2 text-sm">
            <p>{getFieldValue('email')} | {getFieldValue('phone')}</p>
          </div>
        </div>
        
        {template.layout.sections.map((section) => {
          if (section.id === 'header') return null; // Already rendered above
          
          const hasContent = section.fieldIds.some(id => getFieldValue(id).trim() !== '');
          if (!hasContent) return null;
          
          return (
            <div key={section.id} className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-brand-600">
                {section.title}
              </h3>
              <div>
                {section.fieldIds.map(id => (
                  <div key={id}>
                    {formatTextWithMarkdown(getFieldValue(id))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderSWOTTemplate = () => {
    return (
      <div className="bg-white shadow p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          SWOT Analysis
        </h1>
        
        {/* Contact Information Section - Right below the title */}
        <div className="mb-6 text-center">
          <div className="inline-flex gap-8">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Name</h3>
              <p className="text-base font-semibold">{getFieldValue('name') || 'Not provided'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Email ID</h3>
              <p className="text-base font-semibold">{getFieldValue('email') || 'Not provided'}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-green-700">Strengths</h2>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: getFieldValue('strengths') || '<p class="text-gray-400 italic">No content added yet</p>' 
              }} 
            />
          </div>
          
          <div className="bg-red-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Weaknesses</h2>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: getFieldValue('weaknesses') || '<p class="text-gray-400 italic">No content added yet</p>' 
              }} 
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-blue-700">Opportunities</h2>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: getFieldValue('opportunities') || '<p class="text-gray-400 italic">No content added yet</p>' 
              }} 
            />
          </div>
          
          <div className="bg-yellow-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-yellow-700">Threats</h2>
            <div 
              dangerouslySetInnerHTML={{ 
                __html: getFieldValue('threats') || '<p class="text-gray-400 italic">No content added yet</p>' 
              }} 
            />
          </div>
        </div>
      </div>
    );
  };

  const renderCustomTemplate = () => {
    // Enhanced template for custom uploads with positioned form data overlay
    const [imageRef, setImageRef] = React.useState<HTMLImageElement | null>(null);
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [fieldPositions, setFieldPositions] = React.useState<{[key: string]: {x: number, y: number, width: number, height: number}}>({});
    const [resizing, setResizing] = React.useState<{fieldId: string, handle: string} | null>(null);

    // Initialize field positions from detected fields
    React.useEffect(() => {
      if (fields.length > 0 && !Object.keys(fieldPositions).length) {
        const initialPositions: {[key: string]: {x: number, y: number, width: number, height: number}} = {};
        fields.forEach(field => {
          // Use saved positions from template if available, otherwise use field.position or default
          const savedPosition = template.fieldPositions?.[field.id];
          const position = savedPosition || field.position || { x: 100, y: 100, width: 250, height: 40 };
          initialPositions[field.id] = position;
        });
        setFieldPositions(initialPositions);
      }
    }, [fields, template.fieldPositions]);

    // Handle field position updates
    const updateFieldPosition = (fieldId: string, newPosition: {x: number, y: number, width: number, height: number}) => {
      const updatedPositions = {
        ...fieldPositions,
        [fieldId]: newPosition
      };
      setFieldPositions(updatedPositions);
      
      // Notify parent component of position changes
      if (onPositionsChange) {
        onPositionsChange(updatedPositions);
      }
    };

    // Handle mouse drag for positioning
    const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
      if (!isEditing || resizing) return;
      
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = fieldPositions[fieldId] || { x: 0, y: 0, width: 250, height: 40 };
      
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        updateFieldPosition(fieldId, {
          ...startPos,
          x: startPos.x + deltaX,
          y: startPos.y + deltaY
        });
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    // Handle resize functionality
    const handleResizeStart = (e: React.MouseEvent, fieldId: string, handle: string) => {
      if (!isEditing) return;
      
      e.preventDefault();
      e.stopPropagation();
      setResizing({ fieldId, handle });
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startPos = fieldPositions[fieldId] || { x: 0, y: 0, width: 250, height: 40 };
      
      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newPosition = { ...startPos };
        
        // Handle different resize directions
        switch (handle) {
          case 'nw': // top-left
            newPosition.x = startPos.x + deltaX;
            newPosition.y = startPos.y + deltaY;
            newPosition.width = startPos.width - deltaX;
            newPosition.height = startPos.height - deltaY;
            break;
          case 'ne': // top-right
            newPosition.y = startPos.y + deltaY;
            newPosition.width = startPos.width + deltaX;
            newPosition.height = startPos.height - deltaY;
            break;
          case 'sw': // bottom-left
            newPosition.x = startPos.x + deltaX;
            newPosition.width = startPos.width - deltaX;
            newPosition.height = startPos.height + deltaY;
            break;
          case 'se': // bottom-right
            newPosition.width = startPos.width + deltaX;
            newPosition.height = startPos.height + deltaY;
            break;
          case 'n': // top edge
            newPosition.y = startPos.y + deltaY;
            newPosition.height = startPos.height - deltaY;
            break;
          case 's': // bottom edge
            newPosition.height = startPos.height + deltaY;
            break;
          case 'e': // right edge
            newPosition.width = startPos.width + deltaX;
            break;
          case 'w': // left edge
            newPosition.x = startPos.x + deltaX;
            newPosition.width = startPos.width - deltaX;
            break;
        }
        
        // Ensure minimum size
        newPosition.width = Math.max(newPosition.width, 100);
        newPosition.height = Math.max(newPosition.height, 30);
        
        updateFieldPosition(fieldId, newPosition);
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        setResizing(null);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    // Render resize handles
    const renderResizeHandles = (fieldId: string, position: {x: number, y: number, width: number, height: number}) => {
      if (!isEditing) return null;
      
      const handleSize = 8;
      const handleStyle = "absolute w-2 h-2 bg-white rounded cursor-pointer shadow-sm";
      
      return (
        <>
          {/* Corner handles */}
          <div 
            className={`${handleStyle} -top-1 -left-1 cursor-nw-resize`}
            onMouseDown={(e) => handleResizeStart(e, fieldId, 'nw')}
          />
          <div 
            className={`${handleStyle} -top-1 -right-1 cursor-ne-resize`}
            onMouseDown={(e) => handleResizeStart(e, fieldId, 'ne')}
          />
          <div 
            className={`${handleStyle} -bottom-1 -left-1 cursor-sw-resize`}
            onMouseDown={(e) => handleResizeStart(e, fieldId, 'sw')}
          />
          <div 
            className={`${handleStyle} -bottom-1 -right-1 cursor-se-resize`}
            onMouseDown={(e) => handleResizeStart(e, fieldId, 'se')}
          />
          
          {/* Edge handles */}
          <div 
            className={`${handleStyle} top-1/2 -left-1 -translate-y-1/2 cursor-w-resize`}
            onMouseDown={(e) => handleResizeStart(e, fieldId, 'w')}
          />
          <div 
            className={`${handleStyle} top-1/2 -right-1 -translate-y-1/2 cursor-e-resize`}
            onMouseDown={(e) => handleResizeStart(e, fieldId, 'e')}
          />
          <div 
            className={`${handleStyle} -top-1 left-1/2 -translate-x-1/2 cursor-n-resize`}
            onMouseDown={(e) => handleResizeStart(e, fieldId, 'n')}
          />
          <div 
            className={`${handleStyle} -bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize`}
            onMouseDown={(e) => handleResizeStart(e, fieldId, 's')}
          />
        </>
      );
    };

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
          {imageLoaded && (
            <div className="absolute inset-0">
              {template.layout.sections.map((section) => {
                if (section.id === 'header') {
                  // Handle header fields (name, email, etc.) with positioning
                  return (
                    <div key={section.id}>
                      {section.fieldIds.map(id => {
                        const field = fields.find(f => f.id === id);
                        const value = getFieldValue(id);
                        if (!field || !value.trim()) return null;
                        
                        const position = fieldPositions[field.id] || { x: 100, y: 100, width: 250, height: 40 };
                        
                        return (
                          <div 
                            key={id} 
                            className={`absolute px-2 py-1 rounded ${
                              isEditing 
                                ? 'bg-yellow-200 bg-opacity-90 cursor-move' 
                                : ''
                            }`}
                            style={{
                              left: `${position.x}px`,
                              top: `${position.y}px`,
                              width: `${position.width}px`,
                              minHeight: `${position.height}px`,
                              zIndex: 10
                            }}
                            onMouseDown={(e) => handleMouseDown(e, field.id)}
                          >
                            {field.type === 'richtext' ? (
                              <div 
                                className="text-sm text-gray-900 ql-editor"
                                dangerouslySetInnerHTML={{
                                  __html: value || '<span class="text-gray-400 italic">No content added yet</span>'
                                }}
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{value}</span>
                            )}
                            {renderResizeHandles(field.id, position)}
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                
                // Handle other sections with positioning
                const hasContent = section.fieldIds.some(id => getFieldValue(id).trim() !== '');
                if (!hasContent) return null;
                
                return (
                  <div key={section.id}>
                    {section.fieldIds.map(id => {
                      const field = fields.find(f => f.id === id);
                      const value = getFieldValue(id);
                      if (!field || !value.trim()) return null;
                      
                      const position = fieldPositions[field.id] || { x: 100, y: 200, width: 400, height: 80 };
                      
                      return (
                        <div 
                          key={id} 
                          className={`absolute px-3 py-2 rounded ${
                            isEditing 
                              ? 'bg-blue-200 bg-opacity-90 cursor-move' 
                              : ''
                          }`}
                          style={{
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            width: `${position.width}px`,
                            minHeight: `${position.height}px`,
                            zIndex: 10
                          }}
                          onMouseDown={(e) => handleMouseDown(e, field.id)}
                        >
                          {field.type === 'richtext' ? (
                            <div 
                              className="text-gray-900 text-sm ql-editor"
                              dangerouslySetInnerHTML={{
                                __html: value || '<span class="text-gray-400 italic">No content added yet</span>'
                              }}
                            />
                          ) : (
                            <div className="text-gray-900 text-sm whitespace-pre-wrap">
                              {formatTextWithMarkdown(value)}
                            </div>
                          )}
                          {renderResizeHandles(field.id, position)}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
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
