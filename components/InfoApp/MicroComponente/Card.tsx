import { CrearEventoIcon } from "../../icons"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper";
import router from "next/router";

export const Card = ({ DataCards }) => {
    return (
        <>
            <div className="hidden md:block">
                <div className="flex gap-10 items-center justify-center h-max">
                    {
                        DataCards.map((item: any, idx: any) => (
                            <div key={idx} className="bg-white  w-[20%] h-96  rounded-xl  drop-shadow-lg">
                                <div className="bg-titelCard rounded-xl h-40 flex items-center justify-center" >
                                    <p className="text-white text-center px-5">
                                        {item.title}
                                    </p>
                                </div>
                                <div className=" flex flex-col justify-center items-center p-5">
                                    <p className="text-center text-textGrisClaro h-24">
                                        {item.texto}
                                    </p>
                                    <div className="p-5 flex items-center justify-center space-x-3">
                                        <button onClick={()=> {router.push(item.router)}} className="bg-primaryOrg px-5 py-2 text-white">{item.button}</button>
                                        <CrearEventoIcon className="w-9 h-9 text-acento" />
                                    </div>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div >
            <div className="block md:hidden w-96">
                <div className="flex gap-10 items-center justify-center h-max">
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
                            DataCards.map((item: any, idx: any) => (
                                <SwiperSlide key={idx}>
                                    <div  className="bg-white flex flex-col items-center   md:w-[20%] mx-16 h-96  rounded-xl drop-shadow-lg mb-14" >
                                        <div className="bg-titelCard rounded-xl h-40 flex items-center justify-center w-full" >
                                            <p className="text-white text-center px-5">
                                                {item.title}
                                            </p>
                                        </div>
                                        <div className=" flex flex-col justify-center items-center p-5">
                                            <p className="text-center text-textGrisClaro h-24">
                                                {item.texto}
                                            </p>
                                            <div className="p-5 flex items-center justify-center space-x-3">
                                                <button onClick={()=> {router.push(item.router)}} className="bg-primaryOrg px-5 py-2 text-white">{item.button}</button>
                                                <CrearEventoIcon className="w-9 h-9 text-acento" />
                                            </div>
                                        </div>
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