import { AddIcon } from "../../icons"
import { FC, useState } from "react";
import { useAllowed } from "../../../hooks/useAllowed";
import { Task } from "../../../utils/Interfaces";
import { IconArray, NewSelectIcon } from "../VistaTabla/NewSelectIcon";


interface SelectIconNewProps {
  handleChange: (field: string, value: any) => void;
  owner: boolean;
  task: Task;
}

export const SelectIconNew: FC<SelectIconNewProps> = ({ handleChange, owner, task }) => {
  const [openIcon, setOpenIcon] = useState(false)
  const [isAllowed, ht] = useAllowed()

  return (
    <>
      <div className={`${["/public-card/servicios", "/public-Itinerary"].includes(window?.location?.pathname) || !task?.estatus ? "" : "cursor-pointer hover:text-gray-800"} w-full h-full flex items-center justify-center text-gray-600 `}
        onClick={() => {
          ["/public-card/servicios", "/public-Itinerary"].includes(window?.location?.pathname)
            ? null
            : !isAllowed()
              ? ht()
              : ["/itinerario", "/servicios"].includes(window?.location?.pathname)
                ? owner
                  ? setOpenIcon(!openIcon)
                  : task?.estatus === false || task?.estatus === null || task?.estatus === undefined
                    ? null
                    : setOpenIcon(!openIcon)
                : setOpenIcon(!openIcon)
        }}>
        {task?.icon
          ? <div className="border-[1px] border-gray-500 border-dashed rounded-full p-1 w-[90%] h-[90%] flex items-center justify-center">
            {IconArray.find((elem) => elem?.title === task?.icon)?.icon}
          </div>
          : <AddIcon />}
      </div>
      {openIcon
        ? <NewSelectIcon
          onChange={handleChange as (value: string) => void}
          value={task?.icon}
          onClose={() => setOpenIcon(false)}
        />
        : null
      }
    </>
  )
}