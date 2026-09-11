import { FC, ReactNode } from 'react';

interface pros extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

const ButtonSecondary: FC<pros> = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`focus:outline-none transition bg-primary text-white rounded-lg text-[10px] md:text-sm px-6 py-1 mt-4 w-full border border-primary ${props.disabled ? "opacity-65" : "hover:font-bold hover:bg-primary hover:text-white"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonSecondary;
