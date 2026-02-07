import { DetailedHTMLProps, FC, HTMLAttributes } from 'react';
import { FileIcon, defaultStyles } from 'react-file-icon';

interface props extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  extension: string;
}

export const FileIconComponent: FC<props> = (props) => {
  const { extension } = props;

  return (
    <div {...props}>
      <FileIcon extension={extension} {...defaultStyles[extension]} />
    </div>
  );
};