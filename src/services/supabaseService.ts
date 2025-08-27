import { supabase } from '@/lib/supabase';
import { Template, FormField, FormData, FormSubmission } from '@/types';
import { convertFieldPositionsToPercentages, convertFieldPositionsToPixels, PercentagePosition } from '@/utils/positionUtils';

// Admin credentials from environment variables
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'vigyanshaala@gmail.com';

export interface SupabaseTemplate {
  id: string
  name: string
  type: string
  fields: FormField[]
  field_positions: Record<string, { x: number; y: number; width: number; height: number }>
  image_url: string | null
  image_data: string | null
  image_width: number | null
  image_height: number | null
  created_at: string
  updated_at: string
  created_by: string | null
  is_public: boolean
  share_token: string | null
}

export interface TemplateShare {
  id: string
  template_id: string
  share_token: string
  created_at: string
  expires_at: string | null
  access_count: number
}

// Type for Supabase real-time payload
export interface SupabaseRealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown> | null
  old: Record<string, unknown> | null
}

class SupabaseService {
  // Template Operations
  async getTemplates(): Promise<Template[]> {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email === ADMIN_EMAIL) {
        // Admin sees all templates
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        return data ? data.map(item => this.mapSupabaseToTemplate(item)) : []
      } else {
        // Public users see only public templates
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data ? data.map(item => this.mapSupabaseToTemplate(item)) : []
      }
    } catch (error) {
      // If getUser() fails (anonymous user), fall back to public templates
      console.log('Anonymous user detected, showing public templates only');
      return await this.getPublicTemplates();
    }
  }

  async getPublicTemplates(): Promise<Template[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(this.mapSupabaseToTemplate) || []
    } catch (error) {
      console.error('Error fetching public templates:', error)
      throw error
    }
  }

  async getTemplateById(id: string): Promise<Template | null> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return data ? this.mapSupabaseToTemplate(data) : null
    } catch (error) {
      console.error('Error fetching template:', error)
      throw error
    }
  }

  async getTemplateByShareToken(shareToken: string): Promise<Template | null> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('share_token', shareToken)
        .single()

      if (error) throw error

      return data ? this.mapSupabaseToTemplate(data) : null
    } catch (error) {
      console.error('Error fetching template by share token:', error)
      throw error
    }
  }

  async createTemplate(template: Omit<Template, 'id'>): Promise<Template> {
    try {
      // Debug logs - local only
      console.log('🔍 CREATE TEMPLATE DEBUG - template:', template);
      console.log('🔍 CREATE TEMPLATE DEBUG - fieldPositions:', template.fieldPositions);

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        throw new Error('Admin access required to create templates');
      }

      // Database insert moved to beginning for testing
      const { data, error } = await supabase
        .from('templates')
        .insert({
          name: template.name,
          type: template.type,
          fields: template.fields,
          field_positions: template.fieldPositions, // Use original positions for now
          image_url: template.imageUrl,
          image_data: template.imageData,
          image_width: template.imageWidth,
          image_height: template.imageHeight,
          is_public: template.isPublic || false
        })
        .select()
        .single()

      if (error) {
        console.log('🔍 CREATE TEMPLATE DEBUG - ERROR:', error);
        throw error;
      }

      console.log('🔍 CREATE TEMPLATE DEBUG - SUCCESS - created data:', data);

      return this.mapSupabaseToTemplate(data)
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    try {
      // Debug logs - local only
      console.log('🔍 UPDATE TEMPLATE DEBUG - id:', id);
      console.log('🔍 UPDATE TEMPLATE DEBUG - updates:', updates);
      console.log('🔍 UPDATE TEMPLATE DEBUG - fieldPositions:', updates.fieldPositions);

      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        throw new Error('Admin access required to update templates');
      }

      const updateData: Record<string, unknown> = {}
      
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.type !== undefined) updateData.type = updates.type
      if (updates.fields !== undefined) updateData.fields = updates.fields
      if (updates.fieldPositions !== undefined) {
        // Check if positions are already percentages (from database)
        const firstPosition = Object.values(updates.fieldPositions)[0];
        const isAlreadyPercentage = firstPosition && 
                                   firstPosition.x >= 0 && firstPosition.x <= 100 && 
                                   firstPosition.y >= -100 && firstPosition.y <= 100 && 
                                   firstPosition.width > 0 && firstPosition.width <= 100 && 
                                   firstPosition.height > 0 && firstPosition.height <= 100;
        
        if (isAlreadyPercentage) {
          // Positions are already percentages, use them directly
          updateData.field_positions = updates.fieldPositions;
        } else {
          // Positions are pixels, convert to percentages
          const imageWidth = updates.imageWidth;
          const imageHeight = updates.imageHeight;
          
          if (imageWidth && imageHeight) {
            const percentagePositions = convertFieldPositionsToPercentages(updates.fieldPositions, imageWidth, imageHeight);
            updateData.field_positions = percentagePositions;
          } else {
            // Fallback to original positions if no image dimensions
            updateData.field_positions = updates.fieldPositions;
          }
        }
      }
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl
      if (updates.imageData !== undefined) updateData.image_data = updates.imageData
      if (updates.imageWidth !== undefined) updateData.image_width = updates.imageWidth
      if (updates.imageHeight !== undefined) updateData.image_height = updates.imageHeight
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic

      // Debug logs - local only
      console.log('🔍 DATABASE UPDATE DEBUG - updateData:', updateData);
      console.log('🔍 DATABASE UPDATE DEBUG - field_positions being saved:', updateData.field_positions);

      const { data, error } = await supabase
        .from('templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.log('🔍 DATABASE UPDATE DEBUG - ERROR:', error);
        throw error;
      }

      console.log('🔍 DATABASE UPDATE DEBUG - SUCCESS - returned data:', data);

      return this.mapSupabaseToTemplate(data)
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  }

  async renameTemplate(id: string, newName: string): Promise<Template> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .update({ name: newName })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.mapSupabaseToTemplate(data)
    } catch (error) {
      console.error('Error renaming template:', error)
      throw error
    }
  }

  // Form Submission Operations
  async createFormSubmission(templateId: string, email: string, formData: FormData): Promise<FormSubmission> {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .insert({
          template_id: templateId,
          email: email,
          form_data: formData
        })
        .select()
        .single()

      if (error) throw error

      return this.mapSupabaseToFormSubmission(data)
    } catch (error) {
      console.error('Error creating form submission:', error)
      throw error
    }
  }

  async getFormSubmissions(templateId: string): Promise<FormSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(this.mapSupabaseToFormSubmission)
    } catch (error) {
      console.error('Error fetching form submissions:', error)
      throw error
    }
  }

  async getFormSubmissionsByEmail(email: string): Promise<FormSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(this.mapSupabaseToFormSubmission)
    } catch (error) {
      console.error('Error fetching form submissions by email:', error)
      throw error
    }
  }

  private mapSupabaseToFormSubmission(data: {
    id: string
    template_id: string
    email: string
    form_data: FormData
    created_at: string
  }): FormSubmission {
    return {
      id: data.id,
      template_id: data.template_id,
      email: data.email,
      form_data: data.form_data,
      created_at: data.created_at
    }
  }

  async deleteTemplate(id: string): Promise<void> {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        throw new Error('Admin access required to delete templates');
      }

      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  }

  async toggleTemplatePublic(id: string, isPublic: boolean): Promise<Template> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .update({ is_public: isPublic })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return this.mapSupabaseToTemplate(data)
    } catch (error) {
      console.error('Error toggling template public status:', error)
      throw error
    }
  }

  // Share Operations
  async createTemplateShare(templateId: string): Promise<TemplateShare> {
    try {
      const shareToken = this.generateShareToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days expiry

      const { data, error } = await supabase
        .from('template_shares')
        .insert({
          template_id: templateId,
          share_token: shareToken,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error creating template share:', error)
      throw error
    }
  }

  async getTemplateShare(shareToken: string): Promise<TemplateShare | null> {
    try {
      const { data, error } = await supabase
        .from('template_shares')
        .select('*')
        .eq('share_token', shareToken)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error fetching template share:', error)
      throw error
    }
  }

  async incrementShareAccessCount(shareToken: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('template_shares')
        .update({ access_count: supabase.rpc('increment', { x: 1 }) })
        .eq('share_token', shareToken)

      if (error) throw error
    } catch (error) {
      console.error('Error incrementing share access count:', error)
      throw error
    }
  }

  // Utility Methods
  mapSupabaseToTemplate(data: SupabaseTemplate): Template {
    return {
      id: data.id,
      name: data.name,
      type: data.type as 'cv' | 'resume' | 'swot' | 'custom',
      fields: data.fields,
      fieldPositions: data.field_positions || {},
      layout: { sections: [] }, // Default empty layout
      imageUrl: data.image_url || null,
      imageData: data.image_data || null,
      imageWidth: data.image_width || undefined,
      imageHeight: data.image_height || undefined,
      isPublic: data.is_public
    }
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // Real-time subscriptions
  subscribeToTemplates(callback: (payload: SupabaseRealtimePayload) => void) {
    return supabase
      .channel('templates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, callback)
      .subscribe()
  }

  subscribeToTemplateShares(callback: (payload: SupabaseRealtimePayload) => void) {
    return supabase
      .channel('template_shares')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'template_shares' }, callback)
      .subscribe()
  }
}

export const supabaseService = new SupabaseService() 