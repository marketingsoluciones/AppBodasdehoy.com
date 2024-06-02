import { FC, FunctionComponent, useEffect, useRef, useState } from "react";
import { DatosComprador } from "./Sub-Componentes/DatosComprador";
import { DataArray } from "./Sub-Componentes/DataArray";
import { ResumenComponents } from "./Sub-Componentes/ResumenC";
import { CabeceraR } from "./Sub-Componentes/CabeceraR";
import { CheckCondition } from "./Sub-Componentes/CheckConition";
import HeaderComp from "./Sub-Componentes/HeaderComp";
import { Formik, Form, Field, useFormikContext } from 'formik';

interface propsRegistroEntradasUser {
  componentState: any;
  setComponentState: any;
  ticket: any;
  count: number;
  data: any;
}

const RegistroEntradasUser: FC<propsRegistroEntradasUser> = ({ componentState, setComponentState, ticket, count, data }) => {
  const datafilter = data?.data?.filter(element => (element.metadata.grupo === "ticket"))

  const FindTicket = datafilter?.find(({ name }) => name === ticket)
  const price = FindTicket?.prices[0]?.unit_amount / 100
  const TotalCompra = (count * price) + 8.25


  const handleSubmit = (values) => {
    console.log('Valores del formulario:', values)
  };

  return (
    <div className="bg-slate-100 w-full h-[100vh] flex flex-col gap-4 items-center justify-start  pt-[20px]">
      <HeaderComp componentState={componentState} setComponentState={setComponentState} />
      <div className="w-[100%] h-full text-left text-sm font-medium">
        <CabeceraR componentState={componentState} setComponentState={setComponentState} />
        <div className="w-full flex md:flex-row flex-col items-start justify-center box-border gap-[25px] text-sm text-black">
          <div className="md:self-stretch  flex flex-col items-center justify-start gap-[21px] overflow-y-auto overflow-x-hidden h-[calc(100vh-210px)] pr-2 ">

            {(() => {
              const arr = [];
              for (let i = 0; i < count; i++) {
                arr.push(
                  <div key={i} >
                    <DatosComprador handleSubmit={handleSubmit} idx={count}  />
                  </div>
                );
              }
              return arr;
            })()}

            {/* <DatosComprador handleSubmit={handleSubmit} idx={count} /> */}

            <CheckCondition />
          </div>
          <ResumenComponents componentState={componentState} setComponentState={setComponentState} FindTicket={FindTicket} TotalCompra={TotalCompra} count={count} />
        </div>
      </div>
    </div>
  );
};

export default RegistroEntradasUser;

