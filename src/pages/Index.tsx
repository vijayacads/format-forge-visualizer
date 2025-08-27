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
    updateTemplate,
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

  // Simple template update - direct state update
  const handleTemplateUpdate = (updatedTemplate: Template) => {
    setSelectedTemplate(updatedTemplate);
  };

  // Simple Save As - Create new template
  const handleSaveAsTemplate = async (isPublic: boolean = false) => {
    if (selectedTemplate) {
      try {
        // Debug logs - local only
        console.log('🔍 SAVE AS DEBUG - selectedTemplate:', selectedTemplate);
        console.log('🔍 SAVE AS DEBUG - fieldPositions:', selectedTemplate?.fieldPositions);
        console.log('🔍 SAVE AS DEBUG - template ID:', selectedTemplate?.id);

        // Create new template with current data (exactly like Save Template)
        const newTemplate = {
          ...selectedTemplate,
          fields: formFields,
          isPublic: isPublic
        };
        
        // Debug logs - local only
        console.log('🔍 SAVE AS DEBUG - newTemplate:', newTemplate);
        console.log('🔍 SAVE AS DEBUG - fieldPositions being saved:', newTemplate.fieldPositions);

        
        await saveTemplate(newTemplate);
        
        // Reset to step 1
        setStep(1);
        setSelectedTemplate(null);
        setFormFields([]);
      } catch (error) {
        console.error('Failed to save template:', error);
      }
    }
  };

  // Simple Save - Update existing template
  const handleSaveTemplate = async (isPublic: boolean = false) => {
    if (selectedTemplate) {
      try {
        // Debug logs - local only
        console.log('🔍 SAVE DEBUG - selectedTemplate:', selectedTemplate);
        console.log('🔍 SAVE DEBUG - fieldPositions:', selectedTemplate?.fieldPositions);
        console.log('🔍 SAVE DEBUG - template ID:', selectedTemplate?.id);

        // Update existing template with current data
        const updatedTemplate = {
          ...selectedTemplate,
          fields: formFields,
          isPublic: isPublic
        };
        
        // Debug logs - local only
        console.log('🔍 SAVE DEBUG - updatedTemplate:', updatedTemplate);
        console.log('🔍 SAVE DEBUG - fieldPositions being saved:', updatedTemplate.fieldPositions);
        
        await updateTemplate(updatedTemplate);
        
        // Update local state with the updated template
        setSelectedTemplate(updatedTemplate);
      } catch (error) {
        console.error('Failed to update template:', error);
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
                    onSaveTemplate={isAdmin ? handleSaveTemplate : undefined}
                    onSaveAsTemplate={isAdmin && selectedTemplate.type === 'custom' ? handleSaveAsTemplate : undefined}
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
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center space-x-4">
              {/* VigyanShaala Logo */}
              <img 
                src="/Logo2.jpg" 
                alt="VigyanShaala" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold" style={{color: '#2c4869'}}>VigyanShaala's Assignment Template Maker</h1>
                <p className="text-slate-600">Use this To Type Your Assignments, CVs and More!</p>
              </div>
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