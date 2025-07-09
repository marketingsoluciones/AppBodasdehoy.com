import { FC, ReactNode } from 'react';

interface pros extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

const ButtonPrimary: FC<pros> = ({ children, ...props }) => {
  return (
    <button
      className={`focus:outline-none transition bg-primary text-white rounded-xl text-sm px-5 py-2 mt-4 w-full ${props.disabled ? "opacity-65" : "hover:font-bold hover:bg-primary hover:text-white"}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonPrimary; 