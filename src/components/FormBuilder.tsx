import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FormField, Template } from '@/types';
import RichTextEditor from './RichTextEditor';
import { Plus, Trash2 } from 'lucide-react';

interface FormBuilderProps {
  template: Template;
  onChange: (fields: FormField[]) => void;
  isAdmin?: boolean;
}

const FormBuilder = React.memo(({
  template,
  onChange,
  isAdmin = false
}: FormBuilderProps) => {
  const [fields, setFields] = useState<FormField[]>(template.fields);
  const [expandedFields, setExpandedFields] = useState<string[]>(fields.map(f => f.id));
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  useEffect(() => {
    setFields(template.fields);
    setExpandedFields(template.fields.map(f => f.id));
  }, [template.fields]);

  const handleFieldChange = useCallback((id: string, value: string) => {
    setFields(prevFields => {
      const updatedFields = prevFields.map(field => 
        field.id === id ? { ...field, value } : field
      );
      onChange(updatedFields);
      return updatedFields;
    });
  }, [onChange]);



  const handleFieldLabelChange = useCallback((id: string, newLabel: string) => {
    const updatedFields = fields.map(field => 
      field.id === id ? { ...field, label: newLabel } : field
    );
    setFields(updatedFields);
    onChange(updatedFields);
  }, [fields, onChange]);

  const handleFieldLabelKeyDown = useCallback((e: React.KeyboardEvent, fieldId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      e.stopPropagation(); // Prevent accordion toggle
      setEditingFieldId(null); // Stop editing
    }
  }, []);

  const handleFieldLabelBlur = useCallback((fieldId: string) => {
    setEditingFieldId(null); // Stop editing when input loses focus
  }, []);

  const handleFieldLabelFocus = useCallback((fieldId: string) => {
    setEditingFieldId(fieldId); // Start editing
  }, []);

  const handleAccordionChange = useCallback((value: string[]) => {
    // Don't change accordion state if we're editing a field label
    if (editingFieldId) {
      return;
    }
    setExpandedFields(value);
  }, [editingFieldId]);

  const addNewField = useCallback(() => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'richtext', // Use richtext for consistency
      value: '',
      required: false
    };
    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    setExpandedFields([...expandedFields, newField.id]);
    onChange(updatedFields);
  }, [fields, expandedFields, onChange]);

  const removeField = useCallback((fieldId: string) => {
    // Prevent deletion of the email field
    if (fieldId === 'email') {
      return;
    }
    
    const updatedFields = fields.filter(field => field.id !== fieldId);
    setFields(updatedFields);
    setExpandedFields(expandedFields.filter(id => id !== fieldId));
    onChange(updatedFields);
  }, [fields, expandedFields, onChange]);

  const renderField = useCallback((field: FormField) => {
    const placeholder = "Enter your Text Here";
    
    switch (field.type) {
      case 'textarea':
        return (
            <Textarea 
              id={field.id} 
              value={field.value} 
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={placeholder} 
            className="min-h-[100px]"
          />
        );
      case 'richtext':
        return (
            <RichTextEditor
              value={field.value}
              onChange={(value) => handleFieldChange(field.id, value)}
              placeholder={placeholder}
            />
        );
      default:
        return (
            <Input 
              id={field.id} 
              value={field.value} 
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={placeholder}
            />
        );
    }
  }, [handleFieldChange]);

  // Memoize the fields array to prevent unnecessary re-renders
  const memoizedFields = useMemo(() => fields, [fields]);

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Form Builder</CardTitle>
          {isAdmin && (
            <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
              Template ID: {template.id}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <Accordion type="multiple" value={expandedFields} onValueChange={handleAccordionChange} className="w-full">
          {memoizedFields.map(field => (
            <AccordionItem key={field.id} value={field.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-2">
                    {isAdmin ? (
                      <Input
                        value={field.label}
                        onChange={(e) => handleFieldLabelChange(field.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => handleFieldLabelKeyDown(e, field.id)}
                        onBlur={() => handleFieldLabelBlur(field.id)}
                        onFocus={() => handleFieldLabelFocus(field.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={`w-full sm:w-48 text-left font-medium ${field.id === 'email' ? 'bg-blue-50 border-blue-200' : ''}`}
                        disabled={field.id === 'email'} // Prevent editing email field label
                      />
                    ) : (
                      <span className="font-medium">{field.label}</span>
                    )}
                    {field.id === 'email' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Required
                      </span>
                    )}
                    </div>
                  {isAdmin && field.id !== 'email' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                </AccordionTrigger>
                <AccordionContent>
                {renderField(field)}
                </AccordionContent>
            </AccordionItem>
          ))}
          </Accordion>
        
        {isAdmin && (
          <Button 
            onClick={addNewField} 
            variant="outline" 
            className="mt-4 w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Field
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

FormBuilder.displayName = 'FormBuilder';

export default FormBuilder;