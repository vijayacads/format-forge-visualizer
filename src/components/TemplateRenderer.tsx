import React, { useMemo } from 'react';
import { Template, FormField } from '@/types';
import FieldOverlay from './FieldOverlay';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TemplateRendererProps {
  template: Template;
  fields: FormField[];
  fieldPositions: { [key: string]: Position };
  isEditing: boolean;
  imageLoaded: boolean;
  getFieldValue: (id: string) => string;
  onMouseDown: (e: React.MouseEvent, fieldId: string) => void;
  onResizeStart: (e: React.MouseEvent, fieldId: string, handle: string) => void;
  containerGlobalPosition?: { left: number; top: number };
}

const TemplateRenderer = React.memo<TemplateRendererProps>(({
  template,
  fields,
  fieldPositions,
  isEditing,
  imageLoaded,
  getFieldValue,
  onMouseDown,
  onResizeStart,
  containerGlobalPosition
}) => {
  // Memoize the filtered fields to prevent unnecessary re-renders
  const visibleFields = useMemo(() => {
    return fields.filter(field => {
      // Always exclude the email field from preview
      if (field.id === 'email') {
        return false;
      }
      
      const value = getFieldValue(field.id);
      return value.trim().length > 0;
    });
  }, [fields, getFieldValue]);

  if (!imageLoaded) {
    return null;
  }

  return (
    <div className="absolute inset-0">

      {visibleFields.map(field => {
        const value = getFieldValue(field.id);
        const basePosition = fieldPositions[field.id] || { 
          x: 100, 
          y: 100, 
          width: 250, 
          height: 40 
        };
        
        // Use base position (image-relative coordinates)
        const position = basePosition;
        

        
        return (
          <FieldOverlay
            key={field.id}
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
});

TemplateRenderer.displayName = 'TemplateRenderer';

export default TemplateRenderer; 