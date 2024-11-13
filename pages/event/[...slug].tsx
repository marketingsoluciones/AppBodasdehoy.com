
import { FC, useEffect, useReducer } from "react";
import dynamic from 'next/dynamic'
import { useRouter } from "next/router";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { Event, Itinerary } from "../../utils/Interfaces";
import { motion } from "framer-motion"
import BlockTitle from "../../components/Utils/BlockTitle";
import { BoddyIter } from "../../components/Itinerario/BoddyIter";

interface props {
  evento: Event
}

const Slug: FC<props> = (props) => {
  console.log(1001112, { props })

  if (!props.evento.itinerarios_array.length)
    return (
      <div className="bg-red-200 text-blue-700 w-full h-full text-center mt-20">
        Page not found error 404
      </div>
    )

  return (
    <section className={"absolute z-[50] w-[calc(100vw-40px)] h-[100vh] top-0 left-4"}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-screen-lg mx-auto inset-x-0 w-full pl-2 pr-[1px] md:px-0 gap-4 relative">
        <BlockTitle title={props.evento.nombre} />
        {/* <BoddyIter /> */}
        {/* {createPdf
                        ? <Modal openIcon={createPdf} setOpenIcon={setCreatePdf} classe={"h-[50%] w-[85%]"} >
                            <MyDocument IterArryst={IterArryst} />
                        </Modal>
                        : null
                    } */}
      </motion.div>
    </section>
  )

};

export default Slug;

export async function getServerSideProps({ params }) {
  try {
    console.log(params)
    const p = params?.slug[0]?.split("-")
    const recurse = p[0]
    const evento_id = p[1]
    const itinerario_id = p[2]
    console.log({ recurse, evento_id, itinerario_id })

    const evento = await fetchApiEventos({
      query: queries.getItinerario,
      variables: {
        evento_id,
        itinerario_id
      }
    })

    console.log(1001110, evento)

    return {
      props: { ...params, evento },
    };
  } catch (error) {
    console.log(1001111, error.response.data)
    return {
      props: params,
    };

  }
}
