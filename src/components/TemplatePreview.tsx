
import React from 'react';
import { FormField, Template } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';

interface TemplatePreviewProps {
  template: Template;
  fields: FormField[];
}

const TemplatePreview = ({ template, fields }: TemplatePreviewProps) => {
  const getFieldValue = (id: string) => {
    const field = fields.find(f => f.id === id);
    return field ? field.value : '';
  };

  const handleDownload = () => {
    // Future enhancement: Generate PDF or other formats
    alert('Download feature will be available in the next version!');
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
                    {getFieldValue(id).split('\n').map((line, i) => (
                      <p key={i} className="mb-1">{line}</p>
                    ))}
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
            <p>{getFieldValue('strengths')}</p>
          </div>
          
          <div className="bg-red-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-red-700">Weaknesses</h2>
            <p>{getFieldValue('weaknesses')}</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-blue-700">Opportunities</h2>
            <p>{getFieldValue('opportunities')}</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2 text-yellow-700">Threats</h2>
            <p>{getFieldValue('threats')}</p>
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
          <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
            <div className="relative">
              <img 
                src={template.imageUrl} 
                alt="Template" 
                className="w-full h-auto max-h-64 object-contain opacity-25" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-gray-500 bg-white p-2 rounded shadow-sm">
                  Image Template Reference
                </p>
              </div>
            </div>
          </div>
        )}
        
        {template.layout.sections.map((section) => {
          if (section.id === 'header') return null;
          
          return (
            <div key={section.id} className="mb-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-brand-600">
                {section.title}
              </h3>
              <div className="bg-white p-3 rounded border border-gray-100">
                {section.fieldIds.map(id => (
                  <div key={id} className="mb-2">
                    {getFieldValue(id) ? (
                      getFieldValue(id).split('\n').map((line, i) => (
                        <p key={i} className="mb-1">{line}</p>
                      ))
                    ) : (
                      <p className="text-gray-400 italic">No content added yet</p>
                    )}
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
          {renderTemplate()}
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button 
          onClick={handleDownload} 
          className="bg-brand-500 hover:bg-brand-600 text-white"
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TemplatePreview;
