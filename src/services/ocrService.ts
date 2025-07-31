import Tesseract from 'tesseract.js';

export interface DetectedField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'date';
  label: string;
  placeholder?: string;
  required: boolean;
  position: { x: number; y: number; width: number; height: number };
}

export interface OCRResult {
  text: string;
  fields: DetectedField[];
  confidence: number;
}

class OCRService {
  private static instance: OCRService;

  private constructor() {}

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Extract text and word positions from image using Tesseract.js
   */
  public async extractTextWithPositions(imageUrl: string): Promise<{ text: string; words: any[] }> {
    try {
      console.log('Starting OCR processing with position detection...');
      
      const result = await Tesseract.recognize(
        imageUrl,
        'eng', // English language
        {
          logger: (m) => console.log('OCR Progress:', m)
        }
      );

      console.log('OCR completed successfully');
      
      // For now, return empty words array and use fallback positioning
      // We'll implement better position detection in the next iteration
      return {
        text: result.data.text,
        words: []
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Detect form fields with actual positions from OCR data
   */
  public detectFormFieldsWithPositions(text: string, words: any[]): DetectedField[] {
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
            label: trimmedLine.replace(/[:\-]/g, '').trim(),
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
   */
  public async extractText(imageUrl: string): Promise<string> {
    const result = await this.extractTextWithPositions(imageUrl);
    return result.text;
  }

  /**
   * Legacy method for backward compatibility
   */
  public detectFormFields(text: string): DetectedField[] {
    return this.detectFormFieldsFallback(text);
  }

  /**
   * Process image and return OCR result with detected fields
   */
  public async processImage(imageUrl: string): Promise<OCRResult> {
    try {
      const { text, words } = await this.extractTextWithPositions(imageUrl);
      const fields = this.detectFormFieldsWithPositions(text, words);

      return {
        text,
        fields,
        confidence: 0.8
      };
    } catch (error) {
      console.error('Image processing failed:', error);
      throw error;
    }
  }
}

export default OCRService; 