import { AuthContextProvider, EventsGroupContextProvider } from "../../context";
import useHover from "../../hooks/useHover";
import { CrearEventoIcon } from "../icons";
import { Dispatch, FC, memo, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next';

interface propsCadEmpty {
  set: Dispatch<SetStateAction<boolean>>
  state: boolean
}

const CardEmpty: FC<propsCadEmpty> = ({ set, state }) => {
  const { t } = useTranslation();
  const { eventsGroup } = EventsGroupContextProvider();
  const [hoverRef, isHovered] = useHover();
  const { actionModals, setActionModals } = AuthContextProvider()

  const ConditionalAction = () => {
    if (eventsGroup.length >= 10) {
      setActionModals(!actionModals)
    } else {
      set(!state)
    }
  }
  
  return (
    <div
      //@ts-ignore
      ref={hoverRef}
      onClick={() => ConditionalAction()}
      className={`w-72 h-36 rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-lg bg-base border border-gray-100 transition ${isHovered
          ? "transform scale-105 duration-700  text-gray-400"
          : "text-primary"
        }`}
    >
      <CrearEventoIcon className="w-8 h-8" />
      <p className="font-display font-base text-md">{t("createevent")}</p>
    </div>
  );
};

export default memo(CardEmpty)
