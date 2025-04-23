
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
}

const TemplatePreview = ({ template, fields }: TemplatePreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const getFieldValue = (id: string) => {
    const field = fields.find(f => f.id === id);
    return field ? field.value : '';
  };

  const formatTextWithMarkdown = (text: string) => {
    if (!text) return <p className="text-gray-400 italic">No content added yet</p>;

    // Process the text line by line
    const lines = text.split('\n');
    
    return lines.map((line, i) => {
      // Check for bullet points (* or - followed by space)
      if (line.trim().match(/^(\*|\-|\d+\.)\s+/)) {
        // Extract the content after the bullet marker
        const content = line.trim().replace(/^(\*|\-|\d+\.)\s+/, '');
        
        // Determine if it's a numbered or bulleted list
        const isNumbered = line.trim().match(/^\d+\.\s+/);
        
        return (
          <li 
            key={i} 
            className={`ml-6 ${isNumbered ? 'list-decimal' : 'list-disc'}`}
          >
            {content}
          </li>
        );
      }
      
      // Regular paragraph
      return line ? <p key={i} className="mb-1">{line}</p> : <br key={i} />;
    });
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    
    try {
      toast({
        title: "Preparing Download",
        description: "Creating your PDF document...",
      });

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Calculate the dimensions to fit the content on the PDF page
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${template.name || 'template'}.pdf`);
      
      toast({
        title: "Download Complete",
        description: "Your template has been saved as a PDF.",
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
        <h1 className="text-2xl font-bold mb-6 text-center">
          {getFieldValue('title') || 'SWOT Analysis'}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-green-700">Strengths</h2>
            <div>{formatTextWithMarkdown(getFieldValue('strengths'))}</div>
          </div>
          
          <div className="bg-red-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Weaknesses</h2>
            <div>{formatTextWithMarkdown(getFieldValue('weaknesses'))}</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-blue-700">Opportunities</h2>
            <div>{formatTextWithMarkdown(getFieldValue('opportunities'))}</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-yellow-700">Threats</h2>
            <div>{formatTextWithMarkdown(getFieldValue('threats'))}</div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomTemplate = () => {
    // Enhanced template for custom uploads
    return (
      <div className="bg-white shadow p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-3">
            {getFieldValue('title') || 'Your Document'}
          </h1>
        </div>

        {template.imageUrl && (
          <div className="mb-6">
            <img 
              src={template.imageUrl} 
              alt="Template Background" 
              className="w-full h-auto object-contain mb-4 rounded border border-gray-200" 
            />
          </div>
        )}
        
        {template.layout.sections.map((section) => {
          if (section.id === 'header') return null;
          
          return (
            <div key={section.id} className="mb-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-brand-600">
                {section.title || 'Section'}
              </h3>
              <div className="bg-white rounded">
                {section.fieldIds.map(id => (
                  <div key={id} className="mb-4">
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

  const renderTemplate = () => {
    switch (template.type) {
      case 'cv':
        return renderCVTemplate();
      case 'resume':
        return renderCVTemplate(); // Uses same layout as CV
      case 'swot':
        return renderSWOTTemplate();
      default:
        return renderCustomTemplate();
    }
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
        <Button 
          onClick={handleDownload} 
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Download as PDF
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplatePreview;
