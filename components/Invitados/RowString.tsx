import { cloneElement, FC, useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { useAllowed } from "../../hooks/useAllowed";
import { EventContextProvider } from "../../context";
import { fetchApiEventos, queries } from "../../utils/Fetching";

interface props {
  initialValue: string
  dicc?: any
  Lista: { title: string, icon?: any }[]
  rowID: string
  columnID: string
}

export const RowString: FC<props> = (props) => {
  const { event, setEvent } = EventContextProvider()
  console.log(10000011, props)
  const { initialValue, dicc, Lista, rowID, columnID } = props
  const [value, setValue] = useState(initialValue ?? "No asignado");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAllowed] = useAllowed()

  const updateMyData = ({
    rowID,
    columnID,
    reemplazar,
    value,
    loading,
  }) => {
    try {
      // Para modificar el estado
      if (loading == true) {
        setEvent((viejo) => {
          const { invitados_array: arr } = viejo;
          const rowIndex = arr.findIndex((e) => e._id == rowID);
          const resultado = arr.map((invitado) => {
            if (invitado._id === rowID) {
              //Para escribir en base de datos
              fetchApiEventos({
                query: queries.editGuests,
                variables: {
                  eventID: event._id,
                  guestID: invitado._id,
                  variable: reemplazar,
                  value: value
                },
              });
              return {
                ...arr[rowIndex],
                [columnID]: value,
              };
            }
            return invitado;
          });
          return {
            ...viejo,
            invitados_array: resultado,
          };
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    setLoading(false);
    updateMyData({
      rowID,
      columnID,
      reemplazar: columnID,
      value: value,
      loading: loading,
    });
    setLoading(true);
  }, [value]);

  return (
    <ClickAwayListener onClickAway={() => setShow(false)}>
      <div className="relative w-full items-center justify-center flex">
        <button
          className="font-display text-gray-500 hover:text-gray-400 transition text-sm capitalize flex gap-2 items-center justify-center focus:outline-none"
          onClick={() => !isAllowed() ? null : setShow(!show)}
        >
          {dicc && cloneElement(dicc[value]?.icon, { className: "w-5 h-5" })}
          {value}
        </button>
        <ul
          className={`${show ? "block opacity-100" : "hidden opacity-0"
            } absolute bg-white transition shadow-lg rounded-lg overflow-hidden duration-500 top-12 -left-9 z-40`}
        >
          {Lista.map((item, index) => {
            return (
              <li
                key={index}
                className={`${value?.toLowerCase() === item?.title?.toLowerCase() && "bg-gray-200"} cursor-pointer flex gap-2 items-center py-4 px-6 font-display text-sm text-gray-500 hover:bg-base hover:text-gray-700 transition w-full capitalize`}
                onClick={() => {
                  setValue(item?.title);
                  setShow(!show);
                }}
              >
                {item?.icon && cloneElement(item.icon, { className: "w-5 h-5" })}
                {item?.title}
              </li>
            );
          })}
        </ul>
      </div>
    </ClickAwayListener>
  )
}