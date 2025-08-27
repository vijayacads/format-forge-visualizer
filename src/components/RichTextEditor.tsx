import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: string;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = 'Enter text here...', 
  readOnly = false,
  height = '200px'
}: RichTextEditorProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Double the height for mobile devices
  const mobileHeight = isMobile ? `calc(${height} * 2)` : height;

  const modules = {
    toolbar: [
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent', 'align',
    'link'
  ];

  return (
    <div className="rich-text-editor">
      <div className="border rounded-md overflow-hidden">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          modules={modules}
          formats={formats}
          style={{ height: mobileHeight }}
          className="rich-text-editor-quill"
        />
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor-quill .ql-toolbar {
            position: sticky !important;
            top: 0 !important;
            background: white !important;
            z-index: 10 !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: ${isMobile ? '8px 12px' : '8px 15px'} !important;
          }
          .rich-text-editor-quill .ql-toolbar .ql-formats {
            margin-right: ${isMobile ? '8px' : '15px'} !important;
          }
          .rich-text-editor-quill .ql-toolbar button {
            width: ${isMobile ? '32px' : '28px'} !important;
            height: ${isMobile ? '32px' : '28px'} !important;
            margin: ${isMobile ? '2px' : '1px'} !important;
            border-radius: 4px !important;
          }
          .rich-text-editor-quill .ql-toolbar .ql-picker {
            height: ${isMobile ? '32px' : '28px'} !important;
            margin: ${isMobile ? '2px' : '1px'} !important;
          }
          .rich-text-editor-quill .ql-toolbar .ql-picker-label {
            padding: ${isMobile ? '4px 8px' : '3px 5px'} !important;
            border-radius: 4px !important;
          }
          .rich-text-editor-quill .ql-container {
            min-height: calc(${mobileHeight} - 42px) !important;
            border: none !important;
          }
          .rich-text-editor-quill .ql-editor {
            min-height: calc(${mobileHeight} - 42px) !important;
            font-size: ${isMobile ? '16px' : '14px'} !important;
            line-height: 1.6 !important;
            text-align: left !important;
            padding: ${isMobile ? '16px 20px' : '12px 15px'} !important;
          }
          .rich-text-editor-quill .ql-editor p {
            text-align: left !important;
            margin-bottom: 8px !important;
          }
          .rich-text-editor-quill .ql-editor ul, .rich-text-editor-quill .ql-editor ol {
            text-align: left !important;
            padding-left: 20px !important;
          }
          .rich-text-editor-quill .ql-editor li {
            text-align: left !important;
            margin-bottom: 4px !important;
          }
          .rich-text-editor-quill .ql-editor.ql-blank::before {
            color: #94a3b8 !important;
            font-style: italic !important;
            font-size: ${isMobile ? '16px' : '14px'} !important;
          }
        `
      }} />
    </div>
  );
};

export default RichTextEditor; 