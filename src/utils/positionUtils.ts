/**
 * Simple percentage-based positioning utilities
 * Converts between pixel and percentage coordinates relative to image dimensions
 */

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PercentagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convert pixel positions to percentage positions relative to image dimensions
 */
export const pixelsToPercentages = (
  position: Position, 
  imageWidth: number, 
  imageHeight: number
): PercentagePosition => {
  if (imageWidth <= 0 || imageHeight <= 0) {
    console.warn('Invalid image dimensions:', { imageWidth, imageHeight });
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: Math.round((position.x / imageWidth) * 100 * 100) / 100, // Round to 2 decimal places
    y: Math.round((position.y / imageHeight) * 100 * 100) / 100,
    width: Math.round((position.width / imageWidth) * 100 * 100) / 100,
    height: Math.round((position.height / imageHeight) * 100 * 100) / 100
  };
};

/**
 * Convert percentage positions to pixel positions relative to image dimensions
 */
export const percentagesToPixels = (
  position: PercentagePosition, 
  imageWidth: number, 
  imageHeight: number
): Position => {
  if (imageWidth <= 0 || imageHeight <= 0) {
    console.warn('Invalid image dimensions:', { imageWidth, imageHeight });
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: Math.round((position.x / 100) * imageWidth),
    y: Math.round((position.y / 100) * imageHeight),
    width: Math.round((position.width / 100) * imageWidth),
    height: Math.round((position.height / 100) * imageHeight)
  };
};

/**
 * Convert all field positions from pixels to percentages
 */
export const convertFieldPositionsToPercentages = (
  fieldPositions: { [key: string]: Position },
  imageWidth: number,
  imageHeight: number
): { [key: string]: PercentagePosition } => {
  const convertedPositions: { [key: string]: PercentagePosition } = {};
  
  Object.entries(fieldPositions).forEach(([fieldId, position]) => {
    convertedPositions[fieldId] = pixelsToPercentages(position, imageWidth, imageHeight);
  });
  
  return convertedPositions;
};

/**
 * Convert all field positions from percentages to pixels
 */
export const convertFieldPositionsToPixels = (
  fieldPositions: { [key: string]: PercentagePosition },
  imageWidth: number,
  imageHeight: number
): { [key: string]: Position } => {
  const convertedPositions: { [key: string]: Position } = {};
  
  Object.entries(fieldPositions).forEach(([fieldId, position]) => {
    convertedPositions[fieldId] = percentagesToPixels(position, imageWidth, imageHeight);
  });
  
  return convertedPositions;
}; 