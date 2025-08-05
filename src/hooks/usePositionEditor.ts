import { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Field {
  id: string;
  position?: Position;
}

interface Template {
  fieldPositions?: {[key: string]: Position};
  imageWidth?: number;
  imageHeight?: number;
}

interface PositionEditorProps {
  isEditing: boolean;
  template: Template;
  onTemplateUpdate: (updatedTemplate: Template) => void;
}

export const usePositionEditor = ({ isEditing, template, onTemplateUpdate }: PositionEditorProps) => {
  const [resizing, setResizing] = useState<{fieldId: string, handle: string} | null>(null);

  // Refs to store event listener functions for proper cleanup
  const mouseMoveListenerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpListenerRef = useRef<(() => void) | null>(null);

  // Cleanup event listeners when component unmounts
  useEffect(() => {
    return () => {
      if (mouseMoveListenerRef.current) {
        document.removeEventListener('mousemove', mouseMoveListenerRef.current);
      }
      if (mouseUpListenerRef.current) {
        document.removeEventListener('mouseup', mouseUpListenerRef.current);
      }
    };
  }, []);

  // Cleanup event listeners when editing stops
  useEffect(() => {
    if (!isEditing) {
      if (mouseMoveListenerRef.current) {
        document.removeEventListener('mousemove', mouseMoveListenerRef.current);
        mouseMoveListenerRef.current = null;
      }
      if (mouseUpListenerRef.current) {
        document.removeEventListener('mouseup', mouseUpListenerRef.current);
        mouseUpListenerRef.current = null;
      }
      setResizing(null);
    }
  }, [isEditing]);

  // Get current field positions from template
  const getFieldPositions = () => {
    // Use the current template state, not the original template parameter
    // This ensures we get the latest positions after updates
    return template.fieldPositions || {};
  };

  // Update field position in template (single source of truth)
  const updateFieldPosition = (fieldId: string, newPosition: Position) => {
    const updatedTemplate = {
      ...template,
      fieldPositions: {
        ...getFieldPositions(),
        [fieldId]: newPosition
      }
    };
    onTemplateUpdate(updatedTemplate);
  };

  // Get position for a specific field
  const getFieldPosition = (fieldId: string): Position => {
    const positions = getFieldPositions();
    return positions[fieldId] || { x: 100, y: 100, width: 250, height: 40 };
  };

  // Get drag sensitivity for different template types
  const getDragSensitivity = (fieldId: string): number => {
    const positions = getFieldPositions();
    const position = positions[fieldId];
    
    // If this looks like a saved template (percentages), reduce sensitivity
    const isPercentage = position && 
                        position.x >= 0 && position.x <= 100 && 
                        position.y >= -100 && position.y <= 100 &&
                        position.width > 0 && position.width <= 100 && 
                        position.height > 0 && position.height <= 100;
    
    if (isPercentage && template.imageWidth && template.imageHeight) {
      // Very slow movement for saved templates
      return 0.02; // 2% of mouse movement for very precise control
    }
    
    return 0.1; // 10% of mouse movement for OCR templates
  };







  // Handle mouse drag for positioning
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    if (!isEditing || resizing) return;
    
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getFieldPosition(fieldId);
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Apply sensitivity scaling for smoother movement
      const sensitivity = getDragSensitivity(fieldId);
      const scaledDeltaX = deltaX * sensitivity;
      const scaledDeltaY = deltaY * sensitivity;
      
      updateFieldPosition(fieldId, {
        ...startPos,
        x: startPos.x + scaledDeltaX,
        y: startPos.y + scaledDeltaY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      mouseMoveListenerRef.current = null;
      mouseUpListenerRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    mouseMoveListenerRef.current = handleMouseMove;
    mouseUpListenerRef.current = handleMouseUp;
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, fieldId: string, handle: string) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    setResizing({ fieldId, handle });
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = getFieldPosition(fieldId);
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Apply sensitivity scaling for smoother resizing
      const sensitivity = getDragSensitivity(fieldId);
      const scaledDeltaX = deltaX * sensitivity;
      const scaledDeltaY = deltaY * sensitivity;
      
      const newPosition = calculateNewPosition(startPos, handle, scaledDeltaX, scaledDeltaY);
      updateFieldPosition(fieldId, newPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      mouseMoveListenerRef.current = null;
      mouseUpListenerRef.current = null;
      setResizing(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    mouseMoveListenerRef.current = handleMouseMove;
    mouseUpListenerRef.current = handleMouseUp;
  };

  // Calculate new position based on resize handle
  const calculateNewPosition = (startPos: Position, handle: string, deltaX: number, deltaY: number): Position => {
    switch (handle) {
      case 'nw':
        return {
          x: startPos.x + deltaX,
          y: startPos.y + deltaY,
          width: startPos.width - deltaX,
          height: startPos.height - deltaY
        };
      case 'ne':
        return {
          x: startPos.x,
          y: startPos.y + deltaY,
          width: startPos.width + deltaX,
          height: startPos.height - deltaY
        };
      case 'sw':
        return {
          x: startPos.x + deltaX,
          y: startPos.y,
          width: startPos.width - deltaX,
          height: startPos.height + deltaY
        };
      case 'se':
        return {
          x: startPos.x,
          y: startPos.y,
          width: startPos.width + deltaX,
          height: startPos.height + deltaY
        };
      case 'n':
        return {
          x: startPos.x,
          y: startPos.y + deltaY,
          width: startPos.width,
          height: startPos.height - deltaY
        };
      case 's':
        return {
          x: startPos.x,
          y: startPos.y,
          width: startPos.width,
          height: startPos.height + deltaY
        };
      case 'w':
        return {
          x: startPos.x + deltaX,
          y: startPos.y,
          width: startPos.width - deltaX,
          height: startPos.height
        };
      case 'e':
        return {
          x: startPos.x,
          y: startPos.y,
          width: startPos.width + deltaX,
          height: startPos.height
        };
      default:
        return startPos;
    }
  };

  return {
    getFieldPositions,
    getFieldPosition,
    handleMouseDown,
    handleResizeStart,
    resizing
  };
}; 