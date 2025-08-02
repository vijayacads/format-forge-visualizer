import { Template, FormField } from '@/types';
import { DetectedField } from '@/services/ocrService';
import { useToast } from "@/components/ui/use-toast";

export const useTemplateWorkflow = (onTemplateCreated: (template: Template, fields: FormField[]) => void) => {
  const { toast } = useToast();

  const handleImageUploaded = (imageData: string) => {
    toast({
      title: "Image uploaded",
      description: "Processing image with OCR to detect form fields..."
    });
  };

  const handleFieldsDetected = (fields: DetectedField[], imageData: string) => {
    // Automatically create template and go to step 2 after OCR
    handleCreateTemplate(imageData, fields);
  };

  const handleCreateTemplate = (imageData: string, detectedFields: DetectedField[]) => {
    // Create a custom template from the uploaded image with detected fields
    const customTemplate: Template = {
      id: 'custom-' + Date.now(),
      name: 'Custom Template',
      type: 'custom',
      imageUrl: null, // We'll use imageData for persistent storage
      imageData: imageData, // Store the base64 image data for persistence
      fieldPositions: {}, // Initialize empty field positions
      fields: detectedFields.length > 0 
        ? [
            // Always add email field first (mandatory)
            {
              id: 'email',
              label: 'Email',
              type: 'email',
              value: '',
              required: true,
              placeholder: 'Enter your email address',
              position: { x: 50, y: 50, width: 300, height: 40 } // Default position
            },
            // Then add detected fields
            ...detectedFields.map((field, index) => ({
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
          ]
        : [
            // Always add email field first (mandatory)
            {
              id: 'email',
              label: 'Email',
              type: 'email',
              value: '',
              required: true,
              placeholder: 'Enter your email address',
              position: { x: 50, y: 50, width: 300, height: 40 } // Default position
            },
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
        sections: [] // Remove artificial section creation - use flat field list
      }
    };

    onTemplateCreated(customTemplate, customTemplate.fields);
    
    toast({
      title: detectedFields.length > 0 ? "Smart Template Created" : "Custom Template Created",
      description: detectedFields.length > 0 
        ? `Template created with ${detectedFields.length} automatically detected fields and mandatory email field.`
        : "Your template has been created with the uploaded image and mandatory email field. Fill in the sections and download when ready.",
      variant: "default"
    });
  };

  const handleSelectTemplate = (template: Template) => {
    onTemplateCreated(template, template.fields);
  };

  return {
    handleImageUploaded,
    handleFieldsDetected,
    handleSelectTemplate
  };
}; 