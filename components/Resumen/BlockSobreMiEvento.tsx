import { FallIcon, IconColors, InterrogacionIcon, ParkIcon, SnowIcon, SpringIcon, SummerIcon, LivingRoomIcon, PoolIcon, HouseIcon, } from "../icons";
import { Swiper, SwiperSlide, } from "swiper/react";
import { cloneElement, Dispatch, FC, MouseEventHandler, SetStateAction, useEffect, useState, } from "react";
import { capitalize } from "../../utils/Capitalize";
import { Form, Formik } from "formik";
import InputField from "../Forms/InputField";
import { useDelayUnmount } from "../../utils/Funciones";
import ModalBottom from "../Utils/ModalBottom";
import { fetchApiBodas, fetchApiEventos, queries } from '../../utils/Fetching';
import { AuthContextProvider, EventContextProvider } from "../../context";
import { useToast } from "../../hooks/useToast";
import { useAllowed } from "../../hooks/useAllowed";
import { useTranslation } from 'react-i18next';
import { PiChurchLight } from "react-icons/pi";
import { FaCheck } from "react-icons/fa";
import { image } from "../../utils/Interfaces";

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
  const { t } = useTranslation();
  return (
    <div className="w-full flex items-center gap-2 ">
      {list.map((item, idx) => {
        return (
          <ElementItemInsideBlock
            key={idx}
            {...item}
            onClick={async () => {
              try {
                const result: any = await fetchApiEventos({
                  query: queries.eventUpdate,
                  variables: { idEvento: event._id, variable: title, value: item.title },
                  token: null
                })
                if (result.errors) {
                  throw new Error("Hubo un error")
                }
                setEvent({ ...event, [title]: item.title })
                setFieldValue(title, item)
                setEditing(false)
                toast("success", t("Guardado con éxito"))
              } catch (error) {
                console.log(error)
                toast("error", t("Ha ocurrido un error"))
              }
            }}
          />
        )
      })}
    </div>
  );
};

const InsideBlockWithMultiSelected: FC<propsInsideBlock> = ({
  list,
  title,
  setEditing,
  setFieldValue
}) => {
  const toast = useToast()
  const { event, setEvent } = EventContextProvider()
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState(event.color)
  console.log(selectedItems)

  const handleItemClick = (item) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleSave = async () => {
    try {
      const result: any = await fetchApiEventos({
        query: queries.eventUpdate,
        variables: { idEvento: event._id, variable: title, value: JSON.stringify(selectedItems) },
        token: null
      })

      setEvent({ ...event, [title]: selectedItems })
      toast("success", t("Guardado con éxito"))
    } catch (error) {
      console.log(error)
      toast("error", t("Ha ocurrido un error"))
    }
  }


  return (
    <div className="w-full flex items-center gap-2 ">
      {list.map((item, idx) => {
        return (
          <ElementItemInsideBlockSelect
            key={idx}
            {...item}
            onClick={() => {
              handleItemClick(item.title)
            }}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            title={item.title}
          />
        )

      })}
      <button onClick={() => handleSave()} className="border-primary border font-display focus:outline-none text-primary hover:text-white text-xs bg-white hover:bg-primary px-3 py-1 rounded-lg transition mb-[10px]">
        <FaCheck />
      </button>
    </div>
  );
};

const InsideBlockWithForm: FC<propsInsideBlock> = ({ setEditing, setFieldValue, title, values, }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider()
  const toast = useToast()

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
          setEvent({ ...event, [title]: values.title })
          setFieldValue(title, { ...values, icon: null })
          setEditing(false)
          toast("success", t("Guardado con éxito"))
        } catch (error) {
          console.log(error)
          toast("error", t("Ha ocurrido un error"))
        }
      }}>
        <Form className="w-full flex items-end space-x-2  ">
          <InputField
            name={"title"}
            placeholder={t("writeyourtheme")}
            label={t("eventtheme")}
          />
          <button type="submit" className="border-primary border font-display focus:outline-none text-primary hover:text-white text-xs bg-white hover:bg-primary px-3 py-1 rounded-lg transition mb-[10px]">
            <FaCheck />
          </button>
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
  const { t } = useTranslation()
  return (
    <button
      className="bg-white w-full h-full p-3 rounded-3xl flex flex-col items-center justify-center gap-1 transform transition hover:scale-105 focus:outline-none"
      onClick={onClick}
    >
      {icon && cloneElement(icon, { className: `${color} w-8 h-8` })}
      <p className={`text-gray-500 font-display text-sm`}>{t(title)}</p>
    </button>
  );
};

const ElementItemInsideBlockSelect: FC<{
  color: string;
  title: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  icon: any;
  selectedItems: any
  setSelectedItems: any
}> = ({ title, color, onClick, icon, selectedItems }) => {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      className={`
        w-full h-full p-3 rounded-3xl flex flex-col items-center justify-center gap-1 transform transition hover:scale-105 focus:outline-none
        ${selectedItems.includes(title) ? 'bg-gray-200' : ''}
      `}
    >
      {icon && cloneElement(icon, { className: `${color} w-8 h-8` })}
      <p className={`text-gray-500 font-display text-sm`}>{t(title)}</p>
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
      { color: "text-pink-400", title: "Rosado" },
      { color: "text-red", title: "Rojo" },
      { color: "text-purple-600", title: "Morado" },
      { color: "text-amber-100	", title: "Beige" },
      { color: "text-yellow-500", title: "Dorado" },
      { color: "text-slate-400", title: "Plata" },
      { color: "text-orange-400", title: "Naranja" },
      { color: "text-lime-600", title: "verde" },
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
      { title: "Salon historico", icon: <PiChurchLight /> },
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
  temática: typeEvent,
}

interface typeEvent {
  title: string
  color: string
  icon: any | null
}

const BlockSobreMiEvento: FC = () => {
  const { t } = useTranslation();
  const { event } = EventContextProvider()
  const [values, setValues] = useState<values | {}>({});
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const shouldRenderChild = useDelayUnmount(isMounted, 500);
  const [itemSelected, setItemSelected] = useState<schemaItem | null>(null)

  useEffect(() => {
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
    setValues(initialValues2)
  }, [event])

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
    dots: true,
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
            (itemSelected?.list ? itemSelected?.title != "color" ? (
              <InsideBlockWithButtons
                {...itemSelected}
                setEditing={setIsMounted}
                setFieldValue={setFieldValue}
              />
            ) :
              (
                <InsideBlockWithMultiSelected
                  {...itemSelected}
                  setEditing={setIsMounted}
                  setFieldValue={setFieldValue}
                />
              )
              : (
                <InsideBlockWithForm
                  {...itemSelected}
                  values={values}
                  setEditing={setIsMounted}
                  setFieldValue={setFieldValue}
                />
              ))}
        </ModalBottom>
      )}
      <h2 className="font-display text-xl font-semibold text-gray-500 pb-2 text-left first-letter:capitalize">
        {t("aboutmyevent")}
      </h2>
      <Swiper
        pagination={{ clickable: true }}
        {...settings}

      >
        {schema.map((item, idx) => (
          <SwiperSlide key={idx} className="py-2 pb-8 relative">
            {item.title != "tarta" && <AboutItem
              {...item}
              toggleClick={() => {
                if (!isMounted) {
                  setItemSelected(item)
                  setIsMounted(true)
                }
              }}
              value={values[item.title]}
            />}
            {
              item.title === "tarta" && <TartaButton
                {...item}
                toggleClick={() => {
                  if (!isMounted) {
                    setItemSelected(item)
                    setIsMounted(true)
                  }
                }}
                value={values[item.title]}
                setFieldValue={setFieldValue}
              />
            }
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
  setFieldValue?: any
}

const AboutItem: FC<propsElement> = ({ title, value, toggleClick }) => {
  const { t } = useTranslation();
  const [isAllowed, ht] = useAllowed()
  const { event, setEvent } = EventContextProvider()
  const length = event.color.length


  return (
    <>
      <button
        onClick={() => !isAllowed() ? ht() : toggleClick()}
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
            {title && capitalize(t(title))}
          </p>
          {
            typeof value?.title != "object" &&
            <p className={'font-display font-base text-xs md:text-sm text-gray-700 font-semibold'}>
              {
                t(value?.title) && t(value.title).toString().length > 10 ? t(value?.title) && t(value.title).substring(0, 10) + "..." : t(value?.title) && t(value.title)
              }
            </p>
          }
          {

            typeof value?.title === "object" &&
            <div className="flex  items-center space-x-2">

              <p className={`font-display font-base text-xs md:text-sm text-gray-700 font-semibold truncate overflow-hidden w-full* ${length > 1 ? "h-10" : "w-full"} `}>

                {
                  event?.color?.map((item, idx) => {
                    return (
                      <div key={idx}>
                        {item}
                      </div>
                    )
                  })
                }
              </p>
              {
                length > 2 &&
                <p className="font-display font-base text-xs md:text-sm text-gray-700 font-semibold" >
                  + {length - 2}
                </p>
              }
            </div>
          }
        </span>
      </button>
    </>
  );
};

const TartaButton: FC<propsElement> = ({ title, value, toggleClick, setFieldValue }) => {
  const { t } = useTranslation();
  const [isAllowed, ht] = useAllowed()
  const { event, setEvent } = EventContextProvider()
  const { config } = AuthContextProvider()

  const [loading, setLoading] = useState<boolean>(false)

  const toast = useToast()

  const handleChange = async (e: any) => {
    setLoading(true)
    try {
      const file = e.target.files[0]
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result: Partial<image> = await fetchApiBodas(
          {
            query: queries.singleUpload,
            variables: { file, use: "tarta" },
            type: "formData",
            development: config?.development
          }
        )
        if (result?.i640) {
          await fetchApiEventos({
            query: queries.eventUpdate,
            variables: { idEvento: event._id, variable: title, value: result.i640 },
            token: null
          })
          setEvent({ ...event, "tarta": result.i640 })
          toast("success", t("imagesuccessfully"))
        } else {
          toast("error", t("El tipo de imagen no es correcta"))
        }
      }
      reader.readAsDataURL(file);
      setTimeout(() => {
        setLoading(false)
      }, 500);
    } catch (error) {
      setTimeout(() => {
        setLoading(false)
      }, 500);
      toast("error", t("errorloadingimage"))
      console.log(error)
    }
  }

  return (
    <div className="relative bg-white rounded-full w-32 md:w-40 h-32 md:h-40 shadow-md gap-2 flex flex-col items-center justify-center focus:outline-none mx-auto inset-x-0">
      <input
        id="file"
        type="file"
        name="file"
        accept="image/*"
        required
        onChange={(e) => handleChange(e)}
        className="hidden"
      />
      <label
        onClick={() => !isAllowed() ? ht() : null}
        htmlFor={!isAllowed() ? "null" : "file"}
        className="absolute"
      >
        {!value ? (
          <InterrogacionIcon />
        ) : (
          value?.icon && cloneElement(value?.icon, {
            className: `${value?.color} w-10 h-10`,
          })
        )}
        <span className="leading-4 text-center">
          <img src={`https://apiapp.bodasdehoy.com${event.tarta}`} alt={"tarta"} className={"border-none border-2 rounded-md  h-20 w-20 hover:opacity-50 cursor-pointer object-cover object-center mb-2"} />

          <p className="font-display font-light md:text-md text-gray-500">
            {title && capitalize(t(title))}
          </p>
        </span>
      </label>
    </div>
  );
};
