import { FC } from 'react';
const Loading : FC = () => {
  return (
    <div className="text-primary w-screen h-screen bg-white flex items-center justify-center fixed z-50  top-0 left-0">
      <LoadingItem text={"Procesando, espere un momento"} />
    </div>
  );
};

export default Loading;

const sizes = {
  small : "w-10 h-10",
  medium: "w-16 h-16",
  large : "w-20 h-20"
}
export const LoadingItem : FC <{text: string, size?: keyof typeof sizes}> = ({text, size = "large"}) => {
  return (
    <div className='w-max flex items-center gap-2'>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        className={`${sizes[size]} m-0 p-0 `}
      >
        <path
          fill="currentColor"
          d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50"
        >
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            dur="1s"
            from="0 50 50"
            to="360 50 50"
            repeatCount="indefinite"
          />
        </path>
      </svg>
      {text}
    </div>
  )
}