import { FallIcon, IconColors, InterrogacionIcon, ParkIcon, SnowIcon, SpringIcon, SummerIcon, LivingRoomIcon, PoolIcon, HouseIcon, } from "../icons";
import { Swiper, SwiperSlide, } from "swiper/react";
import { cloneElement, Dispatch, FC, MouseEventHandler, SetStateAction, useEffect, useState, } from "react";
import { capitalize } from "../../utils/Capitalize";
import { Form, Formik } from "formik";
import InputField from "../Forms/InputField";
import { useDelayUnmount } from "../../utils/Funciones";
import ModalBottom from "../Utils/ModalBottom";
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { EventContextProvider, EventsGroupContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";




interface propsInsideBlock extends schemaItem {
  setSelected?: Dispatch<
    SetStateAction<{ title: string; color: string; icon: any }>
  >;
  setEditing: any
  setFieldValue: any
  values?: values | {}
}

const InsideBlockWithButtons: FC<propsInsideBlock> = ({
  list,
  title,
  setEditing,
  setFieldValue
}) => {
  const toast = useToast()
  const { event, setEvent } = EventContextProvider()
  return (
    <div className="w-full flex items-center gap-2 ">
      {list.map((item, idx) => (
        <ElementItemInsideBlock
          key={idx}
          {...item}
          onClick={async () => {
            try {
              const result: any = await fetchApiEventos({ query: queries.eventUpdate, variables: { idEvento: event._id, variable: title, value: item.title }, token: null })
              if (result.errors) {
                throw new Error("Hubo un error")
              }
              setEvent({ ...event, [title]: item.title })
              setFieldValue(title, item)
              setEditing(false)
              toast("success", "Guardado con exito")
            } catch (error) {
              console.log(error)
              toast("error", "Ha ocurrido un error")
            }
          }}
        />
      ))}
    </div>
  );
};

const InsideBlockWithForm: FC<propsInsideBlock> = ({ setEditing, setFieldValue, title, values }) => {
  const { event, setEvent } = EventContextProvider()
  console.log("values", values)
  return (
    <div className="px-5">
      <Formik initialValues={values[title]} onSubmit={async (values) => {

        try {
          const result: any = await fetchApiEventos({
            query: queries.eventUpdate,
            variables: { idEvento: event._id, variable: title, value: values.title }, token: null
          })
          if (result?.errors) {
            throw new Error("Hubo un error")
          }
          setFieldValue(title, { ...values, icon: null })
          setEvent({ ...event, ...values })
          setEditing(false)
        } catch (error) {
          console.log(error)
        }

      }}>
        <Form className="w-full">
          <InputField
            name={"title"}
            placeholder={"Escribe tu tematica"}
            label={"Tématica del evento"}
          />
        </Form>
      </Formik>
    </div>
  );
};

const ElementItemInsideBlock: FC<{
  color: string;
  title: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  icon: any;
}> = ({ title, color, onClick, icon }) => {
  return (
    <button
      className="bg-white w-full h-full p-3 rounded-3xl flex flex-col items-center justify-center gap-1 transform transition hover:scale-105 focus:outline-none"
      onClick={onClick}
    >
      {icon && cloneElement(icon, { className: `${color} w-8 h-8` })}
      <p className={`text-gray-500 font-display text-sm`}>{title}</p>
    </button>
  );
};

interface schemaItem {
  title: string;
  list: { title: string; color: string; icon: any }[] | null;
}
const schema: schemaItem[] = [
  {
    title: "color",
    list: [
      { color: "text-yellow-300	", title: "Amarillo" },
      { color: "text-cyan-400	", title: "Celeste" },
      { color: "text-primary", title: "Rosado" },
      { color: "text-red-500", title: "Rojo" },
      { color: "text-purple-600", title: "Morado" },
      { color: "text-amber-100	", title: "Beige" },
      { color: "text-yellow-500", title: "Dorado" },
      { color: "text-slate-400", title: "Plata" },
    ].map((item) => ({ ...item, icon: <IconColors /> })),
  },
  {
    title: "temporada",
    list: [
      { title: "Invierno", icon: <SnowIcon />, color: "text-cyan-600" },
      { title: "Primavera", icon: <SpringIcon />, color: "text-lime-600" },
      { title: "Verano", icon: <SummerIcon />, color: "text-yellow-500" },
      { title: "Otoño", icon: <FallIcon />, color: "text-yellow-700" },
    ].map((item) => ({ ...item })),
  },
  {
    title: "estilo",
    list: [
      { title: "Aire libre", icon: <ParkIcon /> },
      { title: "Salón", icon: <LivingRoomIcon /> },
      { title: "Piscina", icon: <PoolIcon /> },
      { title: "En casa", icon: <HouseIcon /> },
    ].map((item) => ({ ...item, color: "text-gray-500" })),
  },
  {
    title: "tematica",
    list: null,
  },
  {
    title: "tarta",
    list: null,
  },
];

interface values {
  color: typeEvent,
  temporada: typeEvent,
  estilo: typeEvent,
  tarta: typeEvent,
  tematica: typeEvent,
}

interface typeEvent {
  title: string
  color: string
  icon: any | null
}

const BlockSobreMiEvento: FC = () => {
  const { event } = EventContextProvider()

  const initialValues2: values | {} = schema.reduce((acc, item) => {
    if (event) {
      acc[item.title] = {
        title: event[item.title] ?? "",
        color: item?.list?.find(e => e.title === event[item.title])?.color ?? null,
        icon: item?.list?.find(e => e.title === event[item.title])?.icon ?? null,
      }
    }
    return acc
  }, {})

  const [values, setValues] = useState<values | {}>(initialValues2);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [itemSelected, setItemSelected] = useState<schemaItem | null>(null)

  const setFieldValue = (field: string, value: string) => {
    setValues((old) => ({
      ...old,
      [field]: value,
    }));
  };

  const settings = {
    spaceBetween: 50,
    loop: true,
    //navigation: true,
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
    breakpoints: {
      "0": {
        slidesPerView: 2
      },
      "480": {
        slidesPerView: 4
      }
    }
  };

  useEffect(() => {
    !shouldRenderChild && setItemSelected(null)
  }, [shouldRenderChild])

  return (
    <div className="w-full h-max">
      {shouldRenderChild && (
        <ModalBottom state={isMounted} set={setIsMounted}>
          {itemSelected &&
            (itemSelected?.list ? (
              <InsideBlockWithButtons
                {...itemSelected}
                setEditing={setIsMounted}
                setFieldValue={setFieldValue}
              />
            ) : (
              <InsideBlockWithForm
                {...itemSelected}
                values={values}
                setEditing={setIsMounted}
                setFieldValue={setFieldValue}
              />
            ))}
        </ModalBottom>
      )}
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left">
        Sobre mi evento
      </h2>
      <Swiper
        pagination={{ clickable: true }}
        {...settings}

      >
        {schema.map((item, idx) => (
          <SwiperSlide key={idx} className="py-2 pb-8 relative">
            <AboutItem
              {...item}
              toggleClick={() => {
                if (!isMounted) {
                  setItemSelected(item)
                  setIsMounted(true)
                }
              }}
              value={values[item.title]}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default BlockSobreMiEvento;

interface propsElement extends schemaItem {
  value: typeEvent
  toggleClick: any
}

const AboutItem: FC<propsElement> = ({ title, value, toggleClick }) => {



  return (
    <>
      <button
        onClick={toggleClick}
        className="relative bg-white rounded-full w-32 md:w-40 h-32 md:h-40 shadow-md gap-2 flex flex-col items-center justify-center focus:outline-none mx-auto inset-x-0"
      >
        {!value ? (
          <InterrogacionIcon />
        ) : (
          value?.icon && cloneElement(value?.icon, {
            className: `${value?.color} w-10 h-10`,
          })
        )}
        <span className="leading-4 text-center">
          <p className="font-display font-light md:text-md text-gray-500">
            {title && capitalize(title)}
          </p>
          <p className={'font-display font-base text-xs md:text-sm text-gray-700 font-semibold'}>
            {value?.title && value.title.length > 10 ? value?.title && value.title.substring(0, 10) + "..." : value?.title && value.title}
          </p>
        </span>
      </button>
    </>
  );
};
