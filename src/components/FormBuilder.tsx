import React, { useState, useEffect } from 'react';
import { FormField, Template } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import RichTextEditor from './RichTextEditor';

interface FormBuilderProps {
  template: Template;
  onChange: (fields: FormField[]) => void;
  onSectionTitlesChange?: (sectionTitles: {[key: string]: string}) => void;
}

const FormBuilder = ({
  template,
  onChange,
  onSectionTitlesChange
}: FormBuilderProps) => {
  const [fields, setFields] = useState<FormField[]>(template.fields);
  const [expandedSections, setExpandedSections] = useState<string[]>(['header']);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionTitles, setSectionTitles] = useState<{[key: string]: string}>({});

  useEffect(() => {
    setFields(template.fields);
    // Expand the first section by default
    if (template.layout.sections.length > 0) {
      setExpandedSections([template.layout.sections[0].id]);
    }
    
    // Initialize section titles from template or defaults
    const titles: {[key: string]: string} = {};
    template.layout.sections.forEach(section => {
      // Use saved section titles if available, otherwise use section.title or default
      titles[section.id] = template.sectionTitles?.[section.id] || section.title || 'Basic Information';
    });
    setSectionTitles(titles);
  }, [template]);

  const handleFieldChange = (id: string, value: string) => {
    const updatedFields = fields.map(field => field.id === id ? {
      ...field,
      value
    } : field);
    setFields(updatedFields);
    onChange(updatedFields);
  };

  const handleSectionTitleChange = (sectionId: string, newTitle: string) => {
    setSectionTitles(prev => ({
      ...prev,
      [sectionId]: newTitle
    }));
  };

  const handleSectionTitleSave = (sectionId: string) => {
    setEditingSection(null);
    onSectionTitlesChange?.(sectionTitles);
  };

  const renderField = (field: FormField) => {
    // Set default placeholder for all fields
    const placeholder = "Enter your Text Here";
    
    switch (field.type) {
      case 'textarea':
        return <div key={field.id} className="mb-4">
            <Textarea 
              id={field.id} 
              value={field.value} 
              onChange={e => handleFieldChange(field.id, e.target.value)} 
              placeholder={placeholder} 
              className="resize-y min-h-[100px]" 
            />
          </div>;
      case 'select':
        return <div key={field.id} className="mb-4">
            <select id={field.id} value={field.value} onChange={e => handleFieldChange(field.id, e.target.value)} className="w-full border rounded-md p-2">
              <option value="">Select an option</option>
              {field.options?.map(option => <option key={option} value={option}>
                  {option}
                </option>)}
            </select>
          </div>;
      case 'richtext':
        return <div key={field.id} className="mb-4">
            <RichTextEditor
              value={field.value}
              onChange={value => handleFieldChange(field.id, value)}
              placeholder={placeholder}
            />
          </div>;
      default:
        return <div key={field.id} className="mb-4">
            <Input 
              id={field.id} 
              value={field.value} 
              onChange={e => handleFieldChange(field.id, e.target.value)} 
              placeholder={placeholder}
              type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
            />
          </div>;
    }
  };

  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Enter Your Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <Accordion type="multiple" defaultValue={expandedSections} className="w-full">
            {template.layout.sections.map(section => <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger>
                  {editingSection === section.id ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={sectionTitles[section.id] || ''}
                        onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSectionTitleSave(section.id);
                          }
                        }}
                        onBlur={() => handleSectionTitleSave(section.id)}
                        autoFocus
                        className="w-48"
                      />
                    </div>
                  ) : (
                    <div 
                      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSection(section.id);
                      }}
                    >
                      {sectionTitles[section.id] || 'Basic Information'}
                    </div>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  {section.fieldIds.map(fieldId => {
                const field = fields.find(f => f.id === fieldId);
                return field ? renderField(field) : null;
              })}
                </AccordionContent>
              </AccordionItem>)}
          </Accordion>
        </form>
      </CardContent>
    </Card>;
};
export default FormBuilder;