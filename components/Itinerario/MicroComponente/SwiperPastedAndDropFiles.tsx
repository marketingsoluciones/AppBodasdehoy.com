import { FC, useEffect, useState } from "react"
import { Swiper, SwiperProps, SwiperSlide, useSwiper } from "swiper/react"
import { PastedAndDropFile } from "./InputComments";
import { Mousewheel } from "swiper";
import { FileIconComponent } from "./FileIconComponent";
// import 'swiper/css';
// import 'swiper/css/pagination';

interface props {
  pastedAndDropFiles: PastedAndDropFile[]
  slideSelect: number
  setSlideSelect: any
}

export const SwiperPastedAndDropFiles: FC<props> = ({ pastedAndDropFiles, slideSelect, setSlideSelect }) => {

  const settings: SwiperProps = {
    spaceBetween: 0,
    slidesPerView: 8,
    slideToClickedSlide: true,
    loop: false,
    centeredSlides: true,
    pagination: {
      clickable: true,
    },
    modules: [Mousewheel],
    mousewheel: true,
  };

  return (
    <div className="w-full h-full flex justify-center">
      <Swiper
        pagination={{ clickable: true }}
        {...settings}
        className="w-[300px] h-full"
      >
        {pastedAndDropFiles.map((item, idx) => {
          return (
            <SwiperSlide key={idx} onClick={(e) => {
              setSlideSelect(idx)
            }} >
              <div className="w-[40px] h-[40px] relative cursor-pointer flex flex-col items-center justify-start">
                <div className="w-[87%] h-[87%] flex items-center justify-center">
                  {item.type === "image"
                    ? <img src={typeof item.file === "string" ? item.file : ""} alt="Imagen" style={{ width: '100%', height: '100%', objectFit: "cover" }} className="rounded-md" />
                    :
                    <FileIconComponent extension={item.name.split(".").slice(-1)[0]} className="w-7 h-[33px] flex items-center border-[1px] border-gray-300 rounded-[3px]" />
                  }
                </div>
                {slideSelect === idx && <div className="bg-primary w-[36px] flex-1 my-[1px]" />}
              </div>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}