import { Template, Position } from '@/types';
import { migrateToPercentages } from './positionUtils';

/**
 * Migrate existing templates to use percentage-based positioning
 */
export const migrateTemplatesToPercentages = (templates: Template[]): Template[] => {
  return templates.map(template => {
    if (!template.fieldPositions) {
      return template;
    }

    // Use default container dimensions for migration
    // These should match the original dimensions when positions were created
    const defaultContainerWidth = 800;
    const defaultContainerHeight = 600;

    const migratedPositions = migrateToPercentages(
      template.fieldPositions,
      defaultContainerWidth,
      defaultContainerHeight
    );

    return {
      ...template,
      fieldPositions: migratedPositions
    };
  });
};

/**
 * Check if templates need migration to percentage-based positioning
 */
export const needsMigration = (templates: Template[]): boolean => {
  return templates.some(template => {
    if (!template.fieldPositions) {
      return false;
    }

    // Check if any position has percentage values
    return Object.values(template.fieldPositions).some((position: Position) => {
      return position.xPercent === undefined && 
             position.yPercent === undefined && 
             position.widthPercent === undefined && 
             position.heightPercent === undefined;
    });
  });
};

/**
 * Migrate templates in localStorage
 */
export const migrateLocalStorageTemplates = (): void => {
  try {
    const savedTemplates = localStorage.getItem('savedTemplates');
    if (!savedTemplates) {
      return;
    }

    const templates: Template[] = JSON.parse(savedTemplates);
    
    if (needsMigration(templates)) {
      console.log('Migrating templates to percentage-based positioning...');
      const migratedTemplates = migrateTemplatesToPercentages(templates);
      localStorage.setItem('savedTemplates', JSON.stringify(migratedTemplates));
      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.error('Error during template migration:', error);
  }
}; 