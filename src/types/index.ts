
export type FormField = {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'select' | 'image';
  value: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
};

export type Template = {
  id: string;
  name: string;
  type: 'cv' | 'resume' | 'swot' | 'custom';
  imageUrl?: string;
  fields: FormField[];
  layout: TemplateLayout;
};

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
