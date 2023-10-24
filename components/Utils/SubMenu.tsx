import { InvitadosIcon, MesaIcon } from "../icons"
import { GiGrandPiano } from 'react-icons/gi';
import { BsIntersect } from 'react-icons/bs';
import { ImInsertTemplate } from 'react-icons/im';
import { HiDocumentReport, HiTemplate } from 'react-icons/hi';

const sutMenus = [
  {
    title: "invitados",
    icon: <InvitadosIcon className="w-6 h-6" />,
  },
  {
    title: "mesas",
    icon: <MesaIcon className="w-6 h-6" />,
  },
  {
    title: "mobiliario",
    icon: <GiGrandPiano className="w-6 h-6" />,
  },
  {
    title: "zonas",
    icon: <BsIntersect className="w-6 h-6" />,
  },
  {
    title: "planos",
    icon: <HiTemplate className="w-6 h-6" />,
  },
  {
    title: "plantillas",
    icon: <ImInsertTemplate className="w-6 h-6" />,
  },
  {
    title: "resumen",
    icon: <HiDocumentReport className="w-6 h-6" />,
  },
]


export const SubMenu = ({ itemSelect, setItemSelect }) => {


  const handleClick = (elem) => {
    setItemSelect(elem?.title)
  }

  return (
    <div className="w-full h-full *gap-1 px-[2px] py-[1px] flex">
      {sutMenus.map((elem: any, idx: number) => {
        return (
          <div key={idx} onClick={() => handleClick(elem)} className={`w-1/6 h-full flex flex-col items-center justify-center rounded-lg ${elem.title == itemSelect ? "bg-base text-primary font-semibold" : "bg-primary text-white"} ${elem?.title == "invitados" && "md:hidden"}`}>
            {elem?.icon}
            <span className={`capitalize text-[10px] leading-none`}>{elem?.title}</span>
          </div>
        )
      })}

    </div>
  )
}