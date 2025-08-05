
export type FormField = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'image' | 'richtext' | 'email' | 'phone';
  value: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  position?: { x: number; y: number; width: number; height: number };
};

export interface Template {
  id: string;
  name: string;
  type: 'cv' | 'resume' | 'swot' | 'custom';
  fields: FormField[];
  fieldPositions: { [key: string]: { x: number; y: number; width: number; height: number } };
  layout?: { sections: TemplateSection[] };
  imageUrl?: string | null;
  imageData?: string | null;
  imageWidth?: number;  // Store original image width
  imageHeight?: number; // Store original image height
  isPublic?: boolean;
}

export type TemplateLayout = {
  sections: TemplateSection[];
};

export type TemplateSection = {
  id: string;
  title?: string;
  fieldIds: string[];
  style?: React.CSSProperties;
};

export type FormData = {
  [key: string]: string;
};

export interface FormSubmission {
  id: string;
  template_id: string;
  email: string;
  form_data: FormData;
  created_at: string;
}
