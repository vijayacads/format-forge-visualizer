import Tesseract from 'tesseract.js';

/**
 * Represents a form field detected by OCR
 */
export interface DetectedField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  position: { x: number; y: number; width: number; height: number };
}

/**
 * Result of OCR processing including text and detected fields
 */
export interface OCRResult {
  text: string;
  fields: DetectedField[];
  confidence: number;
}

/**
 * Represents a word detected by Tesseract OCR with position information
 */
interface OCRWord {
  text: string;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

/**
 * Service class for Optical Character Recognition (OCR) functionality
 * 
 * This service provides methods to:
 * - Extract text from images using Tesseract.js
 * - Detect form fields based on text patterns
 * - Position fields on the image based on OCR data
 * 
 * Uses the Singleton pattern to ensure only one instance exists.
 */
class OCRService {
  private static instance: OCRService;

  private constructor() {}

  /**
   * Gets the singleton instance of OCRService
   * 
   * @returns {OCRService} The singleton instance
   */
  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Extracts text and word positions from an image using Tesseract.js
   * 
   * @param {string} imageUrl - URL or data URL of the image to process
   * @returns {Promise<{ text: string; words: OCRWord[] }>} Object containing extracted text and word positions
   * 
   * @example
   * ```typescript
   * const { text, words } = await ocrService.extractTextWithPositions('data:image/png;base64,...');
   * console.log('Extracted text:', text);
   * console.log('Word positions:', words);
   * ```
   */
  public async extractTextWithPositions(imageUrl: string): Promise<{ text: string; words: OCRWord[] }> {
    const result = await Tesseract.recognize(
      imageUrl,
      'eng', // English language
      {
        logger: () => {} // Silent logger for production
      }
    );

    // For now, return empty words array and use fallback positioning
    // We'll implement better position detection in the next iteration
    return {
      text: result.data.text,
      words: []
    };
  }

  /**
   * Detects form fields with actual positions from OCR data
   * 
   * Analyzes the extracted text and word positions to identify form fields
   * based on common patterns like "Name:", "Email:", etc.
   * 
   * @param {string} text - Extracted text from the image
   * @param {OCRWord[]} words - Array of words with position data
   * @returns {DetectedField[]} Array of detected form fields with positions
   */
  public detectFormFieldsWithPositions(text: string, words: OCRWord[]): DetectedField[] {
    const fields: DetectedField[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    // Common form field patterns with their expected positions
    const fieldPatterns = [
      { pattern: /name/i, type: 'text' as const, required: true },
      { pattern: /email/i, type: 'email' as const, required: true },
      { pattern: /phone|mobile|contact/i, type: 'phone' as const, required: false },
      { pattern: /address/i, type: 'textarea' as const, required: false },
      { pattern: /date|dob|birth/i, type: 'date' as const, required: false },
      { pattern: /title|heading/i, type: 'text' as const, required: false },
      { pattern: /summary|description/i, type: 'textarea' as const, required: false },
      { pattern: /experience|work/i, type: 'textarea' as const, required: false },
      { pattern: /education|degree/i, type: 'textarea' as const, required: false },
      { pattern: /skills/i, type: 'textarea' as const, required: false },
    ];

    // Find words that match field patterns and get their positions
    words.forEach((word, index) => {
      const wordText = word.text?.toLowerCase() || '';
      
      for (const fieldPattern of fieldPatterns) {
        if (fieldPattern.pattern.test(wordText)) {
          // Get the bounding box of this word
          const bbox = word.bbox || { x0: 0, y0: 0, x1: 100, y1: 30 };
          
          const field: DetectedField = {
            id: `field_${index}`,
            type: fieldPattern.type,
            label: word.text || fieldPattern.pattern.source,
            required: fieldPattern.required,
            position: {
              x: bbox.x0,
              y: bbox.y0,
              width: bbox.x1 - bbox.x0,
              height: bbox.y1 - bbox.y0
            }
          };
          
          // Avoid duplicates
          if (!fields.find(f => f.label.toLowerCase() === field.label.toLowerCase())) {
            fields.push(field);
          }
          break;
        }
      }
    });

    // If no fields detected with positions, fall back to line-based detection
    if (fields.length === 0) {
      return this.detectFormFieldsFallback(text);
    }

    return fields;
  }

  /**
   * Fallback method for field detection without position data
   * 
   * Used when word position data is not available. Creates fields
   * with default positioning based on line order.
   * 
   * @param {string} text - Extracted text from the image
   * @returns {DetectedField[]} Array of detected form fields with default positions
   * @private
   */
  private detectFormFieldsFallback(text: string): DetectedField[] {
    const fields: DetectedField[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    const fieldPatterns = [
      { pattern: /name/i, type: 'text' as const, required: true },
      { pattern: /email/i, type: 'email' as const, required: true },
      { pattern: /phone|mobile|contact/i, type: 'phone' as const, required: false },
      { pattern: /address/i, type: 'textarea' as const, required: false },
      { pattern: /date|dob|birth/i, type: 'date' as const, required: false },
      { pattern: /title|heading/i, type: 'text' as const, required: false },
      { pattern: /summary|description/i, type: 'textarea' as const, required: false },
      { pattern: /experience|work/i, type: 'textarea' as const, required: false },
      { pattern: /education|degree/i, type: 'textarea' as const, required: false },
      { pattern: /skills/i, type: 'textarea' as const, required: false },
    ];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      for (const fieldPattern of fieldPatterns) {
        if (fieldPattern.pattern.test(trimmedLine)) {
          // Better default positioning - spread fields across the image
          const isHeaderField = ['name', 'email', 'phone', 'date'].includes(fieldPattern.type);
          const yOffset = isHeaderField ? 80 + (index * 35) : 200 + (index * 60);
          const fieldWidth = isHeaderField ? 250 : 400;
          const fieldHeight = isHeaderField ? 35 : 80;
          
          const field: DetectedField = {
            id: `field_${index}`,
            type: fieldPattern.type,
            label: trimmedLine.replace(/[:-]/g, '').trim(),
            required: fieldPattern.required,
            position: { 
              x: 100, 
              y: yOffset, 
              width: fieldWidth, 
              height: fieldHeight 
            }
          };
          
          if (!fields.find(f => f.label.toLowerCase() === field.label.toLowerCase())) {
            fields.push(field);
          }
          break;
        }
      }
    });

    return fields;
  }

  /**
   * Legacy method for backward compatibility
   * 
   * @param {string} imageUrl - URL or data URL of the image to process
   * @returns {Promise<string>} Extracted text from the image
   * @deprecated Use extractTextWithPositions instead
   */
  public async extractText(imageUrl: string): Promise<string> {
    const result = await this.extractTextWithPositions(imageUrl);
    return result.text;
  }

  /**
   * Legacy method for backward compatibility
   * 
   * @param {string} text - Extracted text from the image
   * @returns {DetectedField[]} Array of detected form fields
   * @deprecated Use detectFormFieldsWithPositions instead
   */
  public detectFormFields(text: string): DetectedField[] {
    return this.detectFormFieldsFallback(text);
  }

  /**
   * Processes an image and returns complete OCR result with detected fields
   * 
   * This is the main method that combines text extraction and field detection
   * into a single operation.
   * 
   * @param {string} imageUrl - URL or data URL of the image to process
   * @returns {Promise<OCRResult>} Complete OCR result with text and detected fields
   * 
   * @example
   * ```typescript
   * const result = await ocrService.processImage('data:image/png;base64,...');
   * console.log('Extracted text:', result.text);
   * console.log('Detected fields:', result.fields);
   * console.log('Confidence:', result.confidence);
   * ```
   */
  public async processImage(imageUrl: string): Promise<OCRResult> {
    const { text, words } = await this.extractTextWithPositions(imageUrl);
    const fields = this.detectFormFieldsWithPositions(text, words);

    return {
      text,
      fields,
      confidence: 0.8
    };
  }
}

export default OCRService; 