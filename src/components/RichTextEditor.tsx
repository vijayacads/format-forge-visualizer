import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const RichTextEditor = ({ value, onChange, placeholder, readOnly = false }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Register custom font sizes
    const Size = Quill.import('attributors/style/size') as any;
    Size.whitelist = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
    Quill.register(Size, true);

    // Initialize Quill
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: placeholder || 'Enter text here...',
      readOnly: readOnly,
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ 'size': ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'] }],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'align': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          ['clean']
        ]
      },
                     formats: [
                 'bold', 'italic', 'underline', 'size', 'color', 'background',
                 'align', 'list'
               ]
    });

    // Set initial content
    if (value) {
      quill.root.innerHTML = value;
    }

    // Handle content changes
    quill.on('text-change', () => {
      const html = quill.root.innerHTML;
      onChange(html);
    });

    quillRef.current = quill;

    // Cleanup
    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  // Update readOnly state
  useEffect(() => {
    if (quillRef.current) {
      quillRef.current.enable(!readOnly);
    }
  }, [readOnly]);

  return (
    <div className="rich-text-editor">
      <div 
        ref={editorRef}
        className="quill-editor"
        style={{
          minHeight: '200px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      />
    </div>
  );
};

export default RichTextEditor; 