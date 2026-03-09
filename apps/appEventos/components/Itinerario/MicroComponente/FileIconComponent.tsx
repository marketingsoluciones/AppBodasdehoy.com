import { HTMLAttributes } from 'react';
import { FileIcon, defaultStyles } from 'react-file-icon';

interface props extends HTMLAttributes<HTMLDivElement> {
  extension: string;
}

export const FileIconComponent = ({ extension, ...rest }: props) => {
  return (
    <div {...rest}>
      <FileIcon extension={extension} {...defaultStyles[extension]} />
    </div>
  );
};