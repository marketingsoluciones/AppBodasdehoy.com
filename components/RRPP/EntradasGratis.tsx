import { FC, FunctionComponent, memo, useState } from "react";
import NumericCounter from "./Sub-Componentes/ContadorNumerico";
import HeaderComp from "./Sub-Componentes/HeaderComp";
import { fetchApiBodas, queries } from "../../utils/Fetching";
import { AuthContextProvider } from "../../context";
import { useRouter } from "next/router";
interface propsEntradasGratis {
  componentState: any;
  setComponentState: any;
  ticket: any;
  count: number;
  setCount: any;
  data: any;
}

const EntradasGratis: FC<propsEntradasGratis> = ({ componentState, setComponentState, ticket, count, setCount, data }) => {

  const datafilter = data?.data?.filter(element => (element.metadata.grupo === "ticket"))
  const findTicket = datafilter.find(({ name }) => name === ticket)
  const price = findTicket?.prices[0]?.unit_amount / 100
  const totalCompra = (count * price) + 8.25
  const priceId= findTicket?.prices[0]?.id
  const { user } = AuthContextProvider()
  const router = useRouter()

  console.log(findTicket)


  const handleCheckout = () => {
    fetchApiBodas({
      query: queries.createCheckoutSession,
      variables: {
        pricesIDs: priceId,
        email: user?.email,
        cancel_url: `${window.location.href}/?stage=3`
      },
      development: "bodasdehoy"
    }).then((result) => {
      router?.push(result)
    })
  }

  return (
    <div className="w-full h-[100vh] bg-slate-100 overflow-hidden flex flex-col items-center justify-start pt-[20px] gap-4 box-border tracking-[normal] text-left text-base text-gray-600 font-semibold">
      <HeaderComp componentState={componentState} setComponentState={setComponentState} />
      <section className="self-stretch flex flex-col  items-start justify-center py-0 px-10 gap-[10px] text-left text-sm text-gray-600 mq416:pr-[362px] mq416:box-border">
        <div className="flex flex-row flex-wrap items-start justify-center pl-8 gap-[10px]">
          <div onClick={() => {
            setComponentState(2)
          }}
            className="cursor-pointer rounded-md bg-[#6096B9] flex flex-row items-center justify-center py-[10.5px] pr-[11.299999999995634px] pl-[11.400000000001455px]">
            <div className="flex flex-col items-start justify-start">
              <div className="h-3.5 flex flex-row items-start justify-start">
                <img
                  className="h-3.5 w-[12.3px] relative overflow-hidden shrink-0"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/flechablanca.svg"
                />
              </div>
            </div>
          </div>


          <div className="flex flex-col items-start justify-start gap-[10px] min-w-[155px]">
            <div className="self-stretch flex flex-row items-center justify-start gap-[9px]">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="h-[13px] w-[13.2px] relative overflow-hidden shrink-0"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/vre.svg"
                />
              </div>
              <div className="h-[18px] w-[217px] relative tracking-[2.45px] leading-[17.5px] uppercase font-medium inline-block">
                <b>Sabado</b>


                <span>, 29 Junio 2024</span>
              </div>
            </div>
            <div className="w-[138.7px] flex flex-row items-center justify-start gap-[6px]">
              <div className="flex flex-row items-start justify-start">
                <img
                  className="h-[13px] w-[14.7px] relative overflow-hidden shrink-0"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/relog3.svg"
                />
              </div>
              <div className="h-[18px] flex-1 relative tracking-[2.45px] leading-[18px] uppercase font-medium inline-block whitespace-nowrap">
                {" "}
                00:00
              </div>
              <div className="h-[13px] w-[7px] text-xs relative tracking-[2.45px] leading-[12.25px] uppercase font-medium text-gray-400 flex items-center">
                /
              </div>
              <div className="h-[18px] flex-1 relative tracking-[2.45px] leading-[18px] uppercase font-medium inline-block whitespace-nowrap">
                {" "}
                07:30
              </div>
            </div>
          </div>

        </div>

        <div className="flex flex-col items-start justify-start pl-8 text-xl text-[#6096B9]">
          <b className="w-auto h-[31.5px] relative leading-[31.5px] inline-block max-w-[1024px] max-h-[31.5px] mq416:max-w-full">
            Concierto de los Iracundos
          </b>
        </div>
      </section>

      <div className="w-auto flex md:flex-row flex-col items-center justify-center gap-[31.5px] max-w-full">
        <div className="flex flex-col items-start justify-start pt-[21px] px-0 pb-0 box-border gap-[21px] max-w-full mq416:min-w-full">
          <div className="self-stretch rounded-md bg-green bg-opacity-40 box-border flex flex-col items-start justify-start py-[22px] px-[21px] max-w-full border-[1px] border-solid border-green">
            <div className="self-stretch flex flex-row items-center justify-between max-w-full [row-gap:20px]">
              <div className="flex flex-col items-start justify-start py-0 pr-[10.5px] pl-0 box-border max-w-full mq416:min-w-full">
                <div className="w-auto h-[24.5px] relative leading-[24.5px] font-semibold inline-block text-black max-h-[24.5px]">
                  {findTicket?.name}
                </div>
              </div>
              <div className="flex flex-col items-start justify-start text-mid-5 text-success-dark">
                <div className="w-auto h-[24.5px] relative leading-[24.5px] font-semibold inline-block text-black whitespace-nowrap">
                  {findTicket?.total}
                </div>
              </div>
            </div>
          </div>

          <div className="self-stretch w-full rounded-md box-border flex flex-col items-start justify-start py-[11.5px] px-2.5 max-w-full md:text-sm text-xs border-[1px] border-solid border-blue-600">
            <div className="self-stretch flex flex-row items-start justify-start py-0 pl-0 box-border max-w-full [row-gap:20px]">
              <div className="flex flex-col items-start justify-start pt-1 pb-[3px] pr-[10.5px] pl-0">
                <div className="flex flex-row items-start justify-start">
                  <img
                    className="h-3.5 w-3.5 relative overflow-hidden shrink-0"
                    alt=""
                    src="ModuloEvento/info2.svg"
                  />
                </div>
              </div>
              <div className="flex flex-row w-full items-start justify-start gap-[3.47px] max-w-full">
                <div className="h-[21px] w-auto relative leading-[21px] inline-block">
                  Descarga tus entradas una vez compradas.
                </div>
                <i className="h-[21px] w-auto relative [text-decoration:underline] leading-[21px] inline-block text-gray-500 min-w-[61px]">
                  Más info.
                </i>
              </div>
            </div>
          </div>

          <div className="self-stretch rounded-md bg-white shadow-[0px_1px_10px_rgba(0,_0,_0,_0.12),_0px_4px_5px_rgba(0,_0,_0,_0.14),_0px_2px_4px_-1px_rgba(0,_0,_0,_0.2)] flex flex-col items-center justify-center gap-4 py-[10.5px] px-5 text-center text-xl text-[#6096B9]">
            <h3 className="m-0 self-stretch h-7 relative text-inherit leading-[28px] font-bold font-inherit inline-block">
              Seleccionar cantidad
            </h3>
            <NumericCounter count={count} setCount={setCount} />
          </div>

        </div>

        <div className="w-[400px] flex flex-col items-start justify-start pt-[21px] px-0 pb-0 box-border min-w-[312px] text-text-primary">
          <div className="self-stretch rounded-md bg-white shadow-[0px_1px_10px_rgba(0,_0,_0,_0.12),_0px_4px_5px_rgba(0,_0,_0,_0.14),_0px_2px_4px_-1px_rgba(0,_0,_0,_0.2)] flex flex-col items-start justify-start p-[10.5px] gap-[10.5px]">
            <div className="self-stretch flex flex-col items-start justify-start gap-[10.5px]">
              <div className="w-[71px] h-[24.5px] relative leading-[24.5px] font-semibold inline-block min-w-[71px] max-w-[285.3399963378906px] max-h-[24.5px]">
                Resumen
              </div>
              <div className="self-stretch flex flex-row items-start justify-between gap-[20px] text-sm text-gray-600">
                <div className="flex flex-col items-start justify-start gap-[10.5px]">
                  <div className="w-[600px] h-[21px] relative leading-[21px] font-light inline-block min-w-[200px] max-w-[250px]">
                    {count} x {findTicket?.name} ({price} $)
                  </div>
                </div>
                <div className="w-auto flex flex-col items-start justify-start gap-[10.5px] text-right">
                  <div className="self-stretch h-[21px] relative leading-[21px] font-light inline-block min-w-[43px]">
                    {count * price}$
                  </div>
                </div>
              </div>
              <div className="self-stretch flex flex-row items-start justify-between gap-[20px] text-sm text-gray-600">
                <div className="h-[21px] w-auto relative leading-[21px] font-light inline-block min-w-[119px] max-w-[243.27999877929688px]">
                  Gastos de gestión
                </div>
                <div className="h-[21px] w-auto relative leading-[21px] font-light text-right flex items-center min-w-[43px]">
                  8,25 $
                </div>
              </div>
              <div className="self-stretch h-px relative bg-gray-600" />
              <div className="self-stretch flex flex-row items-start justify-between gap-[20px]">
                <div className="h-[24.5px] w-[38px]  leading-[24.5px] font-semibold inline-block min-w-[38px] max-w-[235.47000122070312px] max-h-[24.5px]">
                  Total
                </div>
                <div className="h-[24.5px] w-[51px]* leading-[24.5px] font-semibold ">
                  {totalCompra} $
                </div>
              </div>
            </div>
            <button onClick={handleCheckout} className="cursor-pointer [border:none] pt-[9.5px] pb-[11px] pr-5 pl-[21px] bg-[#6096B9] hover:bg-[#4189b9] self-stretch rounded-md flex flex-row items-start justify-center hover:bg-crimson-100">
              <div className="h-[25px] w-[83px] relative text-mid-5 leading-[25px] font-medium text-white text-center flex items-center justify-center min-w-[83px] max-w-[264.3399963378906px]">
                Continuar
              </div>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default EntradasGratis;
//setComponentState(4)