
import { FC, useEffect, useState } from "react";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { Event, Task } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import { AuthContextProvider, EventContextProvider } from "../../context";
import { defaultImagenes } from "../../components/Home/Card";
import { TaskNew } from "../../components/Itinerario/MicroComponente/TaskNew";

interface props {
  evento: Event
  slug?: any
  query?: any
}


const Slug: FC<props> = (props) => {

  if (!props?.evento?.itinerarios_array?.length)
    return (
      <div className="bg-red-200 text-blue-700 w-full h-full text-center mt-20">
        Page not found error 404
      </div>
    )

  return (
    <ServicesVew eventProps={props.evento} querySlug={props.query} />
  )
};

export default Slug;

const ServicesVew = ({ eventProps, querySlug }) => {
  const { user } = AuthContextProvider();
  const f2 = eventProps?.itinerarios_array[0]?.tasks?.findIndex(({ _id }) => _id === querySlug?.task)
  const Task = eventProps?.itinerarios_array[0]?.tasks[f2]
  return (
    <section className={` absolute z-[50] w-[calc(100vw)] h-[100vh] top-0 left-4. bg-white`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2- -pr-[1px] md:px-0 gap-4 relative"
      >
        <div className={`bg-white w-full h-14 rounded-xl shadow-lg flex items-center justify-between `}>
          <div className='flex md:flex-1 flex-col px-2 md:px-6 font-display'>
            <div className='space-x-1'>
              <span className='md:hidden capitalize text-primary text-[12px] leading-[12px]'>{eventProps?.tipo}</span>
              <span className='md:hidden capitalize text-gray-600 text-[12px] leading-[20px] font-medium'>{eventProps?.nombre}</span>
            </div>
          </div>
          <div className='flex-1 md:flex-none md:w-[35%] h-[100%] flex flex-row-reverse md:flex-row items-center '>
            <img
              src={defaultImagenes[eventProps?.tipo]}
              className=" h-[90%] object-cover object-top rounded-md border-1 border-gray-600  hidden md:block"
              alt={eventProps?.nombre}
            />
            <div className='hidden md:flex flex-col font-display font-semibold text-md text-gray-500 px-2 md:pt-2 gap-2'>
              <span className='text-sm translate-y-2 text-primary text-[12px] first-letter:capitalize'>{eventProps?.tipo}</span>
              <span className='uppercase w-64 truncate '>{eventProps?.nombre}</span>
            </div>
          </div>
        </div>
        <div className="w-full px-4 md:px-10 py-4" >
          <div className="flex flex-col justify-center items-center">
            <span className="text-3xl md:text-[40px] font-title text-primary">{eventProps?.itinerarios_array[0]?.title}</span>
            <div className="w-[100px] bg-primary h-0.5 rounded-md mt-2" />
          </div>
        </div >
        <div className="w-full  mt-4">
          <TaskNew
            task={Task}
            itinerario={eventProps?.itinerarios_array[0]}
            view={"cards"}
            isTaskPublic={true}
            onClick={() => { }}
          />
        </div>
      </motion.div>
      <style jsx>
        {`
         
          .image {
            height: 400px;
          }

          @media only screen and (min-width: 1700px) {
            .image {
              height: 700px;
              
            }
          }
            @media only screen and (max-height: 530px) {
            .image {
              display: none;
              
            }
          }
        `}
      </style>
    </section>
  )
}


export async function getServerSideProps({ params, query }) {
  try {
    const p = params?.slug[0]?.split("-")
    const evento_id = p?.[1] || query?.event;
    const itinerario_id = p?.[2] || query?.itinerary;

    const evento = await fetchApiEventos({
      query: queries.getItinerario,
      variables: {
        evento_id,
        itinerario_id
      }
    })

    return {
      props: { ...params, query, evento },
    };
  } catch (error) {
    return {
      props: params,
    };

  }
}