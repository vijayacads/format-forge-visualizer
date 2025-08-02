import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const [editorValue, setEditorValue] = useState(value);

  useEffect(() => {
    setEditorValue(value);
  }, [value]);

  const handleChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  // Quill modules to attach to editor
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['clean']
    ],
  };

  // Quill editor formats
  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'color', 'background',
    'align'
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{
          direction: 'ltr',
          textAlign: 'left'
        }}
        className="mobile-friendly-editor"
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          .mobile-friendly-editor .ql-toolbar {
            @media (max-width: 640px) {
              padding: 8px !important;
              flex-wrap: wrap !important;
              gap: 4px !important;
            }
          }
          .mobile-friendly-editor .ql-toolbar button {
            @media (max-width: 640px) {
              padding: 4px 6px !important;
              margin: 2px !important;
            }
          }
          .mobile-friendly-editor .ql-editor {
            @media (max-width: 640px) {
              min-height: 100px !important;
              font-size: 16px !important;
            }
          }
        `
      }} />
    </div>
  );
};

export default RichTextEditor; 