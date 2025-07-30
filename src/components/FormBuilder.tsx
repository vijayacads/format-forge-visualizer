import React, { useState, useEffect } from 'react';
import { FormField, Template } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
interface FormBuilderProps {
  template: Template;
  onChange: (fields: FormField[]) => void;
}
const FormBuilder = ({
  template,
  onChange
}: FormBuilderProps) => {
  const [fields, setFields] = useState<FormField[]>(template.fields);
  const [expandedSections, setExpandedSections] = useState<string[]>(['header']);
  useEffect(() => {
    setFields(template.fields);
    // Expand the first section by default
    if (template.layout.sections.length > 0) {
      setExpandedSections([template.layout.sections[0].id]);
    }
  }, [template]);
  const handleFieldChange = (id: string, value: string) => {
    const updatedFields = fields.map(field => field.id === id ? {
      ...field,
      value
    } : field);
    setFields(updatedFields);
    onChange(updatedFields);
  };
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'textarea':
        return <div key={field.id} className="mb-4">
            <Label htmlFor={field.id} className="mb-1 block">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea id={field.id} value={field.value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} className="resize-y min-h-[100px]" />
          </div>;
      case 'select':
        return <div key={field.id} className="mb-4">
            <Label htmlFor={field.id} className="mb-1 block">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <select id={field.id} value={field.value} onChange={e => handleFieldChange(field.id, e.target.value)} className="w-full border rounded-md p-2">
              <option value="">Select an option</option>
              {field.options?.map(option => <option key={option} value={option}>
                  {option}
                </option>)}
            </select>
          </div>;
      default:
        return <div key={field.id} className="mb-4">
            
            <Input id={field.id} type={field.type} value={field.value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} />
          </div>;
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Enter Your SWOT Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <Accordion type="multiple" defaultValue={expandedSections} className="w-full">
            {template.layout.sections.map(section => <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger>{section.title || 'Basic Information'}</AccordionTrigger>
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