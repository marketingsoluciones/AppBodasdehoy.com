import { FC, ReactNode } from 'react';

interface pros extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const ButtonPrimary: FC<pros> = ({ children, ...props }) => {
  return (
    <button
      className={`focus:outline-none bg-white px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-between text-primary font-display  text-[10px] md:text-sm rounded-lg transition border border-primary capitalize ${props.disabled ? "opacity-65" : "hover:font-semibold hover:bg-primary hover:text-white"}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonPrimary; 