
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Template } from '@/types';

// Default templates
const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'cv-professional',
    name: 'Professional CV',
    type: 'cv',
    imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d',
    fields: [
      { id: 'name', label: 'Enter your Name', type: 'text', value: '', required: true },
      { id: 'title', label: 'Professional Title', type: 'text', value: '' },
      { id: 'email', label: 'Email', type: 'text', value: '', required: true },
      { id: 'phone', label: 'Phone', type: 'text', value: '' },
      { id: 'address', label: 'Address', type: 'text', value: '' },
      { id: 'summary', label: 'Professional Summary', type: 'textarea', value: '' },
      { id: 'experience', label: 'Work Experience', type: 'textarea', value: '' },
      { id: 'education', label: 'Education', type: 'textarea', value: '' },
      { id: 'skills', label: 'Skills', type: 'textarea', value: '' },
      { id: 'certifications', label: 'Certifications', type: 'textarea', value: '' },
    ],
    layout: {
      sections: [
        { id: 'header', fieldIds: ['name', 'title', 'email', 'phone', 'address'] },
        { id: 'summary', title: 'Professional Summary', fieldIds: ['summary'] },
        { id: 'experience', title: 'Work Experience', fieldIds: ['experience'] },
        { id: 'education', title: 'Education', fieldIds: ['education'] },
        { id: 'skills', title: 'Skills', fieldIds: ['skills'] },
        { id: 'certifications', title: 'Certifications', fieldIds: ['certifications'] },
      ]
    }
  },
  {
    id: 'cv-creative',
    name: 'Creative CV',
    type: 'cv',
    imageUrl: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7',
    fields: [
      { id: 'name', label: 'Enter your Name', type: 'text', value: '', required: true },
      { id: 'title', label: 'Creative Role', type: 'text', value: '', required: true },
      { id: 'email', label: 'Email', type: 'text', value: '' },
      { id: 'portfolio', label: 'Portfolio URL', type: 'text', value: '' },
      { id: 'bio', label: 'Professional Bio', type: 'textarea', value: '' },
      { id: 'projects', label: 'Featured Projects', type: 'textarea', value: '' },
      { id: 'experience', label: 'Work Experience', type: 'textarea', value: '' },
      { id: 'education', label: 'Education', type: 'textarea', value: '' },
      { id: 'skills', label: 'Skills & Expertise', type: 'textarea', value: '' },
      { id: 'awards', label: 'Awards & Recognition', type: 'textarea', value: '' },
    ],
    layout: {
      sections: [
        { id: 'header', fieldIds: ['name', 'title', 'email', 'portfolio'] },
        { id: 'bio', title: 'Professional Bio', fieldIds: ['bio'] },
        { id: 'projects', title: 'Featured Projects', fieldIds: ['projects'] },
        { id: 'experience', title: 'Work Experience', fieldIds: ['experience'] },
        { id: 'skills', title: 'Skills & Expertise', fieldIds: ['skills'] },
        { id: 'education', title: 'Education', fieldIds: ['education'] },
        { id: 'awards', title: 'Awards & Recognition', fieldIds: ['awards'] },
      ]
    }
  },
  {
    id: 'cv-modern',
    name: 'Modern CV',
    type: 'cv',
    imageUrl: '/placeholder.svg',
    fields: [
      { id: 'name', label: 'Enter your Name', type: 'text', value: '', required: true },
      { id: 'title', label: 'Professional Title', type: 'text', value: '' },
      { id: 'email', label: 'Email', type: 'text', value: '', required: true },
      { id: 'phone', label: 'Phone', type: 'text', value: '' },
      { id: 'summary', label: 'Professional Summary', type: 'textarea', value: '' },
      { id: 'skills', label: 'Skills', type: 'textarea', value: '' },
      { id: 'experience', label: 'Experience', type: 'textarea', value: '' },
      { id: 'education', label: 'Education', type: 'textarea', value: '' },
    ],
    layout: {
      sections: [
        { id: 'header', fieldIds: ['name', 'title', 'email', 'phone'] },
        { id: 'summary', title: 'Summary', fieldIds: ['summary'] },
        { id: 'skills', title: 'Skills', fieldIds: ['skills'] },
        { id: 'experience', title: 'Experience', fieldIds: ['experience'] },
        { id: 'education', title: 'Education', fieldIds: ['education'] },
      ]
    }
  },
  {
    id: 'resume-minimal',
    name: 'Minimal Resume',
    type: 'resume',
    imageUrl: '/placeholder.svg',
    fields: [
      { id: 'name', label: 'Enter your Name', type: 'text', value: '', required: true },
      { id: 'contact', label: 'Contact Info', type: 'text', value: '', required: true },
      { id: 'objective', label: 'Objective', type: 'textarea', value: '' },
      { id: 'experience', label: 'Professional Experience', type: 'textarea', value: '' },
      { id: 'education', label: 'Education', type: 'textarea', value: '' },
      { id: 'skills', label: 'Skills', type: 'textarea', value: '' },
    ],
    layout: {
      sections: [
        { id: 'header', fieldIds: ['name', 'contact'] },
        { id: 'objective', title: 'Objective', fieldIds: ['objective'] },
        { id: 'experience', title: 'Experience', fieldIds: ['experience'] },
        { id: 'education', title: 'Education', fieldIds: ['education'] },
        { id: 'skills', title: 'Skills', fieldIds: ['skills'] },
      ]
    }
  },
  {
    id: 'swot',
    name: 'SWOT Analysis',
    type: 'swot',
    imageUrl: '/placeholder.svg',
    fields: [
      { id: 'title', label: 'Analysis Title', type: 'text', value: '', required: true },
      { id: 'strengths', label: 'Strengths', type: 'textarea', value: '' },
      { id: 'weaknesses', label: 'Weaknesses', type: 'textarea', value: '' },
      { id: 'opportunities', label: 'Opportunities', type: 'textarea', value: '' },
      { id: 'threats', label: 'Threats', type: 'textarea', value: '' },
    ],
    layout: {
      sections: [
        { id: 'header', fieldIds: ['title'] },
        { id: 'strengths', title: 'Strengths', fieldIds: ['strengths'] },
        { id: 'weaknesses', title: 'Weaknesses', fieldIds: ['weaknesses'] },
        { id: 'opportunities', title: 'Opportunities', fieldIds: ['opportunities'] },
        { id: 'threats', title: 'Threats', fieldIds: ['threats'] },
      ]
    }
  }
];

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  onCreateTemplate: (imageUrl: string) => void;
  uploadedImageUrl?: string;
  isAdmin?: boolean;
}

const TemplateSelector = ({ 
  onSelectTemplate, 
  onCreateTemplate, 
  uploadedImageUrl,
  isAdmin = false
}: TemplateSelectorProps) => {
  const [activeTab, setActiveTab] = useState<string>('live');

  useEffect(() => {
    if (uploadedImageUrl && isAdmin) {
      setActiveTab('draft');
    }
  }, [uploadedImageUrl, isAdmin]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Choose a Template</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="live">
          {isAdmin ? (
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="live">Live Templates</TabsTrigger>
              <TabsTrigger value="draft" disabled={!uploadedImageUrl}>
                Draft Templates
              </TabsTrigger>
            </TabsList>
          ) : (
            <div className="mb-6">
              <h3 className="text-lg font-medium">Live Templates</h3>
            </div>
          )}
          
          <TabsContent value="live" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEFAULT_TEMPLATES.map(template => (
                <Card 
                  key={template.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-brand-300" 
                  onClick={() => onSelectTemplate(template)}
                >
                  <CardContent className="p-4 flex flex-col items-center">
                    <div className="w-full h-32 bg-gray-100 rounded mb-3 overflow-hidden">
                      <img 
                        src={template.imageUrl} 
                        alt={template.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-center">{template.name}</h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="draft">
              {uploadedImageUrl && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-md h-64 bg-gray-100 rounded mb-3 overflow-hidden">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Draft Template" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <Button
                    className="mt-4 bg-brand-500 hover:bg-brand-600 text-white rounded-md px-4 py-2"
                    onClick={() => uploadedImageUrl && onCreateTemplate(uploadedImageUrl)}
                  >
                    Save as Live Template
                  </Button>
                  <p className="text-sm text-gray-500 mt-4">
                    This draft template will be saved to Live Templates when you click save.
                  </p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;
