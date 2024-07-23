import { FC,  useEffect,useState } from "react";
import { DatosComprador } from "../../components/RRPP/Sub-Componentes/DatosComprador";
import { ResumenComponents } from "../../components/RRPP/Sub-Componentes/ResumenC";
import { CabeceraR } from "../../components/RRPP/Sub-Componentes/CabeceraR";
import { CheckCondition } from "../../components/RRPP/Sub-Componentes/CheckConition";
import HeaderComp from "../../components/RRPP/Sub-Componentes/HeaderComp";
import { useRouter } from "next/router";
import { AuthContextProvider } from "../../context";
import { fetchApiBodas, queries } from "../../utils/Fetching";


interface propsRegistroEntradasUser {
  componentState: any;
  setComponentState: any;
  ticket: any;
  count: number;
  data: any;
}

const RegistroEntradasUser: FC<propsRegistroEntradasUser> = ({ componentState, setComponentState }) => {
  const { storage_id, config, } = AuthContextProvider()
  const router = useRouter()
  const [data, setData] = useState()
  const [valirButton, setValirButton] = useState(true)
  const [spinner, setSpinner] = useState(false)
  

  useEffect(() => {
    if (storage_id === router?.query?.sId?.slice(0, 24)) {
      const unique = router.query.sId.slice(-24)
      //fetching
      fetchApiBodas({
        query: queries.getCheckoutItems,
        variables: {
          unique,
        },
        development: "bodasdehoy"
      }).then((result) => {
        console.log("aqui", unique)
        if (result) {
          console.log("result", result)
          setData(result)
        } else {
          router.push(`${window.location.origin}/RelacionesPublicas`)
        }
      })
    }
  }, [router])

  useEffect(() => {
    if (!valirButton) {
      setSpinner(true)
      setTimeout(() => {
        router.push("/RelacionesPublicas/ReciboEntradas")
      }, 4000);
    }
  }, [valirButton === false])


  // http://96.126.110.203:3001/RelacionesPublicas/RegistroEntradasUser?stage=4&count=2&sId=b0ab944c51e6f7993789e09dc37a011e89ffb0b9d1ab0039
  // b76ace06e387a3ed01b16179
  return (
    <>

      <div className="bg-slate-100 w-full h-[100vh] flex flex-col gap-4 items-center justify-start  pt-[20px]">
        <HeaderComp />
        <div className="w-[100%] h-full text-left text-sm font-medium">
          <CabeceraR componentState={componentState} setComponentState={setComponentState} activo={false} />
          {
            !spinner ?
              <div className="w-full flex md:flex-row flex-col items-start justify-center box-border gap-[25px] text-sm text-black">
                <div className="md:self-stretch  flex flex-col items-center justify-start gap-[21px] overflow-y-auto overflow-x-hidden h-[calc(100vh-210px)] pr-2 ">
                  <DatosComprador valirButton={valirButton} setValirButton={setValirButton} />
                  {/*  <CheckCondition /> */}
                </div>
                <ResumenComponents data={data} />
              </div>
              :
              <div className="flex  items-center justify-center w-full h-[70%]">
                < div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4"></div>
              </div>
          }
        </div>
      </div>
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
  );
};

export default RegistroEntradasUser;

