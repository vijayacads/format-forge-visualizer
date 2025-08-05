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

  const handleFieldsDetected = (fields: DetectedField[], imageData: string, imageWidth?: number, imageHeight?: number) => {
    // Automatically create template and go to step 2 after OCR
    handleCreateTemplate(imageData, fields, imageWidth, imageHeight);
  };

  const handleCreateTemplate = (imageData: string, detectedFields: DetectedField[], imageWidth?: number, imageHeight?: number) => {
    // Create fields array first
    const fields: FormField[] = detectedFields.length > 0 
      ? [
          // Always add email field first (mandatory)
          {
            id: 'email',
            label: 'Email',
            type: 'email' as const,
            value: '',
            required: true,
            placeholder: 'Enter your email address',
            position: { x: 50, y: 50, width: 300, height: 40 } // Default position
          },
          // Then add detected fields
          ...detectedFields.map((field, index) => ({
            id: field.id,
            label: field.label,
            type: (field.type === 'email' ? 'email' : 
                  field.type === 'phone' ? 'phone' : 
                  field.type === 'date' ? 'date' : 
                  field.type === 'text' ? 'richtext' : // Convert text fields to richtext
                  'richtext') as FormField['type'], // Default to richtext for all other fields
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
            type: 'email' as const,
            value: '',
            required: true,
            placeholder: 'Enter your email address',
            position: { x: 50, y: 50, width: 300, height: 40 } // Default position
          },
          {
            id: 'title',
            label: 'Document Title',
            type: 'text' as const,
            value: '',
            required: true
          }, {
            id: 'section1',
            label: 'Executive Summary',
            type: 'textarea' as const,
            value: ''
          }, {
            id: 'section2',
            label: 'Key Findings',
            type: 'textarea' as const,
            value: ''
          }, {
            id: 'section3',
            label: 'Recommendations',
            type: 'textarea' as const,
            value: ''
          }, {
            id: 'section4',
            label: 'Next Steps',
            type: 'textarea' as const,
            value: ''
          }
        ];

    // Convert field positions to fieldPositions object
    const fieldPositions: { [key: string]: { x: number; y: number; width: number; height: number } } = {};
    fields.forEach(field => {
      if (field.position) {
        fieldPositions[field.id] = field.position;
      }
    });

    // Create a custom template from the uploaded image with detected fields
    const customTemplate: Template = {
      id: 'custom-' + Date.now(),
      name: 'Custom Template',
      type: 'custom',
      imageUrl: null, // We'll use imageData for persistent storage
      imageData: imageData, // Store the base64 image data for persistence
      imageWidth: imageWidth, // Store original image width
      imageHeight: imageHeight, // Store original image height
      fieldPositions: fieldPositions, // Initialize with field positions from OCR
      fields: fields,
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