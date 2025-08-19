import React from 'react';
import { FileText, Paperclip, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DescriptionCellProps {
  value: string;
  onClick: () => void;
}

export const DescriptionCell: React.FC<DescriptionCellProps> = ({ value, onClick }) => {
  const { t } = useTranslation();
  const plainText = value ? value.replace(/<[^>]*>/g, '') : '';
  const displayText = plainText.length > 40 ? `${plainText.substring(0, 40)}...` : plainText;
  
  return (
    <div 
      className="px-3 py-2 cursor-pointer hover:bg-gray-50"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="flex items-center space-x-2">
        <FileText className="w-4 h-4 text-gray-400" />
        <span className={`text-sm ${!value ? 'text-gray-400 italic' : 'text-gray-700'}`}>
          {displayText || t('Sin descripción')}
        </span>
      </div>
    </div>
  );
};

interface AttachmentsCellProps {
  value: any[];
  onClick: () => void;
}

export const AttachmentsCell: React.FC<AttachmentsCellProps> = ({ value, onClick }) => {
  const attachmentsCount = Array.isArray(value) ? value.length : 0;
  
  return (
    <div 
      className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-50 group"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Paperclip className="w-4 h-4 text-gray-400 group-hover:text-primary" />
      <span className={`text-sm ${attachmentsCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
        {attachmentsCount || '-'}
      </span>
    </div>
  );
};

interface CommentsCellProps {
  value: any[];
  onClick: () => void;
}

export const CommentsCell: React.FC<CommentsCellProps> = ({ value, onClick }) => {
  const commentsCount = Array.isArray(value) ? value.length : 0;
  
  return (
    <div 
      className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-gray-50 group"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-primary" />
      <span className={`text-sm ${commentsCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
        {commentsCount || '-'}
      </span>
    </div>
  );
};