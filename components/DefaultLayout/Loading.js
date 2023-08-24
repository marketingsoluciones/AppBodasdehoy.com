import React from "react";
import { AuthContextProvider } from "../../context";

const Loading = () => {
  const { config } = AuthContextProvider()
  return (
    <div className="font-display fixed top-0 left-0 w-full h-screen z-50 bg-white flex flex-col justify-center items-center flex-wrap">
      <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
      <h2 className="text-center text-gray-300 text-xl font-semibold">
        Un momento, por favor
      </h2>
      {/* <p className="font-display text-center text-gray-500">
      Esto puede tardar unos segundos, no cierre esta página.
      </p> */}
      <style jsx>
        {`
          .loader {
            border-top-color:  ${config?.theme?.primaryColor};
            -webkit-animation: spinner 1.5s linear infinite;
            animation: spinner 1.5s linear infinite;
          }

          @-webkit-keyframes spinner {
            0% {
              -webkit-transform: rotate(0deg);
            }
            100% {
              -webkit-transform: rotate(360deg);
            }
          }

          @keyframes spinner {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
