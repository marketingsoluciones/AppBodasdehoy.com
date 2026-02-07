import { FC, ReactNode } from 'react';

interface pros extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const ButtonPrimary: FC<pros> = ({ children, className, ...props }) => {
  return (
    <button
      className={`${className ? className : ""} focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display  text-[10px] md:text-sm rounded-lg transition border border-primary capitalize ${props.disabled ? "opacity-65" : "hover:font-semibold hover:bg-primary hover:text-white"}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonPrimary; 