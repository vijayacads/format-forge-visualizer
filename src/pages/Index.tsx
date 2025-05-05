
import React, { useState } from 'react';
import { Template, FormField } from '@/types';
import ImageUpload from '@/components/ImageUpload';
import TemplateSelector from '@/components/TemplateSelector';
import FormBuilder from '@/components/FormBuilder';
import TemplatePreview from '@/components/TemplatePreview';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Index = () => {
  const [step, setStep] = useState<number>(1);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [customPositions, setCustomPositions] = useState<boolean>(false);
  const [textBoxPlacement, setTextBoxPlacement] = useState<{x: number, y: number, width: number, height: number}[]>([]);
  const [saveTemplateDialog, setSaveTemplateDialog] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>("");
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const { toast } = useToast();

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    toast({
      title: "Image Uploaded",
      description: "You can now create a template from this image.",
    });
    
    // Automatically switch to the custom template tab in the TemplateSelector
    const tabsContainer = document.querySelector('[role="tablist"]');
    if (tabsContainer) {
      const customTabTrigger = tabsContainer.querySelector('[value="custom"]');
      if (customTabTrigger instanceof HTMLElement) {
        customTabTrigger.click();
      }
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormFields(template.fields);
    setStep(2);
  };

  const handleCreateTemplate = (imageUrl: string) => {
    // If custom positions are enabled, allow the user to place text boxes
    if (customPositions) {
      toast({
        title: "Place your text boxes",
        description: "Click and drag on the image to create text boxes for your template.",
      });
      return;
    }

    // Create a custom template from the uploaded image with better section headers
    const customTemplate: Template = {
      id: 'custom-' + Date.now(),
      name: 'Custom Template',
      type: 'custom',
      imageUrl: imageUrl,
      fields: [
        { id: 'title', label: 'Document Title', type: 'text', value: '', required: true },
        { id: 'section1', label: 'Executive Summary', type: 'textarea', value: '' },
        { id: 'section2', label: 'Key Findings', type: 'textarea', value: '' },
        { id: 'section3', label: 'Recommendations', type: 'textarea', value: '' },
        { id: 'section4', label: 'Next Steps', type: 'textarea', value: '' },
      ],
      layout: {
        sections: [
          { id: 'header', fieldIds: ['title'] },
          { id: 'section1', title: 'Executive Summary', fieldIds: ['section1'] },
          { id: 'section2', title: 'Key Findings', fieldIds: ['section2'] },
          { id: 'section3', title: 'Recommendations', fieldIds: ['section3'] },
          { id: 'section4', title: 'Next Steps', fieldIds: ['section4'] },
        ]
      }
    };
    
    setSelectedTemplate(customTemplate);
    setFormFields(customTemplate.fields);
    setStep(2);
    
    toast({
      title: "Custom Template Created",
      description: "Your template has been created with the uploaded image. Fill in the sections and download when ready.",
      variant: "default",
    });
  };

  const handleFormChange = (updatedFields: FormField[]) => {
    setFormFields(updatedFields);
  };

  const handleSaveTemplate = () => {
    if (!selectedTemplate || !newTemplateName.trim()) return;

    const savedTemplate: Template = {
      ...selectedTemplate,
      id: `saved-${Date.now()}`,
      name: newTemplateName,
      fields: formFields,
    };

    setUserTemplates([...userTemplates, savedTemplate]);
    setSaveTemplateDialog(false);
    setNewTemplateName("");

    toast({
      title: "Template Saved",
      description: `"${newTemplateName}" has been saved to your templates.`,
    });
  };

  const toggleCustomPositions = () => {
    setCustomPositions(!customPositions);
    toast({
      title: customPositions ? "Default Layout" : "Custom Layout",
      description: customPositions 
        ? "Using the default template layout." 
        : "Now you can place text boxes where you want them.",
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">Upload Template Image</h2>
                <ImageUpload onImageUploaded={handleImageUploaded} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
                <TemplateSelector 
                  onSelectTemplate={handleSelectTemplate} 
                  onCreateTemplate={handleCreateTemplate} 
                  uploadedImageUrl={uploadedImageUrl || undefined}
                  userTemplates={userTemplates} 
                />
                {uploadedImageUrl && (
                  <div className="mt-4">
                    <Button 
                      onClick={toggleCustomPositions}
                      variant={customPositions ? "default" : "outline"}
                      className="mb-2"
                    >
                      {customPositions ? "Use Default Layout" : "Custom Text Box Placement"}
                    </Button>
                    {customPositions && (
                      <p className="text-sm text-slate-500">
                        With custom placement, you'll be able to drag and create text regions on your template.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <>
            {selectedTemplate && (
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <FormBuilder template={selectedTemplate} onChange={handleFormChange} />
                </div>
                <div className="md:w-1/2">
                  <TemplatePreview template={selectedTemplate} fields={formFields} />
                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => setSaveTemplateDialog(true)}>
                      Save as Template
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
              >
                Back to Templates
              </Button>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-brand-600">Format Forge Visualizer</h1>
          <p className="text-slate-600">Transform your documents with custom templates</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {renderStep()}
      </main>
      
      <Dialog open={saveTemplateDialog} onOpenChange={setSaveTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder="Enter a name for your template"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <footer className="bg-slate-100 border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-500 text-sm">
          Format Forge Visualizer &copy; 2025
        </div>
      </footer>
    </div>
  );
};

export default Index;
