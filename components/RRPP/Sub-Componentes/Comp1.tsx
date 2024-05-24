import { FC } from "react";
interface propsComp1 {
    componentState: any;
    setComponentState: any;
  
  }


const Comp1: FC<propsComp1> = ({componentState, setComponentState}) => {
  return (
    <div className="self-stretch bg-[#8B1710] flex flex-col md:flex-row items-start justify-center px-5 pt-5 box-border gap-[20px] max-w-full text-left text-[16px] text-white font-Clicker ">
      <div className="md:w-[690px] flex flex-col items-start justify-start gap-[19px] min-w-[690px] max-w-full mq1025:min-w-full mq1125:flex-1">
        <div className="self-stretch flex flex-row items-start justify-between gap-[20px] mq750:flex-wrap">
          <div className="relative mq450:text-13xl">
            Oro Verde
          </div>
          <div className="flex flex-row items-start justify-start gap-[40px] text-[16px] font-playfair-display mq450:gap-[20px]">
            <b className="relative inline-block min-w-[116px] mq450:text-2xl">
              Acerca de
            </b>
            <b className="relative inline-block min-w-[124px] mq450:text-2xl">
              Compañía
            </b>
          </div>
        </div>
        <div className="self-stretch flex flex-row items-start justify-start gap-[20px] max-w-full text-lg font-playfair-display mq750:flex-wrap">
          <div className="flex-1 flex flex-col items-start justify-start pt-px px-0 pb-0 box-border min-w-[247px] max-w-full text-sm">
            <div className="self-stretch flex flex-col items-start justify-start gap-[33px] mq450:gap-[16px]">
              <div className="self-stretch relative leading-[22px]">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industrys standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book.
              </div>
              <div className="flex flex-row items-start justify-start gap-[20px]">
                <img
                  className="h-6 w-6 relative min-h-[24px]"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/face.svg"
                />
                <img
                  className="h-6 w-6 relative min-h-[24px]"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/inta.svg"
                />
                <img
                  className="h-6 w-6 relative min-h-[24px]"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/yutu.svg"
                />
                <img
                  className="h-6 w-6 relative min-h-[24px]"
                  loading="lazy"
                  alt=""
                  src="ModuloEvento/tuite.svg"
                />
              </div>
            </div>
          </div>
          <div className="relative leading-[42px]">
            <p className="m-0">Menu</p>
            <p className="m-0">Features</p>
            <p className="m-0">{`News & Blogs`}</p>
            <p className="m-0">{`Help & Supports`}</p>
          </div>
          <div className="relative leading-[42px]">
            <p className="m-0">How we work</p>
            <p className="m-0">Terms of service</p>
            <p className="m-0">Pricing</p>
            <p className="m-0">FAQ</p>
          </div>
        </div>
      </div>
      <div className="w-[332px] flex flex-col items-start justify-start gap-[31px] min-w-[332px] max-w-full text-[16px] font-playfair-display mq450:gap-[15px] mq1125:flex-1">
        <b className="relative mq450:text-2xl">Contáctanos</b>
        <div className="self-stretch flex flex-col items-start justify-start gap-[28px] text-lg">
          <div className="self-stretch relative">
            Akshya Nagar 1st Block 1st Cross, Rammurthy nagar, Bangalore-560016
          </div>
          <div className="flex flex-col items-start justify-start gap-[22px]">
            <div className="relative inline-block min-w-[125px] whitespace-nowrap">
              +1 202-918-2132
            </div>
            <div className="relative whitespace-nowrap">beanscene@mail.com</div>
            <div className="relative">www.beanscene.com</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comp1;
