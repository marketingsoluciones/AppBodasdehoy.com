import { FC } from "react"
import { AuthContextProvider } from "../../context"

interface props {
  loading: boolean
}
export const LoadingSpinner: FC<props> = ({ loading }) => {
  const { config } = AuthContextProvider()

  return (
    loading && <>
      <div className="bg-white left-0 top-0 z-50 fixed w-full h-full opacity-30" />
      <div className="absolute z-50  top-[calc(50%-20px)] left-[calc(50%-20px)] loader ease-linear rounded-full border-[7px] border-black border-opacity-35 w-10 h-10" />
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
    </>
  )
}