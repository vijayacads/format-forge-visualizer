import React, { useState } from 'react';
import { Template, FormField } from '@/types';
import ImageUpload from '@/components/ImageUpload';
import TemplateSelector from '@/components/TemplateSelector';
import FormBuilder from '@/components/FormBuilder';
import TemplatePreview from '@/components/TemplatePreview';
import AdminHeader from '@/components/AdminHeader';
import { Button } from '@/components/ui/button';
import { useSupabaseTemplateManagement } from '@/hooks/useSupabaseTemplateManagement';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useTemplateWorkflow } from '@/hooks/useTemplateWorkflow';

const Index = () => {
  const [step, setStep] = useState<number>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);

  // Custom hooks for different concerns
  const { 
    savedTemplates, 
    saveTemplate, 
    deleteTemplate, 
    renameTemplate, 
    reorderTemplates,
    isLoading,
    error
  } = useSupabaseTemplateManagement();
  
  const { 
    isAdmin,
    adminPassword,
    setAdminPassword,
    handleAdminLogin,
    handleAdminLogout,
    closeAdminDialog
  } = useAdminAuth();
  
  const { handleImageUploaded, handleFieldsDetected, handleSelectTemplate } = useTemplateWorkflow(
    (template: Template, fields: FormField[]) => {
      setSelectedTemplate(template);
      setFormFields(fields);
      setStep(2);
    }
  );

  const handleFormChange = (fields: FormField[]) => {
    setFormFields(fields);
  };

  // Update template when positions change (single source of truth)
  const handleTemplateUpdate = (updatedTemplate: Template) => {
    setSelectedTemplate(updatedTemplate);
  };

  const handleSaveTemplate = async () => {
    if (selectedTemplate) {
      try {
        // Create updated template with current formFields (including renamed labels)
        // Template already has the latest fieldPositions and imageData from single source of truth
        const updatedTemplate = {
          ...selectedTemplate,
          fields: formFields
        };
        await saveTemplate(updatedTemplate);
        
        // Reset to step 1
        setStep(1);
        setSelectedTemplate(null);
        setFormFields([]);
      } catch (error) {
        console.error('Failed to save template:', error);
        // Error handling is done in the hook with toast notifications
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <div className="space-y-8">
            <div className={`grid ${isAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-8`}>
              {isAdmin && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Upload Template Image</h2>
                  <ImageUpload 
                    onImageUploaded={handleImageUploaded} 
                    onFieldsDetected={handleFieldsDetected}
                  />
                </div>
              )}
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold mb-4">Select a Template</h2>
                <TemplateSelector 
                  onSelectTemplate={handleSelectTemplate}
                  savedTemplates={savedTemplates}
                  onDeleteTemplate={deleteTemplate}
                  onRenameTemplate={renameTemplate}
                  onReorderTemplates={reorderTemplates}
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </div>;
      case 2:
        return <>
            {selectedTemplate && <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <FormBuilder 
                    template={selectedTemplate} 
                    onChange={handleFormChange} 
                    isAdmin={isAdmin}
                  />
                </div>
                <div className="md:w-1/2">
                  <TemplatePreview 
                    template={selectedTemplate} 
                    fields={formFields} 
                    onSaveTemplate={isAdmin && selectedTemplate.type === 'custom' ? handleSaveTemplate : undefined}
                    isAdmin={isAdmin}
                    onTemplateUpdate={handleTemplateUpdate}
                  />
                </div>
              </div>}
            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back to Templates
              </Button>
            </div>
          </>;
      default:
        return null;
    }
  };

  return <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-brand-600">Assignment Template Maker</h1>
              <p className="text-slate-600">Use this To Type Your Assignments, CVs and More.!</p>
            </div>
            <AdminHeader 
              isAdmin={isAdmin}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              handleAdminLogin={handleAdminLogin}
              handleAdminLogout={handleAdminLogout}
              closeAdminDialog={closeAdminDialog}
            />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {renderStep()}
      </main>
      
      <footer className="bg-slate-100 border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-slate-500 text-sm">
          Format Forge Visualizer &copy; 2025
        </div>
      </footer>
    </div>;
};

export default Index;