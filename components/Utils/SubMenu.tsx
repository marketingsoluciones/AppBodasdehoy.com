import { MesaIcon } from "../icons"
const sutMenus = [
  {
    title: "invitados",
  },
  {
    title: "mesas",
  },
  {
    title: "mobiliario",
  },
  {
    title: "zonas",
  },
  {
    title: "plantilla",
  },
  {
    title: "resumen",
  },
]


export const SubMenu = ({ itemSelect, setItemSelect }) => {


  const handleClick = (elem) => {
    setItemSelect(elem?.title)
  }

  return (
    <div className="w-full h-full gap-2 px-2 py-1 flex">
      {sutMenus.map((elem: any, idx: number) => {
        return (
          <div key={idx} onClick={() => handleClick(elem)} className={`w-1/6 h-full flex flex-col items-center justify-center rounded-sm ${elem.title == itemSelect ? "bg-base text-primary font-semibold" : "bg-primary text-white"} ${elem?.title == "invitados" && "md:hidden"}`}>
            <MesaIcon className="w-6 h-6" />
            <span className={`capitalize text-[10px] leading-none`}>{elem?.title}</span>
          </div>
        )
      })}

    </div>
  )
}