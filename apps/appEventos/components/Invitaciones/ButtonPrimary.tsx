import { FC, ReactNode } from 'react';

interface pros extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gray';
}

const variantClasses: Record<NonNullable<pros['variant']>, string> = {
  default:
    'bg-white text-primary border border-primary hover:font-semibold hover:bg-primary hover:text-white',
  gray:
    'bg-gray-200 text-[#6b6b72] border border-gray-200 font-semibold hover:bg-[#ececf0]',
};

const ButtonPrimary: FC<pros> = ({ children, className = '', variant = 'default', ...props }) => {
  return (
    <button
      className={`focus:outline-none px-2 md:px-6 py-1 flex gap-1 md:gap-2 items-center justify-center font-display text-[10px] md:text-sm rounded-lg transition capitalize ${variantClasses[variant]} ${props.disabled ? 'opacity-65' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default ButtonPrimary;
