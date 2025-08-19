import { Template, FormField } from '@/types';

// Test templates that can be used without database
export const TEST_TEMPLATES: Template[] = [
  {
    id: 'test-template-1',
    name: 'Test Invoice Template',
    type: 'invoice',
    imageUrl: null,
    imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxOTIwIiB2aWV3Qm94PSIwIDAgMTA4MCAxOTIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxOTIwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSI1NDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJibGFjayIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGVzdCBJbnZvaWNlPC90ZXh0Pgo8L3N2Zz4K',
    imageWidth: 1080,
    imageHeight: 1920,
    fieldPositions: {
      'email': { x: 10, y: 10, width: 200, height: 30 },
      'field_0': { x: 20, y: 50, width: 300, height: 40 },
      'field_1': { x: 20, y: 100, width: 300, height: 40 },
      'field_2': { x: 20, y: 150, width: 300, height: 40 }
    },
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'test-template-2',
    name: 'Test Receipt Template',
    type: 'receipt',
    imageUrl: null,
    imageData: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxOTIwIiB2aWV3Qm94PSIwIDAgMTA4MCAxOTIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTA4MCIgaGVpZ2h0PSIxOTIwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSI1NDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJibGFjayIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VGVzdCBSZWNlaXB0PC90ZXh0Pgo8L3N2Zz4K',
    imageWidth: 1080,
    imageHeight: 1920,
    fieldPositions: {
      'email': { x: 10, y: 10, width: 200, height: 30 },
      'field_0': { x: 20, y: 50, width: 300, height: 40 },
      'field_1': { x: 20, y: 100, width: 300, height: 40 }
    },
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const TEST_FIELDS: FormField[] = [
  {
    id: 'email',
    label: 'Email',
    type: 'text',
    value: 'test@example.com',
    required: true
  },
  {
    id: 'field_0',
    label: 'Company Name',
    type: 'text',
    value: 'Test Company Inc.',
    required: false
  },
  {
    id: 'field_1',
    label: 'Invoice Number',
    type: 'text',
    value: 'INV-2024-001',
    required: false
  },
  {
    id: 'field_2',
    label: 'Amount',
    type: 'text',
    value: '$1,000.00',
    required: false
  }
];

// Mock service for testing without database
export class MockSupabaseService {
  async getTemplates(): Promise<Template[]> {
    return TEST_TEMPLATES;
  }

  async getTemplateById(id: string): Promise<Template | null> {
    return TEST_TEMPLATES.find(t => t.id === id) || null;
  }

  async createFormSubmission(templateId: string, email: string, formData: any): Promise<any> {
    console.log('Mock: Creating form submission', { templateId, email, formData });
    return {
      id: 'mock-submission-' + Date.now(),
      template_id: templateId,
      email,
      form_data: formData,
      created_at: new Date().toISOString()
    };
  }
}
