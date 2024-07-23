import { FC } from "react";

export const InfoHeader: FC = () => {
  return (
    <section className="self-stretch flex flex-row items-start justify-end pt-0 md:px-[65px] md:pb-[126px] box-border max-w-full text-left text-xl md:text-white font-playfair mq750:pl-8 mq750:pr-8 mq750:pb-[82px] mq750:box-border">
      <img
        className="w-full h-[700px] md:h-[768px] absolute !m-[0] top-[0px] right-[0px] left-[0px] max-w-full md:overflow-hidden shrink-0 md:object-cover"
        alt=""
        src="ModuloEvento/coffee_image.png"
      />
      <div className="md:flex-1 flex flex-col md:items-start justify-start gap-[88px] max-w-full">
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
              <button onClick={() => { }}
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


