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
    ? `absolute px-1 py-0.5 rounded ${isEditing ? 'bg-yellow-100 bg-opacity-30 cursor-move' : ''}`
    : `absolute px-1 py-0.5 rounded ${isEditing ? 'bg-blue-100 bg-opacity-20 cursor-move' : ''}`;

  return (
    <div 
      className={overlayClass}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        minHeight: `${position.height}px`,
        zIndex: 10
      }}
      onMouseDown={(e) => onMouseDown(e, field.id)}
    >
      {field.type === 'richtext' ? (
        <div 
          className={`text-sm text-gray-900 ql-editor ${isHeaderField ? '' : 'text-sm'}`}
          dangerouslySetInnerHTML={{
            __html: value || '<span class="text-gray-400 italic">No content added yet</span>'
          }}
        />
      ) : (
        <div className={`text-gray-900 ${isHeaderField ? 'text-sm' : 'text-sm'} whitespace-pre-wrap`}>
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