import React from 'react';

interface ResizeHandlesProps {
  fieldId: string;
  position: { x: number; y: number; width: number; height: number };
  isEditing: boolean;
  onResizeStart: (e: React.MouseEvent, fieldId: string, handle: string) => void;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({
  fieldId,
  position,
  isEditing,
  onResizeStart
}) => {
  if (!isEditing) return null;
  
  const handleStyle = "absolute w-2 h-2 bg-white rounded cursor-pointer shadow-sm";
  
  return (
    <>
      {/* Corner handles */}
      <div 
        className={`${handleStyle} -top-1 -left-1 cursor-nw-resize`}
        onMouseDown={(e) => onResizeStart(e, fieldId, 'nw')}
      />
      <div 
        className={`${handleStyle} -top-1 -right-1 cursor-ne-resize`}
        onMouseDown={(e) => onResizeStart(e, fieldId, 'ne')}
      />
      <div 
        className={`${handleStyle} -bottom-1 -left-1 cursor-sw-resize`}
        onMouseDown={(e) => onResizeStart(e, fieldId, 'sw')}
      />
      <div 
        className={`${handleStyle} -bottom-1 -right-1 cursor-se-resize`}
        onMouseDown={(e) => onResizeStart(e, fieldId, 'se')}
      />
      
      {/* Edge handles */}
      <div 
        className={`${handleStyle} top-1/2 -left-1 -translate-y-1/2 cursor-w-resize`}
        onMouseDown={(e) => onResizeStart(e, fieldId, 'w')}
      />
      <div 
        className={`${handleStyle} top-1/2 -right-1 -translate-y-1/2 cursor-e-resize`}
        onMouseDown={(e) => onResizeStart(e, fieldId, 'e')}
      />
      <div 
        className={`${handleStyle} -top-1 left-1/2 -translate-x-1/2 cursor-n-resize`}
        onMouseDown={(e) => onResizeStart(e, fieldId, 'n')}
      />
      <div 
        className={`${handleStyle} -bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize`}
        onMouseDown={(e) => onResizeStart(e, fieldId, 's')}
      />
    </>
  );
};

export default ResizeHandles; 