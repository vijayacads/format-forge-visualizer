import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetectedField } from '@/services/ocrService';
import { migrateLocalStorageTemplates } from '@/utils/migrationUtils';
import { restoreSTEMTemplate } from '@/utils/restoreSTEMTemplate';

const Index = () => {
  const [step, setStep] = useState<number>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [detectedFields, setDetectedFields] = useState<DetectedField[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState<boolean>(false);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [currentFieldPositions, setCurrentFieldPositions] = useState<{[key: string]: {x: number, y: number, width: number, height: number}}>({});
  const [currentSectionTitles, setCurrentSectionTitles] = useState<{[key: string]: string}>({});

  const {
    toast
  } = useToast();

  // Load saved templates from localStorage on component mount
  useEffect(() => {
    // Run migration first
    migrateLocalStorageTemplates();
    
    const saved = localStorage.getItem('savedTemplates');
    console.log('Loading saved templates from localStorage:', saved);
    if (saved) {
      try {
        const parsedTemplates = JSON.parse(saved);
        console.log('Parsed templates:', parsedTemplates);
        if (parsedTemplates.length > 0) {
          // Ensure all templates have the new sectionTitles property
          const validatedTemplates = parsedTemplates.map((template: any) => ({
            ...template,
            sectionTitles: template.sectionTitles || {},
            fieldPositions: template.fieldPositions || {}
          }));
          setSavedTemplates(validatedTemplates);
          console.log('Successfully loaded templates:', validatedTemplates.length);
        } else {
          console.log('No templates found in localStorage');
        }
      } catch (error) {
        console.error('Error loading saved templates:', error);
        console.error('Raw localStorage data:', saved);
        // If there's an error, try to clear the corrupted localStorage
        localStorage.removeItem('savedTemplates');
        toast({
          title: "Template Recovery",
          description: "There was an issue loading your saved templates. They have been reset.",
          variant: "destructive",
        });
      }
    } else {
      console.log('No saved templates found in localStorage');
    }
  }, []);

  // Custom hooks for different concerns
  const { 
    savedTemplates: supabaseSavedTemplates, 
    saveTemplate, 
    deleteTemplate, 
    renameTemplate, 
    reorderTemplates,
    isLoading,
    error
  } = useSupabaseTemplateManagement();
  
  const { 
    isAdmin: isSupabaseAdmin,
    adminPassword: supabaseAdminPassword,
    setAdminPassword: setSupabaseAdminPassword,
    handleAdminLogin: handleSupabaseAdminLogin,
    handleAdminLogout: handleSupabaseAdminLogout,
    closeAdminDialog: closeSupabaseAdminDialog
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

  const handleRecoverTemplates = () => {
    const saved = localStorage.getItem('savedTemplates');
    console.log('Manual recovery - localStorage data:', saved);
    
    if (saved) {
      try {
        const parsedTemplates = JSON.parse(saved);
        console.log('Manual recovery - parsed templates:', parsedTemplates);
        
        if (parsedTemplates.length > 0) {
          const validatedTemplates = parsedTemplates.map((template: any) => ({
            ...template,
            sectionTitles: template.sectionTitles || {},
            fieldPositions: template.fieldPositions || {}
          }));
          setSavedTemplates(validatedTemplates);
          toast({
            title: "Templates Recovered",
            description: `Successfully recovered ${validatedTemplates.length} templates.`,
            variant: "default",
          });
        } else {
          toast({
            title: "No Templates Found",
            description: "No templates found in localStorage.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Manual recovery error:', error);
        toast({
          title: "Recovery Failed",
          description: "Could not recover templates from localStorage.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "No Data Found",
        description: "No template data found in localStorage.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreSTEMTemplate = () => {
    try {
      restoreSTEMTemplate();
      toast({
        title: "STEM Template Restored",
        description: "STEM Curiosity template has been restored with percentage-based positioning.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error restoring STEM template:', error);
      toast({
        title: "Restoration Failed",
        description: "Could not restore STEM Curiosity template.",
        variant: "destructive",
      });
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
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Template Management</h3>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRecoverTemplates}
                      >
                        Recover Templates
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRestoreSTEMTemplate}
                      >
                        Restore STEM Template
                      </Button>
                    </div>
                  </div>
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
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-600">Assignment Template Maker</h1>
              <p className="text-slate-600">Use this To Type Your Assignments, CVs and More.!</p>
            </div>
            <AdminHeader 
              isAdmin={isAdmin}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              handleAdminLogin={() => setIsAdminDialogOpen(true)}
              handleAdminLogout={() => setIsAdminDialogOpen(true)}
              closeAdminDialog={() => setIsAdminDialogOpen(false)}
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