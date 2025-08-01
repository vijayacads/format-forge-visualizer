import { useState, useEffect } from 'react';
import { Template } from '@/types';
import { useToast } from "@/components/ui/use-toast";

export const useTemplateManagement = () => {
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const { toast } = useToast();

  // Load saved templates from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedTemplates');
    if (saved) {
      try {
        const parsedTemplates = JSON.parse(saved);
        if (parsedTemplates && Array.isArray(parsedTemplates)) {
          setSavedTemplates(parsedTemplates);
        }
      } catch (error) {
        // Silently handle errors - don't clear localStorage
      }
    }
  }, []);

  // Save templates to localStorage whenever savedTemplates changes
  useEffect(() => {
    localStorage.setItem('savedTemplates', JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  const saveTemplate = (template: Template, fieldPositions: {[key: string]: {x: number, y: number, width: number, height: number}}) => {
    const savedTemplate: Template = {
      ...template,
      id: 'saved-' + Date.now(),
      name: template.type === 'custom' 
        ? `Custom Template ${new Date().toLocaleDateString()}`
        : `${template.name} ${new Date().toLocaleDateString()}`,
      fields: template.fields.map(field => ({
        ...field,
        value: '' // Reset values for new instances
      })),
      fieldPositions
    };
    
    setSavedTemplates(prev => [...prev, savedTemplate]);
    
    toast({
      title: "Template Saved",
      description: "Your template has been saved to Templates.",
      variant: "default",
    });
    
    return savedTemplate;
  };

  const deleteTemplate = (templateId: string) => {
    setSavedTemplates(prev => prev.filter(template => template.id !== templateId));
    toast({
      title: "Template Deleted",
      description: "The template has been removed from your templates.",
      variant: "default",
    });
  };

  const renameTemplate = (templateId: string, newName: string) => {
    setSavedTemplates(prev => {
      const updatedTemplates = prev.map(template => 
        template.id === templateId 
          ? { ...template, name: newName }
          : template
      );
      return updatedTemplates;
    });
    
    toast({
      title: "Template Renamed",
      description: "The template has been renamed successfully.",
      variant: "default",
    });
  };

  const reorderTemplates = (reorderedTemplates: Template[]) => {
    setSavedTemplates(reorderedTemplates);
    toast({
      title: "Order Updated",
      description: "Template order has been updated successfully.",
      variant: "default",
    });
  };

  const recoverTemplates = () => {
    const saved = localStorage.getItem('savedTemplates');
    
    if (saved) {
      try {
        const parsedTemplates = JSON.parse(saved);
        
        if (parsedTemplates && Array.isArray(parsedTemplates) && parsedTemplates.length > 0) {
          setSavedTemplates(parsedTemplates);
          toast({
            title: "Templates Recovered",
            description: `Successfully recovered ${parsedTemplates.length} templates.`,
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

  return {
    savedTemplates,
    saveTemplate,
    deleteTemplate,
    renameTemplate,
    reorderTemplates,
    recoverTemplates
  };
}; 