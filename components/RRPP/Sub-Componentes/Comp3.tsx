import { FC } from "react";
interface propsComp3 {
  componentState: any;
  setComponentState: any;

}


const Comp3: FC<propsComp3> = ({componentState, setComponentState}) => {
  return (
    <section className="self-stretch flex flex-row items-start justify-end pt-0 px-[65px] pb-[126px] box-border max-w-full text-left text-xl text-white font-playfair mq750:pl-8 mq750:pr-8 mq750:pb-[82px] mq750:box-border">
      <div className="flex-1 flex flex-col items-start justify-start gap-[88px] max-w-full mq750:gap-[44px] mq450:gap-[22px]">
        <header className="self-stretch flex flex-row items-start justify-start py-0 px-7 box-border max-w-full text-left text-16xl text-white font-clicker-script">
          <div className="flex-1 flex flex-row items-start justify-between max-w-full gap-[20px]">
            <div className="flex flex-col items-start justify-start pt-px px-0 pb-0">
              <div className="relative inline-block min-w-[118px] font-Clicker whitespace-nowrap z-[1]">
                Oro Verde
              </div>
            </div>
            <div className="w-[780px] flex flex-row items-start justify-start gap-[209px] max-w-full text-sm font-playfair-display mq750:w-[600px] mq1025:w-[389px] mq1025:gap-[104px] mq450:gap-[52px]">
              <div className="flex-1 flex flex-col items-start justify-start pt-3.5 px-0 pb-0 box-border max-w-full mq1025:hidden">
                <div className="self-stretch flex flex-row items-start justify-between gap-[20px] mq1025:hidden mq450:hidden">
                  <div className="relative font-medium inline-block min-w-[37px] z-[1]">
                    Inicio
                  </div>
                  <div className="relative font-medium inline-block min-w-[58px] z-[1]">
                    Servicios
                  </div>
                  <div className="relative font-medium inline-block min-w-[96px] whitespace-nowrap z-[1]">
                    Sobre nosotros
                  </div>
                  <div className="relative font-medium inline-block min-w-[80px] z-[1]">
                    Contáctanos
                  </div>
                </div>
              </div>
              <div className="w-[180px] flex flex-row items-start justify-start gap-[38px] mq750:hidden">
                <div className="flex flex-col items-start justify-start pt-3.5 px-0 pb-0">
                  <div className="relative [text-decoration:underline] font-medium inline-block min-w-[42px] z-[1]">
                    Entrar
                  </div>
                </div>
                <button className="cursor-pointer [border:none] pt-3.5 pb-[15px] pr-[13px] pl-3.5 bg-[#8B1710] shadow-[0px_6px_12px_rgba(249,_192,_106,_0.22)] rounded-3xl flex flex-row items-start justify-start z-[1] hover:bg-brown">
                  <div className="h-12 w-[100px] relative shadow-[0px_6px_12px_rgba(249,_192,_106,_0.22)] rounded-3xl bg-[#8B1710] hidden" />
                  <div className="relative text-sm font-medium font-playfair text-white text-left inline-block min-w-[73px] z-[1]">
                    Registrarse
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="self-stretch flex flex-row items-start justify-between gap-[10px] max-w-full mq1125:flex-wrap">
          <div className="w-[546px] flex flex-col items-start justify-start pt-[7.5px] px-0 pb-0 box-border min-w-[546px] max-w-full mq750:min-w-full mq1125:flex-1">
            <div className="self-stretch flex flex-col items-start justify-start gap-[10px] max-w-full">
              <img
                className="self-stretch h-[291px] max-w-full overflow-hidden shrink-0 object-cover z-[1]"
                loading="lazy"
                alt=""
                src="ModuloEvento/frame-54@2x.png"
              />
              <div className="relative leading-[34px] inline-block max-w-full z-[1] mq450:text-base mq450:leading-[27px]">
                <p className="m-0">{`es una banda uruguaya de pop originaria de Paysandú, `}</p>
                <p className="m-0">{`considerada la más importante del género en la historia de `}</p>
                <p className="m-0">Uruguay. </p>
              </div>
              <button onClick={() => {
          setComponentState(1)
        }}
               className="cursor-pointer [border:none] pt-3.5 px-[21px] pb-[13px] bg-[#8B1710] shadow-[0px_6px_12px_rgba(249,_192,_106,_0.22)] rounded-3xl flex flex-row items-start justify-start whitespace-nowrap z-[1] hover:bg-brown">
                <div className="h-12 w-[134px] relative shadow-[0px_6px_12px_rgba(249,_192,_106,_0.22)] rounded-3xl bg-[#8B1710] hidden" />
                <b className="relative text-base inline-block font-playfair-display text-primary-contrast text-left min-w-[92px] z-[1]">
                  Comprar ya!
                </b>
              </button>
            </div>
          </div>
          <img
            className="w-[334px] h-[476px] max-w-full overflow-hidden object-cover min-w-[442px] z-[1] mq750:min-w-full"
            loading="lazy"
            alt=""
            src="ModuloEvento/losiracundos.jpg"
          />
        </div>

      </div>
    </section>
  );
};

export default Comp3;
