import { supabase } from '@/lib/supabase';
import { Template, FormField, FormData, FormSubmission } from '@/types';

export interface SupabaseTemplate {
  id: string
  name: string
  type: string
  fields: any
  field_positions: any
  image_url: string | null
  image_data: string | null
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

class SupabaseService {
  // Template Operations
  async getTemplates(): Promise<Template[]> {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data?.map(this.mapSupabaseToTemplate) || []
    } catch (error) {
      console.error('Error fetching templates:', error)
      throw error
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
      const { data, error } = await supabase
        .from('templates')
        .insert({
          name: template.name,
          type: template.type,
          fields: template.fields,
          field_positions: template.fieldPositions || {},
          image_url: template.imageUrl || null,
          image_data: template.imageData || null,
          is_public: false,
          share_token: this.generateShareToken()
        })
        .select()
        .single()

      if (error) throw error
      return this.mapSupabaseToTemplate(data)
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    try {
      const updateData: any = {
        name: updates.name,
        type: updates.type,
        fields: updates.fields,
        field_positions: updates.fieldPositions,
        image_url: updates.imageUrl || null,
        image_data: updates.imageData || null
      }

      const { data, error } = await supabase
        .from('templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
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

  private mapSupabaseToFormSubmission(data: any): FormSubmission {
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
      isPublic: data.is_public
    }
  }

  private generateShareToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // Real-time subscriptions
  subscribeToTemplates(callback: (payload: any) => void) {
    return supabase
      .channel('templates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'templates' }, callback)
      .subscribe()
  }

  subscribeToTemplateShares(callback: (payload: any) => void) {
    return supabase
      .channel('template_shares')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'template_shares' }, callback)
      .subscribe()
  }
}

export const supabaseService = new SupabaseService() 