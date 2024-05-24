import { FC } from "react";
import Header from "./MenuComp";
interface propsComp3 {
  componentState: any;
  setComponentState: any;

}


const Comp3: FC<propsComp3> = ({ componentState, setComponentState }) => {
  return (
    <section className="self-stretch flex flex-row items-start justify-end pt-0 md:px-[65px] md:pb-[126px] box-border max-w-full text-left text-xl md:text-white font-playfair mq750:pl-8 mq750:pr-8 mq750:pb-[82px] mq750:box-border">
      <div className="md:flex-1 flex flex-col md:items-start justify-start gap-[88px] max-w-full">
    
{/*         <header className="self-stretch flex flex-row items-start justify-start py-0 px-7 box-border max-w-full text-left text-16xl text-white font-clicker-script">
          <div className="flex-1 flex flex-row items-start justify-between max-w-full gap-[20px]">
            <div className="flex flex-col items-start justify-start pt-px px-0 pb-0">
              <div className="relative inline-block min-w-[118px] font-Clicker whitespace-nowrap z-[1]">
                <img className="flex w-24 h-14 " src="ModuloEvento/LOGOMACHALA 1.png" alt="" />
              </div>
            </div>
            <div className="w-auto flex flex-row items-start justify-start gap-[209px] max-w-full text-sm font-playfair-display mq750:w-[600px] mq1025:w-[389px] mq1025:gap-[104px] mq450:gap-[52px]">
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
        </header> */}
        <Header componentState={componentState} setComponentState={setComponentState} />
        <div className="md:self-stretch flex flex-col md:flex-row md:items-start md:justify-between gap-[10px] md:max-w-full ">
          <div className="md:w-[546px] flex flex-col md:items-start md:justify-start md:pt-[7.5px]  md:min-w-[546px] md:max-w-full ">
            <div className="self-stretch flex flex-col md:items-start  items-center justify-start gap-[10px] max-w-full">
              <img
                className="md:self-stretch md:h-[291px] md:max-w-full md:overflow-hidden md:shrink-0 md:object-cover z-30"
                loading="lazy"
                alt=""
                src="ModuloEvento/frame-54@2x.png"
              />
              <div className="relative md:leading-[34px] md:inline-block max-w-full  md:px-0 px-3 md:py-0 py-5  text-center md:text-left text-white ">
                <p className="m-0">Es una banda uruguaya de pop originaria de Paysandú, 
                considerada la más importante del género en la historia de
                Uruguay. </p>
              </div>
              <button onClick={() => {
                setComponentState(2)
              }}
                className="cursor-pointer pt-3.5 px-[21px] pb-3.5 bg-[#8B1710] rounded-3xl flex items-start justify-start whitespace-nowrap z-[1] ">
                <div className="h-12 w-[134px] relative rounded-3xl bg-[#8B1710] hidden" />
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
