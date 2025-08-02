/**
 * Utility functions for image handling
 */

/**
 * Converts an image file or URL to base64 format
 * @param file - The image file to convert
 * @returns Promise<string> - Base64 encoded image data
 */
export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => {
      reject(new Error('Failed to convert image to base64'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a blob URL to base64 format
 * @param blobUrl - The blob URL to convert
 * @returns Promise<string> - Base64 encoded image data
 */
export const convertBlobUrlToBase64 = async (blobUrl: string): Promise<string> => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert blob URL to base64'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error('Failed to fetch blob URL');
  }
};

/**
 * Checks if a string is a base64 encoded image
 * @param str - The string to check
 * @returns boolean - True if it's a base64 image
 */
export const isBase64Image = (str: string): boolean => {
  return str.startsWith('data:image/');
};

/**
 * Gets the image source URL, handling both base64 and regular URLs
 * @param imageData - The image data (base64 or URL)
 * @param imageUrl - Fallback image URL
 * @returns string - The image source URL
 */
export const getImageSource = (imageData?: string | null, imageUrl?: string | null): string | null => {
  if (imageData && isBase64Image(imageData)) {
    return imageData;
  }
  if (imageUrl) {
    return imageUrl;
  }
  return null;
}; 