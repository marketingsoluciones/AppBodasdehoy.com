import { FC, ReactNode } from 'react';

interface pros extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const ButtonPrimary: FC<pros> = ({ children, ...props }) => {
  return (
    <button
      className="focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display font-semibold text-[10px] md:text-sm rounded-lg hover:bg-primary hover:text-white transition border border-primary capitalize"
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonPrimary; 