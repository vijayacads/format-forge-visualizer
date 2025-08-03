import { Template } from '@/types';
import { pixelsToPercentages } from './positionUtils';

/**
 * Restore the STEM Curiosity template with percentage-based positioning
 */
export const createSTEMCuriosityTemplate = (): Template => {
  // Default container dimensions for percentage calculation
  const containerWidth = 800;
  const containerHeight = 600;

  // Create the STEM Curiosity template with pixel positions
  const stemTemplate: Template = {
    id: 'stem-curiosity-template',
    name: 'STEM Curiosity',
    type: 'custom',
    imageUrl: null,
    imageData: null,
    fields: [
      {
        id: 'name',
        label: 'Student Name',
        type: 'text',
        value: '',
        required: true,
        placeholder: 'Enter your full name'
      },
      {
        id: 'email',
        label: 'Email Address',
        type: 'email',
        value: '',
        required: true,
        placeholder: 'Enter your email address'
      },
      {
        id: 'grade',
        label: 'Grade Level',
        type: 'text',
        value: '',
        required: true,
        placeholder: 'e.g., 9th Grade, 10th Grade'
      },
      {
        id: 'school',
        label: 'School Name',
        type: 'text',
        value: '',
        required: true,
        placeholder: 'Enter your school name'
      },
      {
        id: 'project_title',
        label: 'Project Title',
        type: 'text',
        value: '',
        required: true,
        placeholder: 'Enter your project title'
      },
      {
        id: 'research_question',
        label: 'Research Question',
        type: 'richtext',
        value: '',
        required: true,
        placeholder: 'What question are you trying to answer?'
      },
      {
        id: 'hypothesis',
        label: 'Hypothesis',
        type: 'richtext',
        value: '',
        required: true,
        placeholder: 'What do you think will happen?'
      },
      {
        id: 'materials',
        label: 'Materials & Methods',
        type: 'richtext',
        value: '',
        required: true,
        placeholder: 'List materials and describe your procedure'
      },
      {
        id: 'results',
        label: 'Results & Observations',
        type: 'richtext',
        value: '',
        required: true,
        placeholder: 'What did you observe? Include data and measurements'
      },
      {
        id: 'conclusion',
        label: 'Conclusion',
        type: 'richtext',
        value: '',
        required: true,
        placeholder: 'What did you learn? Was your hypothesis correct?'
      },
      {
        id: 'reflections',
        label: 'Personal Reflections',
        type: 'richtext',
        value: '',
        required: false,
        placeholder: 'What surprised you? What would you do differently?'
      }
    ],
    fieldPositions: {
      // Convert pixel positions to percentages
      name: pixelsToPercentages({ x: 50, y: 80, width: 300, height: 35 }, containerWidth, containerHeight),
      email: pixelsToPercentages({ x: 50, y: 130, width: 300, height: 35 }, containerWidth, containerHeight),
      grade: pixelsToPercentages({ x: 50, y: 180, width: 150, height: 35 }, containerWidth, containerHeight),
      school: pixelsToPercentages({ x: 220, y: 180, width: 250, height: 35 }, containerWidth, containerHeight),
      project_title: pixelsToPercentages({ x: 50, y: 230, width: 420, height: 35 }, containerWidth, containerHeight),
      research_question: pixelsToPercentages({ x: 50, y: 280, width: 420, height: 80 }, containerWidth, containerHeight),
      hypothesis: pixelsToPercentages({ x: 50, y: 380, width: 420, height: 80 }, containerWidth, containerHeight),
      materials: pixelsToPercentages({ x: 50, y: 480, width: 420, height: 100 }, containerWidth, containerHeight),
      results: pixelsToPercentages({ x: 50, y: 600, width: 420, height: 120 }, containerWidth, containerHeight),
      conclusion: pixelsToPercentages({ x: 50, y: 740, width: 420, height: 100 }, containerWidth, containerHeight),
      reflections: pixelsToPercentages({ x: 50, y: 860, width: 420, height: 80 }, containerWidth, containerHeight)
    },
    layout: {
      sections: [
        {
          id: 'header',
          title: 'Student Information',
          fieldIds: ['name', 'email', 'grade', 'school']
        },
        {
          id: 'project',
          title: 'Project Details',
          fieldIds: ['project_title', 'research_question', 'hypothesis']
        },
        {
          id: 'methodology',
          title: 'Methodology',
          fieldIds: ['materials']
        },
        {
          id: 'findings',
          title: 'Findings',
          fieldIds: ['results', 'conclusion']
        },
        {
          id: 'reflection',
          title: 'Reflection',
          fieldIds: ['reflections']
        }
      ]
    }
  };

  return stemTemplate;
};

/**
 * Restore STEM Curiosity template to localStorage
 */
export const restoreSTEMTemplate = (): void => {
  try {
    // Get existing templates
    const existingTemplates = localStorage.getItem('savedTemplates');
    let templates: Template[] = [];
    
    if (existingTemplates) {
      templates = JSON.parse(existingTemplates);
    }
    
    // Create the STEM template
    const stemTemplate = createSTEMCuriosityTemplate();
    
    // Check if STEM template already exists
    const existingIndex = templates.findIndex(t => t.id === 'stem-curiosity-template');
    
    if (existingIndex >= 0) {
      // Update existing template
      templates[existingIndex] = stemTemplate;
      console.log('Updated existing STEM Curiosity template');
    } else {
      // Add new template
      templates.push(stemTemplate);
      console.log('Added new STEM Curiosity template');
    }
    
    // Save back to localStorage
    localStorage.setItem('savedTemplates', JSON.stringify(templates));
    console.log('STEM Curiosity template restored successfully');
    
    // Reload the page to reflect changes
    window.location.reload();
    
  } catch (error) {
    console.error('Error restoring STEM template:', error);
  }
}; 