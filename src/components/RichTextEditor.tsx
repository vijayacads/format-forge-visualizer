import React, { useState, useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Paragraph from '@editorjs/paragraph';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Marker from '@editorjs/marker';
import Underline from '@editorjs/underline';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const editorRef = useRef<EditorJS>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  // Convert HTML to Editor.js JSON format
  const htmlToEditorData = (html: string): any => {
    if (!html || html === '<span class="text-gray-400 italic">No content added yet</span>') {
      return {
        time: Date.now(),
        blocks: [
          {
            id: '1',
            type: 'paragraph',
            data: {
              text: ''
            }
          }
        ],
        version: '2.22.2'
      };
    }

    // Simple HTML to Editor.js conversion
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const blocks = [];
    let blockId = 1;

    // Convert text nodes to paragraphs
    const textContent = tempDiv.textContent || '';
    if (textContent.trim()) {
      blocks.push({
        id: blockId.toString(),
        type: 'paragraph',
        data: {
          text: textContent
        }
      });
      blockId++;
    }

    return {
      time: Date.now(),
      blocks: blocks.length > 0 ? blocks : [
        {
          id: '1',
          type: 'paragraph',
          data: {
            text: ''
          }
        }
      ],
      version: '2.22.2'
    };
  };

  // Convert Editor.js JSON to HTML
  const editorDataToHtml = (data: any): string => {
    if (!data || !data.blocks) return '';
    
    let html = '';
    data.blocks.forEach((block: any) => {
      switch (block.type) {
        case 'paragraph':
          html += `<p>${block.data.text || ''}</p>`;
          break;
        case 'header':
          const level = block.data.level || 1;
          html += `<h${level}>${block.data.text || ''}</h${level}>`;
          break;
        case 'list':
          const listType = block.data.style === 'ordered' ? 'ol' : 'ul';
          html += `<${listType}>`;
          block.data.items.forEach((item: string) => {
            html += `<li>${item}</li>`;
          });
          html += `</${listType}>`;
          break;
        default:
          html += `<p>${block.data.text || ''}</p>`;
      }
    });
    
    return html || '<span class="text-gray-400 italic">No content added yet</span>';
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Editor.js
    const editor = new EditorJS({
      holder: containerRef.current,
      tools: {
        paragraph: {
          class: Paragraph,
          inlineToolbar: ['marker', 'underline'],
          config: {
            placeholder: placeholder || 'Enter text here...'
          }
        },
        header: {
          class: Header,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3],
            defaultLevel: 1
          }
        },
        list: {
          class: List,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          }
        },
        marker: {
          class: Marker,
          shortcut: 'CMD+SHIFT+M'
        },
        underline: {
          class: Underline,
          shortcut: 'CMD+U'
        }
      },
      data: htmlToEditorData(value),
      onChange: async () => {
        if (editor && isReady) {
          try {
            const data = await editor.save();
            const html = editorDataToHtml(data);
            onChange(html);
          } catch (error) {
            console.error('Error saving editor data:', error);
          }
        }
      },
      onReady: () => {
        setIsReady(true);
      },
      placeholder: placeholder || 'Enter text here...',
      minHeight: 200,
      // Mobile-friendly configuration
      tunes: ['bold', 'italic'],
      // Responsive design
      readOnly: false,
      // Disable unnecessary features for mobile
      hideToolbar: false
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
    };
  }, []);

  // Update editor when value changes externally
  useEffect(() => {
    if (editorRef.current && isReady) {
      const newData = htmlToEditorData(value);
      editorRef.current.render(newData);
    }
  }, [value, isReady]);

  return (
    <div className="rich-text-editor">
      <div ref={containerRef} className="editorjs-container" />
    </div>
  );
};

export default RichTextEditor; 