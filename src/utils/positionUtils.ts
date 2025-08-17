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
  displayedWidth: number, 
  displayedHeight: number
): PercentagePosition => {
  if (displayedWidth <= 0 || displayedHeight <= 0) {
    console.warn('Invalid displayed image dimensions:', { displayedWidth, displayedHeight });
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  return {
    x: Math.round((position.x / displayedWidth) * 100 * 100) / 100, // Round to 2 decimal places
    y: Math.round((position.y / displayedHeight) * 100 * 100) / 100,
    width: Math.round((position.width / displayedWidth) * 100 * 100) / 100,
    height: Math.round((position.height / displayedHeight) * 100 * 100) / 100
  };
};

/**
 * Convert percentage positions to pixel positions relative to displayed image dimensions
 */
export const percentagesToPixels = (
  position: PercentagePosition, 
  displayedWidth: number, 
  displayedHeight: number
): Position => {
  if (displayedWidth <= 0 || displayedHeight <= 0) {
    console.warn('Invalid displayed image dimensions:', { displayedWidth, displayedHeight });
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const result = {
    x: Math.round((position.x / 100) * displayedWidth),
    y: Math.round((position.y / 100) * displayedHeight),
    width: Math.round((position.width / 100) * displayedWidth),
    height: Math.round((position.height / 100) * displayedHeight)
  };

  // Debug position calculation
  console.log('Position Calculation:', {
    input: position,
    displayedDimensions: { width: displayedWidth, height: displayedHeight },
    output: result,
    calculation: {
      x: `${position.x}% × ${displayedWidth}px = ${result.x}px`,
      y: `${position.y}% × ${displayedHeight}px = ${result.y}px`,
      width: `${position.width}% × ${displayedWidth}px = ${result.width}px`,
      height: `${position.height}% × ${displayedHeight}px = ${result.height}px`
    }
  });

  return result;
};

/**
 * Convert all field positions from pixels to percentages
 */
export const convertFieldPositionsToPercentages = (
  fieldPositions: { [key: string]: Position },
  displayedWidth: number,
  displayedHeight: number
): { [key: string]: PercentagePosition } => {
  const convertedPositions: { [key: string]: PercentagePosition } = {};
  
  Object.entries(fieldPositions).forEach(([fieldId, position]) => {
    convertedPositions[fieldId] = pixelsToPercentages(position, displayedWidth, displayedHeight);
  });
  
  return convertedPositions;
};

/**
 * Convert all field positions from percentages to pixels
 */
export const convertFieldPositionsToPixels = (
  fieldPositions: { [key: string]: PercentagePosition },
  displayedWidth: number,
  displayedHeight: number
): { [key: string]: Position } => {
  const convertedPositions: { [key: string]: Position } = {};
  
  Object.entries(fieldPositions).forEach(([fieldId, position]) => {
    convertedPositions[fieldId] = percentagesToPixels(position, displayedWidth, displayedHeight);
  });
  
  return convertedPositions;
}; 