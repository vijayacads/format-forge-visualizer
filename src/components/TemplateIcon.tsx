import React, { useState, useEffect } from 'react';
import { Template } from '@/types';
import { getTemplateIconAsync, getTemplateIcon } from '@/utils/imageUtils';

interface TemplateIconProps {
  template: Template;
  size?: number;
  className?: string;
}

const TemplateIcon: React.FC<TemplateIconProps> = ({ 
  template, 
  size = 60, 
  className = '' 
}) => {
  const [iconSrc, setIconSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImage, setIsImage] = useState(false);

  useEffect(() => {
    const loadIcon = async () => {
      setIsLoading(true);
      try {
        const icon = await getTemplateIconAsync(template, size);
        setIconSrc(icon);
        setIsImage(icon.startsWith('data:image'));
      } catch (error) {
        console.warn('Failed to load template icon:', error);
        const fallbackIcon = getTemplateIcon(template);
        setIconSrc(fallbackIcon);
        setIsImage(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadIcon();
  }, [template, size]);

  if (isLoading) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (isImage) {
    return (
      <img
        src={iconSrc}
        alt={`${template.name} template`}
        className={`object-cover rounded-lg border border-gray-200 ${className}`}
        style={{ width: size, height: size }}
        onError={() => {
          // Fallback to emoji if image fails to load
          const fallbackIcon = getTemplateIcon(template);
          setIconSrc(fallbackIcon);
          setIsImage(false);
        }}
      />
    );
  }

  return (
    <div 
      className={`flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 ${className}`}
      style={{ width: size, height: size }}
    >
      <span 
        className="text-2xl"
        style={{ fontSize: `${size * 0.4}px` }}
      >
        {iconSrc}
      </span>
    </div>
  );
};

export default TemplateIcon; 