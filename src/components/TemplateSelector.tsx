
import { Template } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit2, Move } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import React from "react";
import TemplateIcon from './TemplateIcon';

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  savedTemplates?: Template[];
  onDeleteTemplate?: (templateId: string) => void;
  isAdmin?: boolean;
  onRenameTemplate?: (templateId: string, newName: string) => void;
  onReorderTemplates?: (templates: Template[]) => void;
}

const TemplateSelector = ({ 
  onSelectTemplate,
  savedTemplates = [],
  onDeleteTemplate,
  isAdmin,
  onRenameTemplate,
  onReorderTemplates
}: TemplateSelectorProps) => {
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isEditingPositions, setIsEditingPositions] = useState(false);
  const [draggedTemplateId, setDraggedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>(savedTemplates);

  // Update local templates when savedTemplates prop changes
  React.useEffect(() => {
    setTemplates(savedTemplates);
  }, [savedTemplates]);

  const handleRename = (templateId: string) => {
    setRenamingTemplateId(templateId);
    setNewTemplateName(savedTemplates.find(t => t.id === templateId)?.name || '');
  };

  const handleSaveRename = () => {
    if (renamingTemplateId && newTemplateName.trim()) {
      onRenameTemplate?.(renamingTemplateId, newTemplateName.trim());
      setRenamingTemplateId(null);
      setNewTemplateName('');
    }
  };

  const handleDragStart = (e: React.DragEvent, templateId: string) => {
    setDraggedTemplateId(templateId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTemplateId: string) => {
    if (!draggedTemplateId || draggedTemplateId === targetTemplateId) return;
    
    e.preventDefault();
    
    const draggedIndex = templates.findIndex(t => t.id === draggedTemplateId);
    const targetIndex = templates.findIndex(t => t.id === targetTemplateId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newTemplates = [...templates];
    const [draggedTemplate] = newTemplates.splice(draggedIndex, 1);
    newTemplates.splice(targetIndex, 0, draggedTemplate);
    
    setTemplates(newTemplates);
    setDraggedTemplateId(null);
  };

  const handleDragEnd = () => {
    setDraggedTemplateId(null);
  };

  const handleSavePositions = () => {
    setIsEditingPositions(false);
    onReorderTemplates?.(templates);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Choose a Template</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Templates */}
          {savedTemplates.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Templates</h3>
                {isAdmin && (
                  <div className="flex gap-2">
                    {isEditingPositions ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSavePositions}
                        >
                          Save Order
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setIsEditingPositions(false)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPositions(true)}
                      >
                        Edit Order
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {isEditingPositions && (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Edit Mode:</strong> 
                    <br/>• <strong>Drag templates</strong> to reorder them
                    <br/>• Click <strong>Save Order</strong> to keep changes or <strong>Cancel</strong> to discard
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {templates.map((template, index) => (
                  <Card 
                    key={template.id}
                    className={`w-64 cursor-pointer hover:shadow-md transition-all duration-200 border-2 hover:border-green-300 relative ${
                      isEditingPositions ? 'cursor-move' : ''
                    } ${
                      draggedTemplateId === template.id ? 'opacity-50 scale-95' : ''
                    }`}
                    onClick={(e) => {
                      // Only navigate if not in editing mode and not clicking on admin buttons
                      if (!isEditingPositions && !e.defaultPrevented) {
                        onSelectTemplate(template);
                      }
                    }}
                    draggable={isEditingPositions}
                    onDragStart={(e) => handleDragStart(e, template.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, template.id)}
                    onDragEnd={handleDragEnd}
                  >
                      {isAdmin && (
                        <div className="absolute top-2 right-2 z-10 flex gap-1">
                          {isEditingPositions ? (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-8 h-8 p-0 cursor-move"
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                <Move className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditingPositions(false);
                                }}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Dialog 
                                open={renamingTemplateId === template.id} 
                                onOpenChange={(open) => {
                                  if (!open) {
                                    setRenamingTemplateId(null);
                                    setNewTemplateName('');
                                  }
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-8 h-8 p-0"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRename(template.id);
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rename Template</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="templateName">Template Name</Label>
                                      <Input
                                        id="templateName"
                                        value={newTemplateName}
                                        onChange={(e) => setNewTemplateName(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleSaveRename();
                                          }
                                        }}
                                        placeholder="Enter template name"
                                        autoFocus
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <Button variant="outline" onClick={() => setRenamingTemplateId(null)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleSaveRename}>
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditingPositions(true);
                                }}
                              >
                                <Move className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="w-8 h-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteTemplate?.(template.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                      <CardContent className="p-4 flex flex-col items-center">
                        <TemplateIcon template={template} size={120} className="mb-3" />
                        <h3 className="font-medium text-center">{template.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Template</p>
                        {isAdmin && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono">
                            ID: {template.id}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No templates available. Upload a template image in Admin mode to get started.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateSelector;
