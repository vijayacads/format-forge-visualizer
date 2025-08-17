import React from 'react';
import { FormField } from '@/types';
import ResizeHandles from './ResizeHandles';

interface FieldOverlayProps {
  field: FormField;
  value: string;
  position: { x: number; y: number; width: number; height: number };
  isEditing: boolean;
  onMouseDown: (e: React.MouseEvent, fieldId: string) => void;
  onResizeStart: (e: React.MouseEvent, fieldId: string, handle: string) => void;
}

const FieldOverlay: React.FC<FieldOverlayProps> = ({
  field,
  value,
  position,
  isEditing,
  onMouseDown,
  onResizeStart
}) => {
  const isHeaderField = field.id === 'name' || field.id === 'email';
  const overlayClass = isHeaderField 
    ? `absolute rounded ${isEditing ? 'bg-yellow-100 bg-opacity-30 cursor-move' : ''}`
    : `absolute rounded ${isEditing ? 'bg-blue-100 bg-opacity-20 cursor-move' : ''}`;







  // Debug position prop with more details
  console.log(`🎯 FIELDOVERLAY ${field.id} DETAILED DEBUG:`, {
    fieldId: field.id,
    receivedPosition: position,
    transformValue: `translate(${position.x}px, ${position.y}px)`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    timestamp: new Date().toISOString()
  });

  return (
    <div 
      className={overlayClass}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${position.width}px`,
        minHeight: `${position.height}px`,
        zIndex: 10,
        position: 'absolute',
        left: '0px',
        top: '0px'
      }}
      onMouseDown={(e) => onMouseDown(e, field.id)}
    >
      {field.type === 'richtext' ? (
        <div 
          className="text-gray-900 leading-tight text-sm quill-editor-content"
          style={{ 
            lineHeight: '1.2', 
            margin: 0, 
            padding: 0
          }}
          dangerouslySetInnerHTML={{
            __html: value || '<span class="text-gray-400 italic">No content added yet</span>'
          }}
        />
      ) : (
        <div 
          className="text-gray-900 whitespace-pre-wrap leading-tight text-sm"
          style={{ 
            lineHeight: '1.2', 
            margin: 0, 
            padding: 0
          }}
        >
          {value}
        </div>
      )}
      <ResizeHandles
        fieldId={field.id}
        position={position}
        isEditing={isEditing}
        onResizeStart={onResizeStart}
      />
    </div>
  );
};

export default FieldOverlay; 