import { useState, useEffect } from 'react'
import { Template } from '@/types'
import { supabaseService } from '@/services/supabaseService'
import { useToast } from "@/components/ui/use-toast"

export const useSupabaseTemplateManagement = () => {
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Load templates from Supabase on component mount
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
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
  }

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
        description: `Template is now ${isPublic ? 'public' : 'private'}.`,
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
      const shareUrl = `${window.location.origin}/share/${share.share_token}`
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl)
      
      toast({
        title: "Share Link Created",
        description: "Share link has been copied to clipboard.",
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
    }
  }

  const getTemplateByShareToken = async (shareToken: string) => {
    try {
      const template = await supabaseService.getTemplateByShareToken(shareToken)
      if (template) {
        await supabaseService.incrementShareAccessCount(shareToken)
      }
      return template
    } catch (err) {
      console.error('Error fetching shared template:', err)
      throw err
    }
  }

  const getPublicTemplates = async () => {
    try {
      const templates = await supabaseService.getPublicTemplates()
      return templates
    } catch (err) {
      console.error('Error fetching public templates:', err)
      throw err
    }
  }

  // Real-time subscription for live updates
  useEffect(() => {
    const subscription = supabaseService.subscribeToTemplates((payload) => {
      if (payload.eventType === 'INSERT') {
        // New template added
        const newTemplate = supabaseService.mapSupabaseToTemplate(payload.new)
        setSavedTemplates(prev => [newTemplate, ...prev])
      } else if (payload.eventType === 'UPDATE') {
        // Template updated
        const updatedTemplate = supabaseService.mapSupabaseToTemplate(payload.new)
        setSavedTemplates(prev => prev.map(template => 
          template.id === updatedTemplate.id ? updatedTemplate : template
        ))
      } else if (payload.eventType === 'DELETE') {
        // Template deleted
        setSavedTemplates(prev => prev.filter(template => template.id !== payload.old.id))
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    savedTemplates,
    isLoading,
    error,
    saveTemplate,
    deleteTemplate,
    renameTemplate,
    reorderTemplates,
    toggleTemplatePublic,
    createTemplateShare,
    getTemplateByShareToken,
    getPublicTemplates,
    refreshTemplates: loadTemplates
  }
} 