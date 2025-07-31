import { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PositionEditorProps {
  isEditing: boolean;
  onPositionsChange?: (positions: {[key: string]: Position}) => void;
}

export const usePositionEditor = ({ isEditing, onPositionsChange }: PositionEditorProps) => {
  const [fieldPositions, setFieldPositions] = useState<{[key: string]: Position}>({});
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

  // Initialize field positions
  const initializePositions = (fields: any[], template: any) => {
    if (fields.length > 0 && !Object.keys(fieldPositions).length) {
      const initialPositions: {[key: string]: Position} = {};
      fields.forEach(field => {
        const savedPosition = template.fieldPositions?.[field.id];
        const position = savedPosition || field.position || { x: 100, y: 100, width: 250, height: 40 };
        initialPositions[field.id] = position;
      });
      setFieldPositions(initialPositions);
    }
  };

  // Handle field position updates
  const updateFieldPosition = (fieldId: string, newPosition: Position) => {
    const updatedPositions = {
      ...fieldPositions,
      [fieldId]: newPosition
    };
    setFieldPositions(updatedPositions);
    
    if (onPositionsChange) {
      onPositionsChange(updatedPositions);
    }
  };

  // Handle mouse drag for positioning
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    if (!isEditing || resizing) return;
    
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = fieldPositions[fieldId] || { x: 0, y: 0, width: 250, height: 40 };
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      updateFieldPosition(fieldId, {
        ...startPos,
        x: startPos.x + deltaX,
        y: startPos.y + deltaY
      });
    };
    
    const handleMouseUp = () => {
      if (mouseMoveListenerRef.current) {
        document.removeEventListener('mousemove', mouseMoveListenerRef.current);
        mouseMoveListenerRef.current = null;
      }
      if (mouseUpListenerRef.current) {
        document.removeEventListener('mouseup', mouseUpListenerRef.current);
        mouseUpListenerRef.current = null;
      }
    };
    
    // Store references to the listener functions
    mouseMoveListenerRef.current = handleMouseMove;
    mouseUpListenerRef.current = handleMouseUp;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle resize functionality
  const handleResizeStart = (e: React.MouseEvent, fieldId: string, handle: string) => {
    if (!isEditing) return;
    
    e.preventDefault();
    e.stopPropagation();
    setResizing({ fieldId, handle });
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = fieldPositions[fieldId] || { x: 0, y: 0, width: 250, height: 40 };
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      let newPosition = { ...startPos };
      
      // Handle different resize directions
      switch (handle) {
        case 'nw': // top-left
          newPosition.x = startPos.x + deltaX;
          newPosition.y = startPos.y + deltaY;
          newPosition.width = startPos.width - deltaX;
          newPosition.height = startPos.height - deltaY;
          break;
        case 'ne': // top-right
          newPosition.y = startPos.y + deltaY;
          newPosition.width = startPos.width + deltaX;
          newPosition.height = startPos.height - deltaY;
          break;
        case 'sw': // bottom-left
          newPosition.x = startPos.x + deltaX;
          newPosition.width = startPos.width - deltaX;
          newPosition.height = startPos.height + deltaY;
          break;
        case 'se': // bottom-right
          newPosition.width = startPos.width + deltaX;
          newPosition.height = startPos.height + deltaY;
          break;
        case 'n': // top edge
          newPosition.y = startPos.y + deltaY;
          newPosition.height = startPos.height - deltaY;
          break;
        case 's': // bottom edge
          newPosition.height = startPos.height + deltaY;
          break;
        case 'e': // right edge
          newPosition.width = startPos.width + deltaX;
          break;
        case 'w': // left edge
          newPosition.x = startPos.x + deltaX;
          newPosition.width = startPos.width - deltaX;
          break;
      }
      
      // Ensure minimum size
      newPosition.width = Math.max(newPosition.width, 100);
      newPosition.height = Math.max(newPosition.height, 30);
      
      updateFieldPosition(fieldId, newPosition);
    };
    
    const handleMouseUp = () => {
      if (mouseMoveListenerRef.current) {
        document.removeEventListener('mousemove', mouseMoveListenerRef.current);
        mouseMoveListenerRef.current = null;
      }
      if (mouseUpListenerRef.current) {
        document.removeEventListener('mouseup', mouseUpListenerRef.current);
        mouseUpListenerRef.current = null;
      }
      setResizing(null);
    };
    
    // Store references to the listener functions
    mouseMoveListenerRef.current = handleMouseMove;
    mouseUpListenerRef.current = handleMouseUp;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    fieldPositions,
    resizing,
    initializePositions,
    handleMouseDown,
    handleResizeStart
  };
}; 