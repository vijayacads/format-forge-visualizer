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
          style={{ height }}
          className="rich-text-editor-quill"
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            @media (max-width: 768px) {
              .rich-text-editor-quill .ql-toolbar button {
                width: 20px !important;
                height: 20px !important;
                padding: 1px !important;
                margin: 0.5px !important;
                font-size: 10px !important;
              }
              
              .rich-text-editor-quill .ql-toolbar .ql-picker {
                height: 20px !important;
                margin: 0.5px !important;
              }
              
              .rich-text-editor-quill .ql-toolbar .ql-picker-label {
                padding: 1px 2px !important;
                font-size: 10px !important;
                height: 20px !important;
              }
              
              .rich-text-editor-quill .ql-toolbar .ql-formats {
                margin-right: 4px !important;
              }
            }
          `
        }} />
      </div>
    </div>
  );
};

export default RichTextEditor; 