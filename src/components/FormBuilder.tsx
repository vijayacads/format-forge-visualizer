
import React, { useState, useEffect } from 'react';
import { FormField, Template } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ListOrdered,
  ListUnordered,
  Text,
} from "lucide-react";

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

  const applyTextFormat = (id: string, format: string) => {
    const field = fields.find(f => f.id === id);
    if (!field) return;

    const textarea = document.getElementById(id) as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = field.value.substring(start, end);
    let newText = field.value;
    
    switch (format) {
      case 'bold':
        newText = field.value.substring(0, start) + `**${selectedText}**` + field.value.substring(end);
        break;
      case 'italic':
        newText = field.value.substring(0, start) + `_${selectedText}_` + field.value.substring(end);
        break;
      case 'underline':
        newText = field.value.substring(0, start) + `<u>${selectedText}</u>` + field.value.substring(end);
        break;
      case 'bullet':
        // Split the selected text into lines
        const bulletLines = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        newText = field.value.substring(0, start) + bulletLines + field.value.substring(end);
        break;
      case 'number':
        // Split the selected text into lines and number them
        const numberedLines = selectedText.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
        newText = field.value.substring(0, start) + numberedLines + field.value.substring(end);
        break;
      case 'align-left':
        newText = field.value.substring(0, start) + `<div style="text-align: left;">${selectedText}</div>` + field.value.substring(end);
        break;
      case 'align-center':
        newText = field.value.substring(0, start) + `<div style="text-align: center;">${selectedText}</div>` + field.value.substring(end);
        break;
      case 'align-right':
        newText = field.value.substring(0, start) + `<div style="text-align: right;">${selectedText}</div>` + field.value.substring(end);
        break;
    }
    
    handleFieldChange(id, newText);
    
    // Restore focus to the textarea after the operation
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start;
      textarea.selectionEnd = end + (newText.length - field.value.length);
    }, 0);
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'textarea':
        return (
          <div key={field.id} className="mb-4">
            <Label htmlFor={field.id} className="mb-1 block">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 p-1 border-b flex flex-wrap gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTextFormat(field.id, 'bold')}
                  className="h-8 w-8 p-0"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTextFormat(field.id, 'italic')}
                  className="h-8 w-8 p-0"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTextFormat(field.id, 'underline')}
                  className="h-8 w-8 p-0"
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-8 bg-gray-300 mx-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTextFormat(field.id, 'align-left')}
                  className="h-8 w-8 p-0"
                  title="Align Left"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTextFormat(field.id, 'align-center')}
                  className="h-8 w-8 p-0"
                  title="Align Center"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTextFormat(field.id, 'align-right')}
                  className="h-8 w-8 p-0"
                  title="Align Right"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <div className="w-px h-8 bg-gray-300 mx-1"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTextFormat(field.id, 'bullet')}
                  className="h-8 w-8 p-0"
                  title="Bullet List"
                >
                  <ListUnordered className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => applyTextFormat(field.id, 'number')}
                  className="h-8 w-8 p-0"
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2" title="Font Options">
                      <Text className="h-4 w-4 mr-1" />
                      <span className="text-xs">Font</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2">
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor={`font-size-${field.id}`}>Size</Label>
                        <select 
                          id={`font-size-${field.id}`} 
                          className="w-full border p-1 mt-1"
                          onChange={(e) => {
                            const fontSize = e.target.value;
                            const textarea = document.getElementById(field.id) as HTMLTextAreaElement;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = field.value.substring(start, end);
                              const newText = field.value.substring(0, start) + 
                                `<span style="font-size: ${fontSize};">${selectedText}</span>` + 
                                field.value.substring(end);
                              handleFieldChange(field.id, newText);
                            }
                          }}
                        >
                          <option value="1em">Normal</option>
                          <option value="0.875em">Small</option>
                          <option value="1.25em">Large</option>
                          <option value="1.5em">X-Large</option>
                          <option value="2em">XX-Large</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor={`font-color-${field.id}`}>Color</Label>
                        <div className="flex gap-2 mt-1">
                          {["#000000", "#FF0000", "#008000", "#0000FF", "#FFA500", "#800080"].map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-6 h-6 rounded-full border"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                const textarea = document.getElementById(field.id) as HTMLTextAreaElement;
                                if (textarea) {
                                  const start = textarea.selectionStart;
                                  const end = textarea.selectionEnd;
                                  const selectedText = field.value.substring(start, end);
                                  const newText = field.value.substring(0, start) + 
                                    `<span style="color: ${color};">${selectedText}</span>` + 
                                    field.value.substring(end);
                                  handleFieldChange(field.id, newText);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Textarea 
                id={field.id} 
                value={field.value} 
                onChange={e => handleFieldChange(field.id, e.target.value)} 
                placeholder={field.placeholder} 
                className="resize-y min-h-[100px] border-none focus:ring-0"
              />
            </div>
          </div>
        );
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
            <Label htmlFor={field.id} className="mb-1 block">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input id={field.id} type={field.type} value={field.value} onChange={e => handleFieldChange(field.id, e.target.value)} placeholder={field.placeholder} />
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
