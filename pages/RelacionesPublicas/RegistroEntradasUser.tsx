import { FC, FunctionComponent, useEffect, useRef, useState } from "react";
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

const RegistroEntradasUser: FC<propsRegistroEntradasUser> = ({ componentState, setComponentState, ticket, count }) => {
  const { storage_id } = AuthContextProvider()
  const router = useRouter()
  const initialCount = router?.query?.count
  const newCount = initialCount && +initialCount
  // const datafilter = data?.data?.filter(element => (element.metadata.grupo === "ticket"))
  // const FindTicket = datafilter?.find(({ name }) => name === ticket)
  // const price = FindTicket?.prices[0]?.unit_amount / 100
  // const TotalCompra = (count * price) + 8.25
  const [data, setData] = useState()
  const [valuesForm, setValuesForm] = useState()
  const [quantity, setQuantity] = useState(1)
  const handleSubmit = (values) => {
    console.log('Valores del formulario:', values)
  };

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

  // http://96.126.110.203:3001/RelacionesPublicas/RegistroEntradasUser?stage=4&count=2&sId=b0ab944c51e6f7993789e09dc37a011e89ffb0b9d1ab0039
  // b76ace06e387a3ed01b16179
  return (
    <div className="bg-slate-100 w-full h-[100vh] flex flex-col gap-4 items-center justify-start  pt-[20px]">
      <HeaderComp />
      <div className="w-[100%] h-full text-left text-sm font-medium">
        <CabeceraR componentState={componentState} setComponentState={setComponentState} activo={false} />
        <div className="w-full flex md:flex-row flex-col items-start justify-center box-border gap-[25px] text-sm text-black">
          <div className="md:self-stretch  flex flex-col items-center justify-start gap-[21px] overflow-y-auto overflow-x-hidden h-[calc(100vh-210px)] pr-2 ">
            <DatosComprador />
            <CheckCondition />
          </div>
          <ResumenComponents data={data} />
        </div>
      </div>
    </div>
  );
};

export default RegistroEntradasUser;

