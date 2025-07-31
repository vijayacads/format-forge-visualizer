import React from 'react';
import { Template, FormField } from '@/types';
import FieldOverlay from './FieldOverlay';

interface TemplateRendererProps {
  template: Template;
  fields: FormField[];
  fieldPositions: {[key: string]: {x: number, y: number, width: number, height: number}};
  isEditing: boolean;
  imageLoaded: boolean;
  getFieldValue: (id: string) => string;
  onMouseDown: (e: React.MouseEvent, fieldId: string) => void;
  onResizeStart: (e: React.MouseEvent, fieldId: string, handle: string) => void;
}

const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  template,
  fields,
  fieldPositions,
  isEditing,
  imageLoaded,
  getFieldValue,
  onMouseDown,
  onResizeStart
}) => {
  if (!imageLoaded) return null;

  return (
    <div className="absolute inset-0">
      {template.layout.sections.map((section) => {
        if (section.id === 'header') {
          // Handle header fields (name, email, etc.) with positioning
          return (
            <div key={section.id}>
              {section.fieldIds.map(id => {
                const field = fields.find(f => f.id === id);
                const value = getFieldValue(id);
                if (!field || !value.trim()) return null;
                
                const position = fieldPositions[field.id] || { x: 100, y: 100, width: 250, height: 40 };
                
                return (
                  <FieldOverlay
                    key={id}
                    field={field}
                    value={value}
                    position={position}
                    isEditing={isEditing}
                    onMouseDown={onMouseDown}
                    onResizeStart={onResizeStart}
                  />
                );
              })}
            </div>
          );
        }
        
        // Handle other sections with positioning
        const hasContent = section.fieldIds.some(id => getFieldValue(id).trim() !== '');
        if (!hasContent) return null;
        
        return (
          <div key={section.id}>
            {section.fieldIds.map(id => {
              const field = fields.find(f => f.id === id);
              const value = getFieldValue(id);
              if (!field || !value.trim()) return null;
              
              const position = fieldPositions[field.id] || { x: 100, y: 200, width: 400, height: 80 };
              
              return (
                <FieldOverlay
                  key={id}
                  field={field}
                  value={value}
                  position={position}
                  isEditing={isEditing}
                  onMouseDown={onMouseDown}
                  onResizeStart={onResizeStart}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default TemplateRenderer; 