import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper";
import router from "next/router";


export const InfoGrid = ({ DataGrid }) => {
    return (
        <>
            <div className="hidden md:block">
                <div className="grid grid-cols-3 justify-items-center px-36  ">
                    {
                        DataGrid.map((item: any, idx: any) => (
                            <div key={idx} className="w-[70%] space-y-5">
                                <p className="text-xl font-semibold text-secondaryOrg">{item.title}</p>
                                <p className="text-secondaryOrg">{item.texto}</p>
                                <button onClick={()=> {router.push(item.router)}} className="bg-acento text-white px-5 py-1.5">{item.button}</button>
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className=" md:hidden w-96">
                <div className="grid  justify-items-center px-10  ">
                <Swiper
                        spaceBetween={50}
                        pagination={{ clickable: true }}
                        breakpoints={{
                          0: {
                            slidesPerView: 1,
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
                        DataGrid.map((item: any, idx: any) => (
                            <SwiperSlide key={idx}>
                            <div  className="sspace-y-5 mb-10">
                                <p className="text-xl font-semibold text-secondaryOrg">{item.title}</p>
                                <p className="text-secondaryOrg">{item.texto}</p>
                                <button onClick={()=> {router.push(item.router)}} className="bg-acento text-white px-5 py-1.5">{item.button}</button>
                            </div>
                            </SwiperSlide>
                        ))
                    }
                    </Swiper>
                </div>
            </div>

        </>
    )
}