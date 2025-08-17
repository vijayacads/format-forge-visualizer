
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { FormField, Template } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { usePositionEditor } from '@/hooks/usePositionEditor';
import TemplateRenderer from './TemplateRenderer';
import { getImageSource } from '@/utils/imageUtils';
import { convertFieldPositionsToPixels, PercentagePosition } from '@/utils/positionUtils';
import { supabaseService } from '@/services/supabaseService';

interface TemplatePreviewProps {
  template: Template;
  fields: FormField[];
  onSaveTemplate?: () => void;
  onSaveAsTemplate?: () => void;
  isAdmin?: boolean;
  onTemplateUpdate?: (updatedTemplate: Template) => void;
}

const TemplatePreview = ({ template, fields, onSaveTemplate, onSaveAsTemplate, isAdmin = false, onTemplateUpdate }: TemplatePreviewProps) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [pdfMode, setPdfMode] = useState<'single-page' | 'multi-page'>('single-page');
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<Template>(template);

  // Force re-calculation when image size changes (viewport resize, mobile toggle, etc.)
  useEffect(() => {
    const handleResize = () => {
      // Force re-render when viewport changes
    };

    window.addEventListener('resize', handleResize);
    
    // Also listen for orientation changes and other viewport changes
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Sync currentTemplate with template prop changes
  useEffect(() => {
    setCurrentTemplate(template);
  }, [template]);



  const getFieldValue = (id: string) => {
    const field = fields.find(f => f.id === id);
    return field?.value || '';
  };

  // Get image container origin relative to page
  const getImageContainerOrigin = () => {
    const imageContainer = imageRef?.parentElement;
    return {
      x: imageContainer?.offsetLeft || 0,  // Distance from page left
      y: imageContainer?.offsetTop || 0    // Distance from page top
    };
  };

  // Convert percentage positions to pixels for display
  const getDisplayPositions = () => {
    const positions = currentTemplate.fieldPositions || {};
    
    if (Object.keys(positions).length > 0) {
      const firstPosition = Object.values(positions)[0];
      
      // Simple percentage detection: check if values are in percentage range
      const isPercentage = firstPosition.x >= 0 && firstPosition.x <= 100 && 
                          firstPosition.y >= -100 && firstPosition.y <= 100 && 
                          firstPosition.width > 0 && firstPosition.width <= 100 && 
                          firstPosition.height > 0 && firstPosition.height <= 100;
      
      if (isPercentage && template.imageWidth && template.imageHeight) {
        // Get displayed image dimensions (what user actually sees)
        const displayedImageWidth = imageRef?.offsetWidth || template.imageWidth;
        const displayedImageHeight = imageRef?.offsetHeight || template.imageHeight;
        
        // Debug percentage values
        console.log('🔍 PERCENTAGE VALUES:', positions);
        
        // Convert percentages to pixels using DISPLAYED dimensions
        const pixelPositions = convertFieldPositionsToPixels(
          positions,
          displayedImageWidth,    // Use displayed width instead of original
          displayedImageHeight    // Use displayed height instead of original
        );
        
        return pixelPositions;
      }
    }
    
    return positions;
  };



  // Debug image dimensions for scaling check
  useEffect(() => {
    if (imageRef) {
      console.log('📏 IMAGE SCALING DEBUG:', {
        originalDimensions: {
          width: template.imageWidth,
          height: template.imageHeight
        },
        currentDimensions: {
          width: imageRef.offsetWidth,
          height: imageRef.offsetHeight
        },
        scalingRatio: {
          width: imageRef.offsetWidth / template.imageWidth,
          height: imageRef.offsetHeight / template.imageHeight
        }
      });
    }
  }, [imageRef, template.imageWidth, template.imageHeight]);

  // Debug effect to monitor imageRef changes
  useEffect(() => {
    if (imageRef) {
      console.log('🖼️ IMAGE REF UPDATED:', {
        offsetWidth: imageRef.offsetWidth,
        offsetHeight: imageRef.offsetHeight,
        naturalWidth: imageRef.naturalWidth,
        naturalHeight: imageRef.naturalHeight
      });
      
      // Get actual rendered dimensions from webpage
      const rect = imageRef.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(imageRef);
      
      console.log('📏 ACTUAL IMAGE RENDERED DIMENSIONS:', {
        expectedDimensions: {
          width: imageRef.offsetWidth,
          height: imageRef.offsetHeight
        },
        actualRendered: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom
        },
        computedStyle: {
          width: computedStyle.width,
          height: computedStyle.height,
          objectFit: computedStyle.objectFit,
          objectPosition: computedStyle.objectPosition
        },
        difference: {
          widthDiff: rect.width - imageRef.offsetWidth,
          heightDiff: rect.height - imageRef.offsetHeight
        }
      });
    }
  }, [imageRef]);

  // Debug function to check all container dimensions
  const debugContainerDimensions = () => {
    if (!previewRef.current || !imageRef) return;
    
    const previewContainer = previewRef.current;
    const imageContainer = imageRef.parentElement;
    const scrollArea = previewContainer.closest('[data-radix-scroll-area-viewport]') as HTMLElement;
    const cardContent = (previewContainer.closest('[class*="p-6"]') || previewContainer.closest('[class*="flex-grow"]')) as HTMLElement;
    
    // Get all parent elements to trace the height difference
    let currentElement: HTMLElement | null = previewContainer;
    const parentChain = [];
    while (currentElement && currentElement !== document.body) {
      parentChain.push({
        tagName: currentElement.tagName,
        className: currentElement.className,
        offsetHeight: currentElement.offsetHeight,
        clientHeight: currentElement.clientHeight,
        scrollHeight: currentElement.scrollHeight,
        computedStyle: window.getComputedStyle(currentElement)
      });
      currentElement = currentElement.parentElement;
    }
    
    // Check for positioning context issues
    const imageOffsetLeft = imageRef.offsetLeft;
    const imageOffsetTop = imageRef.offsetTop;
    const containerWidth = imageContainer?.offsetWidth || 0;
    const containerHeight = imageContainer?.offsetHeight || 0;
    const imageWidth = imageRef.offsetWidth;
    const imageHeight = imageRef.offsetHeight;
    
    const positioningIssues = {
      hasHorizontalOffset: imageOffsetLeft > 0,
      hasVerticalOffset: imageOffsetTop > 0,
      hasWidthMismatch: containerWidth !== imageWidth,
      hasHeightMismatch: containerHeight !== imageHeight,
      horizontalGap: imageOffsetLeft,
      verticalGap: imageOffsetTop,
      widthDifference: containerWidth - imageWidth,
      heightDifference: containerHeight - imageHeight
    };
    
    console.log('🏗️ CONTAINER DIMENSIONS DEBUG:', {
      previewContainer: {
        offsetWidth: previewContainer.offsetWidth,
        offsetHeight: previewContainer.offsetHeight,
        clientWidth: previewContainer.clientWidth,
        clientHeight: previewContainer.clientHeight,
        scrollWidth: previewContainer.scrollWidth,
        scrollHeight: previewContainer.scrollHeight
      },
      imageContainer: imageContainer ? {
        offsetWidth: imageContainer.offsetWidth,
        offsetHeight: imageContainer.offsetHeight,
        clientWidth: imageContainer.clientWidth,
        clientHeight: imageContainer.clientHeight,
        className: imageContainer.className
      } : 'null',
      image: {
        offsetWidth: imageRef.offsetWidth,
        offsetHeight: imageRef.offsetHeight,
        offsetLeft: imageRef.offsetLeft,
        offsetTop: imageRef.offsetTop,
        naturalWidth: imageRef.naturalWidth,
        naturalHeight: imageRef.naturalHeight,
        className: imageRef.className
      },
      scrollArea: scrollArea ? {
        offsetWidth: scrollArea.offsetWidth,
        offsetHeight: scrollArea.offsetHeight,
        clientWidth: scrollArea.clientWidth,
        clientHeight: scrollArea.clientHeight
      } : 'null',
      cardContent: cardContent ? {
        className: cardContent.className,
        computedStyle: window.getComputedStyle(cardContent)
      } : 'null',
      parentChain: parentChain,
      positioningIssues: positioningIssues
    });
    
    // Detailed parent chain analysis
    console.log('🔍 DETAILED PARENT CHAIN ANALYSIS:');
    parentChain.forEach((element, index) => {
      const computedStyle = element.computedStyle;
      console.log(`Level ${index}:`, {
        tagName: element.tagName,
        className: element.className,
        offsetHeight: element.offsetHeight,
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        paddingTop: computedStyle.paddingTop,
        paddingBottom: computedStyle.paddingBottom,
        marginTop: computedStyle.marginTop,
        marginBottom: computedStyle.marginBottom,
        height: computedStyle.height
      });
    });
    
    // Positioning context analysis
    console.log('🎯 POSITIONING CONTEXT ANALYSIS:', {
      containerDimensions: { width: containerWidth, height: containerHeight },
      imageDimensions: { width: imageWidth, height: imageHeight },
      imageOffsets: { left: imageOffsetLeft, top: imageOffsetTop },
      issues: positioningIssues,
      conclusion: positioningIssues.hasHorizontalOffset || positioningIssues.hasVerticalOffset || 
                 positioningIssues.hasWidthMismatch || positioningIssues.hasHeightMismatch 
                 ? '⚠️ POSITIONING MISMATCH DETECTED' : '✅ POSITIONING LOOKS CORRECT'
    });
  };

  // Function to debug the entire container hierarchy
  const debugContainerHierarchy = () => {
    if (!previewRef.current) return;
    
    let currentElement: HTMLElement | null = previewRef.current;
    const hierarchy = [];
    let level = 0;
    
    // Trace up the DOM tree to find positioning issues
    while (currentElement && currentElement !== document.body && level < 20) {
      const rect = currentElement.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(currentElement);
      const offsetParent = currentElement.offsetParent as HTMLElement;
      
      hierarchy.push({
        level,
        tagName: currentElement.tagName,
        className: currentElement.className,
        id: currentElement.id,
        offsetTop: currentElement.offsetTop,
        offsetLeft: currentElement.offsetLeft,
        getBoundingClientRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        },
        computedStyle: {
          position: computedStyle.position,
          top: computedStyle.top,
          left: computedStyle.left,
          marginTop: computedStyle.marginTop,
          marginBottom: computedStyle.marginBottom,
          paddingTop: computedStyle.paddingTop,
          paddingBottom: computedStyle.paddingBottom,
          height: computedStyle.height,
          minHeight: computedStyle.minHeight,
          maxHeight: computedStyle.maxHeight,
          display: computedStyle.display,
          flexDirection: computedStyle.flexDirection,
          alignItems: computedStyle.alignItems,
          justifyContent: computedStyle.justifyContent
        },
        offsetParent: offsetParent ? {
          tagName: offsetParent.tagName,
          className: offsetParent.className,
          offsetTop: offsetParent.offsetTop,
          offsetLeft: offsetParent.offsetLeft
        } : 'null'
      });
      
      currentElement = currentElement.parentElement;
      level++;
    }
    
    console.log('🏗️ CONTAINER HIERARCHY DEBUG:');
    hierarchy.forEach((element, index) => {
      console.log(`Level ${index}:`, element);
    });
    
    // Find the source of the negative positioning
    const negativePositionedElements = hierarchy.filter(el => 
      el.getBoundingClientRect.top < 0 || el.offsetTop > 0
    );
    
    if (negativePositionedElements.length > 0) {
      console.log('🚨 ELEMENTS WITH NEGATIVE/UNEXPECTED POSITIONING:', negativePositionedElements);
    }
    
    // Check for flex layout issues
    const flexElements = hierarchy.filter(el => 
      el.computedStyle.display === 'flex' || el.computedStyle.display === 'inline-flex'
    );
    
    console.log('📐 FLEX LAYOUT ELEMENTS:', flexElements);
    
    return hierarchy;
  };

  // Function to capture and test field positions from webpage
  const captureFieldPositionsFromWebpage = () => {
    if (!imageRef) return;
    
    // Get all field elements from the DOM
    const fieldElements = document.querySelectorAll('[class*="absolute rounded"]');
    const imageRect = imageRef.getBoundingClientRect();
    
    console.log('🔍 CAPTURING FIELD POSITIONS FROM WEBPAGE:');
    console.log('Image bounds:', {
      left: imageRect.left,
      top: imageRect.top,
      width: imageRect.width,
      height: imageRect.height
    });
    
    const capturedPositions: { [key: string]: any } = {};
    
    fieldElements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      
      // Calculate position relative to image
      const relativeX = rect.left - imageRect.left;
      const relativeY = rect.top - imageRect.top;
      
      // Try to identify field by content or position
      const fieldId = `captured_field_${index}`;
      
      capturedPositions[fieldId] = {
        fieldId: fieldId,
        absolutePosition: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        },
        relativeToImage: {
          x: relativeX,
          y: relativeY,
          width: rect.width,
          height: rect.height
        },
        computedStyle: {
          transform: computedStyle.transform,
          position: computedStyle.position,
          width: computedStyle.width,
          height: computedStyle.height
        },
        content: element.textContent?.substring(0, 50) || 'No text content'
      };
      
      console.log(`📏 CAPTURED FIELD ${fieldId}:`, capturedPositions[fieldId]);
    });
    
    // Compare with calculated positions
    const calculatedPositions = getDisplayPositions();
    console.log('📊 COMPARISON - Calculated vs Captured:');
    console.log('Calculated positions:', calculatedPositions);
    console.log('Captured positions:', capturedPositions);
    
    return { calculatedPositions, capturedPositions };
  };

  // Function to debug image container positioning
  const debugImageContainerPositioning = () => {
    if (!imageRef) return;
    
    const image = imageRef;
    const imageContainer = image.parentElement;
    const previewContainer = previewRef.current;
    
    // Get all relevant element positions
    const imageRect = image.getBoundingClientRect();
    const containerRect = imageContainer?.getBoundingClientRect();
    const previewRect = previewContainer?.getBoundingClientRect();
    
    // Check scroll positions
    const scrollArea = previewContainer?.closest('[data-radix-scroll-area-viewport]') as HTMLElement;
    const scrollContainer = scrollArea?.parentElement;
    
    console.log('🖼️ IMAGE CONTAINER POSITIONING DEBUG:');
    console.log('Image element:', {
      offsetLeft: image.offsetLeft,
      offsetTop: image.offsetTop,
      offsetWidth: image.offsetWidth,
      offsetHeight: image.offsetHeight,
      getBoundingClientRect: imageRect,
      computedStyle: {
        position: window.getComputedStyle(image).position,
        top: window.getComputedStyle(image).top,
        left: window.getComputedStyle(image).left,
        transform: window.getComputedStyle(image).transform
      }
    });
    
    console.log('Image container:', {
      element: imageContainer,
      offsetLeft: imageContainer?.offsetLeft,
      offsetTop: imageContainer?.offsetTop,
      offsetWidth: imageContainer?.offsetWidth,
      offsetHeight: imageContainer?.offsetHeight,
      getBoundingClientRect: containerRect,
      computedStyle: imageContainer ? {
        position: window.getComputedStyle(imageContainer).position,
        top: window.getComputedStyle(imageContainer).top,
        left: window.getComputedStyle(imageContainer).left,
        transform: window.getComputedStyle(imageContainer).transform,
        overflow: window.getComputedStyle(imageContainer).overflow
      } : 'null'
    });
    
    console.log('Preview container:', {
      element: previewContainer,
      offsetLeft: previewContainer?.offsetLeft,
      offsetTop: previewContainer?.offsetTop,
      offsetWidth: previewContainer?.offsetWidth,
      offsetHeight: previewContainer?.offsetHeight,
      getBoundingClientRect: previewRect,
      computedStyle: previewContainer ? {
        position: window.getComputedStyle(previewContainer).position,
        top: window.getComputedStyle(previewContainer).top,
        left: window.getComputedStyle(previewContainer).left,
        transform: window.getComputedStyle(previewContainer).transform,
        overflow: window.getComputedStyle(previewContainer).overflow
      } : 'null'
    });
    
    console.log('Scroll area:', {
      element: scrollArea,
      scrollTop: scrollArea?.scrollTop,
      scrollLeft: scrollArea?.scrollLeft,
      clientHeight: scrollArea?.clientHeight,
      scrollHeight: scrollArea?.scrollHeight,
      getBoundingClientRect: scrollArea?.getBoundingClientRect(),
      computedStyle: scrollArea ? {
        position: window.getComputedStyle(scrollArea).position,
        overflow: window.getComputedStyle(scrollArea).overflow,
        transform: window.getComputedStyle(scrollArea).transform
      } : 'null'
    });

    // Debug TemplateRenderer dimensions
    const templateRenderer = document.querySelector('.absolute.inset-0') as HTMLElement;
    if (templateRenderer) {
      console.log('TemplateRenderer dimensions:', {
        offsetWidth: templateRenderer.offsetWidth,
        offsetHeight: templateRenderer.offsetHeight,
        getBoundingClientRect: templateRenderer.getBoundingClientRect(),
        computedStyle: {
          position: window.getComputedStyle(templateRenderer).position,
          top: window.getComputedStyle(templateRenderer).top,
          left: window.getComputedStyle(templateRenderer).left,
          width: window.getComputedStyle(templateRenderer).width,
          height: window.getComputedStyle(templateRenderer).height
        }
      });
    } else {
      console.log('TemplateRenderer not found');
    }
    
    // Check if image is positioned outside viewport
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    console.log('🌐 VIEWPORT ANALYSIS:', {
      viewportDimensions: { width: viewportWidth, height: viewportHeight },
      imagePosition: {
        top: imageRect.top,
        left: imageRect.left,
        bottom: imageRect.bottom,
        right: imageRect.right
      },
      isImageVisible: {
        topVisible: imageRect.top >= 0,
        leftVisible: imageRect.left >= 0,
        bottomVisible: imageRect.bottom <= viewportHeight,
        rightVisible: imageRect.right <= viewportWidth,
        fullyVisible: imageRect.top >= 0 && imageRect.left >= 0 && 
                     imageRect.bottom <= viewportHeight && imageRect.right <= viewportWidth
      },
      scrollOffset: {
        scrollTop: scrollArea?.scrollTop || 0,
        scrollLeft: scrollArea?.scrollLeft || 0
      }
    });
    
    // Check for positioning context issues
    if (imageRect.top < 0) {
      console.log('🚨 ISSUE DETECTED: Image is positioned above viewport!');
      console.log('This explains why fields appear to "shift" - they are actually positioned correctly relative to the image, but the image itself is outside the visible area.');
    }
  };

  // Call debug function when image loads
  useEffect(() => {
    if (imageLoaded && imageRef) {
      debugContainerDimensions();
    }
  }, [imageLoaded, imageRef]);


  // Use the position editor hook with currentTemplate
  const {
    getFieldPositions,
    handleMouseDown,
    handleResizeStart
  } = usePositionEditor({
    isEditing,
    template: currentTemplate, // Use currentTemplate for position editor
    onTemplateUpdate: (updatedTemplate: any) => {
      setCurrentTemplate(updatedTemplate as Template); // Update local state
      onTemplateUpdate?.(updatedTemplate as Template); // Call parent callback
    }
  });

  const handleDownload = async () => {
    if (!previewRef.current) {
      console.error('Preview ref not found');
      return;
    }
    
    // Validate email field before allowing download
    const emailField = fields.find(field => field.id === 'email');
    if (!emailField || !emailField.value.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address before downloading the PDF.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailField.value.trim())) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address before downloading the PDF.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log('Starting PDF generation...');
      console.log('Template:', template);
      console.log('Template imageWidth:', template.imageWidth);
      console.log('Template imageHeight:', template.imageHeight);
      console.log('Fields:', fields);
      console.log('Preview ref:', previewRef.current);
      
      // Only save to database if NOT in admin mode and template has a valid UUID
      if (!isAdmin && !template.id.startsWith('custom-')) {
        // Save form data to database before generating PDF
        const formData: { [key: string]: string } = {};
        const emailValue = emailField.value.trim();
        
        fields.forEach(field => {
          if (field.value.trim() && field.id !== 'email') {
            // Use field label as key instead of field ID for better readability
            // Exclude email from form_data since it's stored as separate column
            formData[field.label] = field.value;
          }
        });
        
        console.log('Saving form data to database...');
        await supabaseService.createFormSubmission(template.id, emailValue, formData);
        console.log('Form data saved successfully');
      } else {
        console.log('Skipping database save - admin mode or temporary template');
      }
      
      toast({
        title: "Preparing Download",
        description: "Creating your PDF document...",
      });

      // Find the actual template content area (excluding UI elements)
      const templateContent = previewRef.current.querySelector('.relative') as HTMLElement;
      if (!templateContent) {
        console.error('Template content not found in preview ref');
        throw new Error('Template content not found');
      }
      
      console.log('Template content found:', templateContent);
      console.log('Image loaded state:', imageLoaded);

      const canvas = await html2canvas(templateContent, {
        scale: 5, // Increased from 2 to 5 for higher quality (2.5x increase)
        useCORS: true,
        allowTaint: true,
        logging: false, // Disabled logging to reduce processing
        backgroundColor: '#ffffff',
        ignoreElements: (element) => {
          // Ignore resize handles and editing UI elements
          return element.classList.contains('resize-handle') || 
                 element.classList.contains('resize-handles') ||
                 element.classList.contains('editing-ui');
        },
        onclone: (clonedDoc) => {
          // Apply Y offset to text boxes in the cloned DOM for PDF generation
          const textBoxes = clonedDoc.querySelectorAll('[style*="transform: translate"]');
          textBoxes.forEach((textBox) => {
            const element = textBox as HTMLElement;
            const currentTransform = element.style.transform || '';
            
            // Extract current translate values
            const translateMatch = currentTransform.match(/translate\(([^,]+),\s*([^)]+)\)/);
            if (translateMatch) {
              const x = translateMatch[1];
              const y = translateMatch[2];
              
              // Parse Y value and subtract 8px offset (move text boxes up)
              const yValue = parseFloat(y);
              const newY = yValue - 8;
              
              // Apply new transform with adjusted Y position
              element.style.transform = `translate(${x}, ${newY}px)`;
            }
          });
          
          console.log('Applied -8px Y offset (moved up) to', textBoxes.length, 'text boxes for PDF generation');
        }
      });
      
      console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);

      // High quality image data for better PDF quality
      const imgData = canvas.toDataURL('image/jpeg', 0.95); // Increased quality from 0.8 to 0.95
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      console.log('PDF object created');
      
      if (pdfMode === 'single-page') {
        // Single page mode - scale to fit with minimal margins
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 5; // Reduced margin to 5mm
        const contentWidth = pageWidth - (2 * margin);
        const contentHeight = pageHeight - (2 * margin);
        
        // Calculate dimensions to fit within page
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight <= contentHeight) {
          // Content fits on one page
          pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        } else {
          // Scale down to fit
          const scale = contentHeight / imgHeight;
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;
          const xOffset = (pageWidth - scaledWidth) / 2;
          pdf.addImage(imgData, 'PNG', xOffset, margin, scaledWidth, scaledHeight);
        }
      } else {
        // Multi-page mode - split content across pages
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const contentWidth = pageWidth - (2 * margin);
        const contentHeight = pageHeight - (2 * margin);
        
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let remainingHeight = imgHeight;
        let currentY = 0;
        let pageNumber = 1;
        
        while (remainingHeight > 0) {
          const heightOnThisPage = Math.min(remainingHeight, contentHeight);
          const sourceY = currentY * (canvas.height / imgHeight);
          const sourceHeight = heightOnThisPage * (canvas.height / imgHeight);
          
          // Create a temporary canvas for this page
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, sourceHeight,
              0, 0, canvas.width, sourceHeight
            );
          }
          
          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          const pageImgHeight = (sourceHeight * imgWidth) / canvas.width;
          
          pdf.addImage(pageImgData, 'JPEG', margin, margin, imgWidth, pageImgHeight);
          
          remainingHeight -= contentHeight;
          currentY += contentHeight;
          
          if (remainingHeight > 0) {
            pdf.addPage();
            pageNumber++;
          }
        }
      }

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${template.name || 'document'}_${timestamp}.pdf`;
      
      console.log('Saving PDF as:', filename);
      pdf.save(filename);
      
      toast({
        title: "Download Complete",
        description: `Your document has been saved as ${filename}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error('Download error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      toast({
        title: "Download Failed",
        description: "There was an error creating your PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderCustomTemplate = () => {
    const imageSource = getImageSource(template.imageData, template.imageUrl);
    
    if (!imageSource) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <p className="text-gray-500">No image available</p>
        </div>
      );
    }

    return (
      <>
        {/* Header container - separate from image container */}
        <div className="bg-white shadow p-6 mb-4">
          <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Template Preview</h3>
          {isAdmin && (
            <Button 
              variant={isEditing ? "destructive" : "outline"} 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? "Done Editing" : "Edit Positions"}
            </Button>
          )}
          </div>
        </div>

        {/* Image container - clean, no padding interference */}
        <div className="bg-white">
          <div className="relative w-full h-auto" ref={previewRef}>
          <img
            ref={setImageRef}
            src={imageSource}
            alt="Template background"
              className="rounded w-full h-auto max-h-full object-contain"
            onLoad={() => setImageLoaded(true)}
          />
          
            {imageLoaded && imageRef && (
            <TemplateRenderer
              template={template}
              fields={fields}
              fieldPositions={getDisplayPositions()}
              isEditing={isEditing}
              imageLoaded={imageLoaded}
              getFieldValue={getFieldValue}
              onMouseDown={handleMouseDown}
              onResizeStart={handleResizeStart}
              containerGlobalPosition={previewRef.current ? {
                left: previewRef.current.offsetLeft,
                top: previewRef.current.offsetTop
              } : undefined}
            />
          )}

        </div>
        </div>
        
        {/* Debug button for testing */}
        {isAdmin && (
          <div className="bg-white p-6 pt-2">
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={debugImageContainerPositioning}
              >
                Debug Image Positioning
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={captureFieldPositionsFromWebpage}
              >
                Capture Field Positions
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  if (imageRef) {
                    console.log('📏 IMAGE SCALING DEBUG:', {
                      originalDimensions: {
                        width: template.imageWidth,
                        height: template.imageHeight
                      },
                      currentDimensions: {
                        width: imageRef.offsetWidth,
                        height: imageRef.offsetHeight
                      },
                      scalingRatio: {
                        width: imageRef.offsetWidth / template.imageWidth,
                        height: imageRef.offsetHeight / template.imageHeight
                      }
                    });
                  }
                }}
              >
                Check Image Scaling
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('🔍 PERCENTAGE VALUES:', currentTemplate.fieldPositions);
                }}
              >
                Check Percentage Values
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('🔍 COMPREHENSIVE DEBUG - All field positioning info:');
                  console.log('=== STEP 1: Image Scaling ===');
                  if (imageRef) {
                    console.log('Image Scaling:', {
                      originalDimensions: { width: template.imageWidth, height: template.imageHeight },
                      currentDimensions: { width: imageRef.offsetWidth, height: imageRef.offsetHeight },
                      scalingRatio: {
                        width: imageRef.offsetWidth / template.imageWidth,
                        height: imageRef.offsetHeight / template.imageHeight
                      }
                    });
                  }
                  
                  console.log('=== STEP 2: Percentage Values ===');
                  console.log('Percentage Values:', currentTemplate.fieldPositions);
                  
                  console.log('=== STEP 3: Calculated Positions ===');
                  const currentPositions = getDisplayPositions();
                  console.log('Calculated Positions:', currentPositions);
                  
                  console.log('=== STEP 4: TemplateRenderer Props ===');
                  console.log('Positions being passed to TemplateRenderer:', currentPositions);
                  console.log('TemplateRenderer props check:', {
                    hasPositions: !!currentPositions,
                    positionCount: Object.keys(currentPositions).length,
                    samplePosition: Object.values(currentPositions)[0]
                  });
                  
                  console.log('=== STEP 5: Force Re-render ===');
                  setImageLoaded(false);
                  setTimeout(() => {
                    setImageLoaded(true);
                    console.log('Re-render triggered - check for FieldOverlay debug logs below');
                  }, 100);
                }}
              >
                Comprehensive Debug
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('🧹 CACHE BUSTING DEBUG:');
                  // Force cache busting
                  const timestamp = Date.now();
                  console.log('Cache busting timestamp:', timestamp);
                  
                  // Force React to re-render everything
                  setImageLoaded(false);
                  setTimeout(() => {
                    setImageLoaded(true);
                    console.log('Cache busting re-render completed');
                  }, 50);
                }}
              >
                Cache Bust
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('🎨 CSS CONFLICT DEBUG:');
                  // Check for CSS conflicts
                  const fieldElements = document.querySelectorAll('[class*="absolute rounded"]');
                  fieldElements.forEach((element, index) => {
                    const computedStyle = window.getComputedStyle(element);
                    console.log(`Field ${index} CSS:`, {
                      position: computedStyle.position,
                      transform: computedStyle.transform,
                      left: computedStyle.left,
                      top: computedStyle.top,
                      width: computedStyle.width,
                      height: computedStyle.height,
                      zIndex: computedStyle.zIndex
                    });
                  });
                }}
              >
                Check CSS Conflicts
              </Button>
            </div>
          </div>
        )}
        
        {/* Edit instructions - outside image container */}
        {isEditing && (
          <div className="bg-white p-6 pt-2">
            <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              💡 <strong>Edit Mode:</strong> 
              <br/>• <strong>Drag boxes</strong> to move them over form fields
              <br/>• <strong>Drag corners/edges</strong> to resize boxes
              <br/>• Click "Done Editing" when finished
            </p>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderTemplate = () => {
    // Use renderCustomTemplate for all templates to enable position editing
    return renderCustomTemplate();
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl">Preview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div>
            {renderTemplate()}
          </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Button 
            onClick={handleDownload} 
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Download as PDF and Save Data</span>
            <span className="sm:hidden">Download PDF</span>
          </Button>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm">
            <span>PDF Mode:</span>
            <select 
              value={pdfMode} 
              onChange={(e) => setPdfMode(e.target.value as 'single-page' | 'multi-page')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="single-page">Single Page</option>
              <option value="multi-page">Multi Page</option>
            </select>
          </div>
        </div>
        {/* Save Template Buttons for Admin */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {onSaveTemplate && (
          <Button
                onClick={() => onSaveTemplate()}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            Save Template
          </Button>
            )}
            {onSaveAsTemplate && (
              <Button
                onClick={() => onSaveAsTemplate()}
                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
              >
                Save As Template
              </Button>
            )}
          </div>
        )}
        {(() => {
          const emailField = fields.find(field => field.id === 'email');
          const emailValue = emailField?.value?.trim() || '';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(emailValue);
          
          if (!emailValue) {
            return (
              <div className="text-red-500 text-sm">
                Please enter a valid email address to download PDF
              </div>
            );
          }
          
          if (!isValidEmail) {
            return (
              <div className="text-red-500 text-sm">
                Please enter a valid email format
              </div>
            );
          }
          
          return null;
        })()}
      </CardFooter>
    </Card>
  );
};

export default TemplatePreview;
