import React, { useState } from 'react';
import { Template, FormField } from '@/types';
import ImageUpload from '@/components/ImageUpload';
import TemplateSelector from '@/components/TemplateSelector';
import FormBuilder from '@/components/FormBuilder';
import TemplatePreview from '@/components/TemplatePreview';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
const Index = () => {
  const [step, setStep] = useState<number>(1);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState<boolean>(false);
  const {
    toast
  } = useToast();
  const handleImageUploaded = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    toast({
      title: "Image Uploaded",
      description: "You can now create a template from this image."
    });

    // Automatically switch to the draft template tab in the TemplateSelector
    const tabsContainer = document.querySelector('[role="tablist"]');
    if (tabsContainer) {
      const draftTabTrigger = tabsContainer.querySelector('[value="draft"]');
      if (draftTabTrigger instanceof HTMLElement) {
        draftTabTrigger.click();
      }
    }
  };
  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setFormFields(template.fields);
    setStep(2);
  };
  const handleCreateTemplate = (imageUrl: string) => {
    // Create a custom template from the uploaded image with better section headers
    const customTemplate: Template = {
      id: 'custom-' + Date.now(),
      name: 'Custom Template',
      type: 'custom',
      imageUrl: imageUrl,
      fields: [{
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
      }],
      layout: {
        sections: [{
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
        }]
      }
    };
    setSelectedTemplate(customTemplate);
    setFormFields(customTemplate.fields);
    setStep(2);
    toast({
      title: "Custom Template Created",
      description: "Your template has been created with the uploaded image. Fill in the sections and download when ready.",
      variant: "default"
    });
  };
  const handleFormChange = (updatedFields: FormField[]) => {
    setFormFields(updatedFields);
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
  const renderStep = () => {
    switch (step) {
      case 1:
        return <div className="space-y-8">
            <div className={`grid ${isAdmin ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-8`}>
              {isAdmin && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Upload Template Image</h2>
                  <ImageUpload onImageUploaded={handleImageUploaded} />
                </div>
              )}
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold mb-4">{isAdmin ? 'Or Select from Live Templates' : 'Select from Live Templates'}</h2>
                <TemplateSelector 
                  onSelectTemplate={handleSelectTemplate} 
                  onCreateTemplate={handleCreateTemplate} 
                  uploadedImageUrl={uploadedImageUrl || undefined} 
                  isAdmin={isAdmin}
                />
              </div>
            </div>
          </div>;
      case 2:
        return <>
            {selectedTemplate && <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <FormBuilder template={selectedTemplate} onChange={handleFormChange} />
                </div>
                <div className="md:w-1/2">
                  <TemplatePreview template={selectedTemplate} fields={formFields} />
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