import React, { useState, useEffect } from 'react';
import { Template, FormField } from '@/types';
import ImageUpload from '@/components/ImageUpload';
import TemplateSelector from '@/components/TemplateSelector';
import FormBuilder from '@/components/FormBuilder';
import TemplatePreview from '@/components/TemplatePreview';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DetectedField } from '@/services/ocrService';

const Index = () => {
  const [step, setStep] = useState<number>(1);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
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

  // Save templates to localStorage whenever savedTemplates changes
  useEffect(() => {
    console.log('Saving templates to localStorage:', savedTemplates);
    localStorage.setItem('savedTemplates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    toast({
      title: "Image uploaded",
      description: "Processing image with OCR to detect form fields..."
    });
  };

  const handleFieldsDetected = (fields: DetectedField[], imageUrl: string) => {
    setDetectedFields(fields);
    console.log('Fields detected in Index:', fields);
    
    // Automatically create template and go to step 2 after OCR
    handleCreateTemplate(imageUrl, fields);
  };

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormFields(template.fields);
    setStep(2);
  };

  const handleCreateTemplate = (imageUrl: string, detectedFields: DetectedField[]) => {
    // Create a custom template from the uploaded image with detected fields
    const customTemplate: Template = {
      id: 'custom-' + Date.now(),
      name: 'Custom Template',
      type: 'custom',
      imageUrl: imageUrl,
      fields: detectedFields.length > 0 
        ? detectedFields.map((field, index) => ({
            id: field.id,
            label: field.label,
            type: field.type === 'email' ? 'email' : 
                  field.type === 'phone' ? 'phone' : 
                  field.type === 'date' ? 'date' : 
                  field.type === 'text' ? 'richtext' : // Convert text fields to richtext
                  'richtext', // Default to richtext for all other fields
            value: '',
            required: field.required,
            placeholder: `Enter ${field.label.toLowerCase()}`,
            position: field.position // Include position data from OCR
          }))
        : [
            {
              id: 'title',
              label: 'Document Title',
              type: 'text',
              value: '',
              required: true
            }, {
              id: 'section1',
              label: 'Executive Summary',
              type: 'textarea',
              value: ''
            }, {
              id: 'section2',
              label: 'Key Findings',
              type: 'textarea',
              value: ''
            }, {
              id: 'section3',
              label: 'Recommendations',
              type: 'textarea',
              value: ''
            }, {
              id: 'section4',
              label: 'Next Steps',
              type: 'textarea',
              value: ''
            }
          ],
      layout: {
        sections: detectedFields.length > 0 
          ? [
              {
                id: 'header',
                fieldIds: detectedFields.filter(f => f.type === 'text').map(f => f.id)
              },
              ...detectedFields.filter(f => f.type === 'textarea').map((field, index) => ({
                id: `section${index + 1}`,
                title: field.label,
                fieldIds: [field.id]
              }))
            ]
          : [
              {
                id: 'header',
                fieldIds: ['title']
              }, {
                id: 'section1',
                title: 'Executive Summary',
                fieldIds: ['section1']
              }, {
                id: 'section2',
                title: 'Key Findings',
                fieldIds: ['section2']
              }, {
                id: 'section3',
                title: 'Recommendations',
                fieldIds: ['section3']
              }, {
                id: 'section4',
                title: 'Next Steps',
                fieldIds: ['section4']
              }
            ]
      }
    };
    setSelectedTemplate(customTemplate);
    setFormFields(customTemplate.fields);
    setStep(2);
    toast({
      title: detectedFields.length > 0 ? "Smart Template Created" : "Custom Template Created",
      description: detectedFields.length > 0 
        ? `Template created with ${detectedFields.length} automatically detected fields.`
        : "Your template has been created with the uploaded image. Fill in the sections and download when ready.",
      variant: "default"
    });
  };

  const handleFormChange = (updatedFields: FormField[]) => {
    setFormFields(updatedFields);
  };

  const handlePositionsChange = (positions: {[key: string]: {x: number, y: number, width: number, height: number}}) => {
    setCurrentFieldPositions(positions);
  };

  const handleSectionTitlesChange = (sectionTitles: {[key: string]: string}) => {
    setCurrentSectionTitles(sectionTitles);
  };

  const handleSaveTemplate = () => {
    if (selectedTemplate) {
      // Create a new template with the current field positions and data
      const savedTemplate: Template = {
        ...selectedTemplate,
        id: 'saved-' + Date.now(),
        name: selectedTemplate.type === 'custom' 
          ? `Custom Template ${new Date().toLocaleDateString()}`
          : `${selectedTemplate.name} ${new Date().toLocaleDateString()}`,
        fields: formFields.map(field => ({
          ...field,
          value: '' // Reset values for new instances
        })),
        fieldPositions: currentFieldPositions, // Save the current positions
        sectionTitles: currentSectionTitles // Save the current section titles
      };
      
      // Save the template to state and localStorage
      setSavedTemplates(prev => [...prev, savedTemplate]);
      
      toast({
        title: "Template Saved",
        description: "Your template has been saved to Templates.",
        variant: "default",
      });
      
      // Reset to step 1
      setStep(1);
      setSelectedTemplate(null);
      setFormFields([]);
      setDetectedFields([]);
      setUploadedImageUrl(null);
      setCurrentFieldPositions({});
      setCurrentSectionTitles({});
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setSavedTemplates(prev => prev.filter(template => template.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "The template has been removed from your templates.",
      variant: "default",
    });
  };

  const handleRenameTemplate = (templateId: string, newName: string) => {
    console.log('Renaming template:', templateId, 'to:', newName);
    
    setSavedTemplates(prev => {
      const updatedTemplates = prev.map(template => 
        template.id === templateId 
          ? { 
              ...template, 
              name: newName,
              fieldPositions: template.fieldPositions || {},
              sectionTitles: template.sectionTitles || {}
            }
          : template
      );
      
      console.log('Template after rename:', updatedTemplates.find(t => t.id === templateId));
      return updatedTemplates;
    });
    
    toast({
      title: "Template Renamed",
      description: "The template has been renamed successfully.",
      variant: "default",
    });
  };

  const handleReorderTemplates = (reorderedTemplates: Template[]) => {
    setSavedTemplates(reorderedTemplates);
    toast({
      title: "Order Updated",
      description: "Template order has been updated successfully.",
      variant: "default",
    });
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'Vigyan@Assignments123') {
      setIsAdmin(true);
      setIsAdminDialogOpen(false);
      setAdminPassword('');
      toast({
        title: "Admin Access Granted",
        description: "You now have access to admin features.",
        variant: "default"
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive"
      });
      setAdminPassword('');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out of admin mode.",
      variant: "default"
    });
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
                  onDeleteTemplate={handleDeleteTemplate}
                  onRenameTemplate={handleRenameTemplate}
                  onReorderTemplates={handleReorderTemplates}
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
                    onSectionTitlesChange={handleSectionTitlesChange}
                  />
                </div>
                <div className="md:w-1/2">
                  <TemplatePreview 
                    template={selectedTemplate} 
                    fields={formFields} 
                    onSaveTemplate={isAdmin && selectedTemplate.type === 'custom' ? handleSaveTemplate : undefined}
                    isAdmin={isAdmin}
                    onPositionsChange={handlePositionsChange}
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
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-600 font-medium">Admin Mode</span>
                  <Button variant="outline" size="sm" onClick={handleRecoverTemplates}>
                    Recover Templates
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAdminLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <AlertDialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Admin
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Admin Access</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please enter the admin password to access admin features.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label htmlFor="adminPassword">Password</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
                        placeholder="Enter admin password"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setAdminPassword('')}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleAdminLogin}>Login</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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