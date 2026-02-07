import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper";

export const GestionEventosItems = ({ DataObject }) => {
    return (
        <>
            <div className="hidden md:block">
                <div className="flex space-x-10 mt-10 ">
                    {
                        DataObject.map((item: any, idx: any) => (
                            <div key={idx} className="flex flex-col items-center justify-center space-y-2">
                                <img src={item.img} alt={item.alt} className=" h-28 " />
                                <p className="text-secondaryOrg">{item.texto}</p>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className=" md:hidden w-80 ">
                <div className="flex flex-col space-x-10 mt-16 ">
                    <Swiper
                        spaceBetween={50}
                        pagination={{ clickable: true }}
                        breakpoints={{
                          0: {
                            slidesPerView: 2,
                            spaceBetween: 0,
                          },
                          768: {
                            slidesPerView: 3,
                            spaceBetween: 25,
                            allowTouchMove: false,
                          },
                        }}
                        className="w-full"
                        modules={[Pagination, Autoplay]}
                    >
                        {
                            DataObject.map((item: any, idx: any) => (
                                <SwiperSlide key={idx}>
                                    <div className="flex justify-center flex-col items-center space-y-2 mb-10 ">
                                        <img src={item.img} alt={item.alt} className="h-28" />
                                        <p className="text-secondaryOrg">{item.texto}</p>
                                    </div>
                                </SwiperSlide>
                            ))
                        }
                    </Swiper>
                </div>
            </div >
        </>
    )
}