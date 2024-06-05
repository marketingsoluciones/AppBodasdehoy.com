import { FC, FunctionComponent, useEffect, useRef, useState } from "react";
import { DatosComprador } from "../../components/RRPP/Sub-Componentes/DatosComprador";
import { ResumenComponents } from "../../components/RRPP/Sub-Componentes/ResumenC";
import { CabeceraR } from "../../components/RRPP/Sub-Componentes/CabeceraR";
import { CheckCondition } from "../../components/RRPP/Sub-Componentes/CheckConition";
import HeaderComp from "../../components/RRPP/Sub-Componentes/HeaderComp";
import { useRouter } from "next/router";
import { AuthContextProvider } from "../../context";


interface propsRegistroEntradasUser {
  componentState: any;
  setComponentState: any;
  ticket: any;
  count: number;
  data: any;
}

const RegistroEntradasUser: FC<propsRegistroEntradasUser> = ({ componentState, setComponentState, ticket, count, data }) => {
  const { storage_id } = AuthContextProvider()
  const router = useRouter()
  const initialCount = router?.query?.count
  const ValirStorage = storage_id === router?.query?.sId
  const newCount = initialCount && +initialCount
  const datafilter = data?.data?.filter(element => (element.metadata.grupo === "ticket"))
  const FindTicket = datafilter?.find(({ name }) => name === ticket)
  const price = FindTicket?.prices[0]?.unit_amount / 100
  const TotalCompra = (count * price) + 8.25
  const [valuesForm, setValuesForm] = useState()
  const handleSubmit = (values) => {
    console.log('Valores del formulario:', values)
  };

/*   useEffect(() => {
    if (!ValirStorage) {
      router.push("/RelacionesPublicas?stage=1")
    }
    if (ValirStorage) {

    }
  }, [router]) */

  return (
    <div className="bg-slate-100 w-full h-[100vh] flex flex-col gap-4 items-center justify-start  pt-[20px]">
      <HeaderComp />
      <div className="w-[100%] h-full text-left text-sm font-medium">
        <CabeceraR componentState={componentState} setComponentState={setComponentState} activo={false} />
        <div className="w-full flex md:flex-row flex-col items-start justify-center box-border gap-[25px] text-sm text-black">
          <div className="md:self-stretch  flex flex-col items-center justify-start gap-[21px] overflow-y-auto overflow-x-hidden h-[calc(100vh-210px)] pr-2 ">
            {/* {(() => {
              const arr = [];
              for (let i = 0; i < newCount; i++) {
                arr.push(
                  <div key={i} >
                    <DatosComprador handleSubmit={handleSubmit} idx={i} valuesForm={valuesForm }  setValuesForm={setValuesForm} />
                  </div>
                );
              }
              return arr;
            })()} */}
            <DatosComprador />
            <CheckCondition />
          </div>
          <ResumenComponents componentState={componentState} setComponentState={setComponentState} FindTicket={FindTicket} TotalCompra={TotalCompra} count={newCount} />
        </div>
      </div>
    </div>
  );
};

export default RegistroEntradasUser;

