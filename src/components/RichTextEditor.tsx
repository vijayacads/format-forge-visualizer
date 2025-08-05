import React, { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

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

  // TinyMCE configuration to match React Quill features
  const init = {
    height: 200,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: [
      'fontsize | bold italic underline | forecolor backcolor | alignleft aligncenter alignright alignjustify',
      'bullist numlist | removeformat'
    ],
    fontsize_formats: '10px 12px 14px 16px 18px 20px 24px 28px 32px 36px 48px',
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        padding: 8px;
      }
      @media (max-width: 768px) {
        body { font-size: 12px; }
      }
    `,
    placeholder: placeholder || 'Enter text here...',
    directionality: 'ltr',
    text_align: 'left',
    branding: false,
    elementpath: false,
    resize: false,
    statusbar: false,
    // Mobile-friendly configuration
    mobile: {
      theme: 'silver',
      plugins: ['lists', 'autolink', 'paste'],
      toolbar: 'bold italic | bullist numlist',
      menubar: false,
      statusbar: false,
      elementpath: false,
      resize: false
    }
  };

  return (
    <div className="rich-text-editor">
      <Editor
        value={editorValue}
        onEditorChange={handleChange}
        init={init}
        className="mobile-friendly-editor"
      />
    </div>
  );
};

export default RichTextEditor; 