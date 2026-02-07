import { FC, HtmlHTMLAttributes, useEffect } from "react";

interface ButtonConstrolsLienzo extends HtmlHTMLAttributes<HTMLSelectElement> {
  onClick?: any
  pulseButton?: any
}

export const ButtonConstrolsLienzo: FC<ButtonConstrolsLienzo> = ({ children, onClick, className, pulseButton }) => {
  return (
    <>
      <button className={`${className} flex mx-[1px] md:mx-[2px] px-1 border-primary border font-display md:focus:outline-none text-primary text-xs md:text-ms  ${!pulseButton ? 'bg-white' : 'bg-primary text-white transition'} rounded-md md:hover:bg-primary md:hover:text-white md:transition items-center`} onClick={() => onClick()}>
        {children}
      </button>
    </>
  )
}