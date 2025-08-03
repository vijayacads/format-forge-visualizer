import { Position } from '@/types';

/**
 * Convert pixel positions to percentage positions based on container dimensions
 */
export const pixelsToPercentages = (
  position: Position, 
  containerWidth: number, 
  containerHeight: number
): Position => {
  return {
    ...position,
    xPercent: (position.x / containerWidth) * 100,
    yPercent: (position.y / containerHeight) * 100,
    widthPercent: (position.width / containerWidth) * 100,
    heightPercent: (position.height / containerHeight) * 100,
  };
};

/**
 * Convert percentage positions to pixel positions based on container dimensions
 */
export const percentagesToPixels = (
  position: Position, 
  containerWidth: number, 
  containerHeight: number
): Position => {
  // If we have percentage values, use them; otherwise use existing pixel values
  const x = position.xPercent !== undefined 
    ? (position.xPercent / 100) * containerWidth 
    : position.x;
  
  const y = position.yPercent !== undefined 
    ? (position.yPercent / 100) * containerHeight 
    : position.y;
  
  const width = position.widthPercent !== undefined 
    ? (position.widthPercent / 100) * containerWidth 
    : position.width;
  
  const height = position.heightPercent !== undefined 
    ? (position.heightPercent / 100) * containerHeight 
    : position.height;

  return {
    x,
    y,
    width,
    height,
    xPercent: position.xPercent,
    yPercent: position.yPercent,
    widthPercent: position.widthPercent,
    heightPercent: position.heightPercent,
  };
};

/**
 * Get the effective pixel position for rendering, using percentages if available
 */
export const getEffectivePosition = (
  position: Position,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number; width: number; height: number } => {
  const pixelPosition = percentagesToPixels(position, containerWidth, containerHeight);
  return {
    x: pixelPosition.x,
    y: pixelPosition.y,
    width: pixelPosition.width,
    height: pixelPosition.height,
  };
};

/**
 * Check if a position has percentage values
 */
export const hasPercentageValues = (position: Position): boolean => {
  return position.xPercent !== undefined || 
         position.yPercent !== undefined || 
         position.widthPercent !== undefined || 
         position.heightPercent !== undefined;
};

/**
 * Migrate existing pixel-based positions to percentage-based positions
 */
export const migrateToPercentages = (
  positions: { [key: string]: Position },
  containerWidth: number,
  containerHeight: number
): { [key: string]: Position } => {
  const migrated: { [key: string]: Position } = {};
  
  Object.entries(positions).forEach(([fieldId, position]) => {
    // Only migrate if not already migrated
    if (!hasPercentageValues(position)) {
      migrated[fieldId] = pixelsToPercentages(position, containerWidth, containerHeight);
    } else {
      migrated[fieldId] = position;
    }
  });
  
  return migrated;
}; 