import { useState } from "react";

const BotonBajar = (props) => {

  return (
    <a
      className="w-10 h-10 rounded-full absolute bg-white h-max bottom-8 z-50 right-0 left-0 mx-auto animate-bounce cursor-pointer transition"
      href="#hola" {...props}
    >
      <ArrowRight className="w-full h-full p-3 mt-0.5 text-blue-primary transform rotate-90 " />
    </a>
  );
};

export default BotonBajar;
