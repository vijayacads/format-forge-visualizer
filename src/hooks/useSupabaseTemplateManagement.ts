import { useState, useEffect, useCallback } from 'react'
import { Template } from '@/types'
import { supabaseService } from '@/services/supabaseService'
import { useToast } from '@/components/ui/use-toast'

export const useSupabaseTemplateManagement = () => {
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const templates = await supabaseService.getTemplates()
      setSavedTemplates(templates)
    } catch (err) {
      console.error('Error loading templates:', err)
      setError('Failed to load templates')
      toast({
        title: "Error",
        description: "Failed to load templates from database.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Load templates from Supabase on component mount
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const saveTemplate = async (template: Template) => {
    try {
      const savedTemplate = await supabaseService.createTemplate(template)
      
      setSavedTemplates(prev => [savedTemplate, ...prev])
      
      toast({
        title: "Template Saved",
        description: "Your template has been saved to the cloud database.",
        variant: "default",
      })
      
      return savedTemplate
    } catch (err) {
      console.error('Error saving template:', err)
      toast({
        title: "Error",
        description: "Failed to save template to database.",
        variant: "destructive",
      })
      throw err
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      await supabaseService.deleteTemplate(templateId)
      setSavedTemplates(prev => prev.filter(template => template.id !== templateId))
      
      toast({
        title: "Template Deleted",
        description: "The template has been removed from the database.",
        variant: "default",
      })
    } catch (err) {
      console.error('Error deleting template:', err)
      toast({
        title: "Error",
        description: "Failed to delete template from database.",
        variant: "destructive",
      })
    }
  }

  const renameTemplate = async (templateId: string, newName: string) => {
    try {
      const updatedTemplate = await supabaseService.renameTemplate(templateId, newName)
      
      setSavedTemplates(prev => prev.map(template => 
        template.id === templateId ? updatedTemplate : template
      ))
      
      toast({
        title: "Template Renamed",
        description: "The template has been renamed successfully.",
        variant: "default",
      })
    } catch (err) {
      console.error('Error renaming template:', err)
      toast({
        title: "Error",
        description: "Failed to rename template in database.",
        variant: "destructive",
      })
    }
  }

  const reorderTemplates = async (reorderedTemplates: Template[]) => {
    // Note: Supabase doesn't have built-in ordering, so we'll just update local state
    // In a real app, you might want to add an 'order' field to the database
    setSavedTemplates(reorderedTemplates)
    toast({
      title: "Order Updated",
      description: "Template order has been updated locally.",
      variant: "default",
    })
  }

  const toggleTemplatePublic = async (templateId: string, isPublic: boolean) => {
    try {
      const updatedTemplate = await supabaseService.toggleTemplatePublic(templateId, isPublic)
      
      setSavedTemplates(prev => prev.map(template => 
        template.id === templateId ? updatedTemplate : template
      ))
      
      toast({
        title: isPublic ? "Template Made Public" : "Template Made Private",
        description: isPublic 
          ? "The template is now publicly accessible." 
          : "The template is now private.",
        variant: "default",
      })
    } catch (err) {
      console.error('Error toggling template public status:', err)
      toast({
        title: "Error",
        description: "Failed to update template visibility.",
        variant: "destructive",
      })
    }
  }

  const createTemplateShare = async (templateId: string) => {
    try {
      const share = await supabaseService.createTemplateShare(templateId)
      
      toast({
        title: "Share Link Created",
        description: "A share link has been created for this template.",
        variant: "default",
      })
      
      return share
    } catch (err) {
      console.error('Error creating template share:', err)
      toast({
        title: "Error",
        description: "Failed to create share link.",
        variant: "destructive",
      })
      throw err
    }
  }

  const getTemplateByShareToken = async (shareToken: string) => {
    try {
      const template = await supabaseService.getTemplateByShareToken(shareToken)
      
      if (template) {
        // Increment access count
        await supabaseService.incrementShareAccessCount(shareToken)
      }
      
      return template
    } catch (err) {
      console.error('Error fetching template by share token:', err)
      toast({
        title: "Error",
        description: "Failed to load shared template.",
        variant: "destructive",
      })
      throw err
    }
  }

  const getPublicTemplates = async () => {
    try {
      const templates = await supabaseService.getPublicTemplates()
      return templates
    } catch (err) {
      console.error('Error fetching public templates:', err)
      toast({
        title: "Error",
        description: "Failed to load public templates.",
        variant: "destructive",
      })
      throw err
    }
  }

  return {
    savedTemplates,
    isLoading,
    error,
    loadTemplates,
    saveTemplate,
    deleteTemplate,
    renameTemplate,
    reorderTemplates,
    toggleTemplatePublic,
    createTemplateShare,
    getTemplateByShareToken,
    getPublicTemplates
  }
} 