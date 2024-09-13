import { FC } from 'react';
import BlockDefault from './BlockDefault';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../../context';
import { VscLayoutMenubar } from 'react-icons/vsc';
import { planSpace } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { ImInsertTemplate } from 'react-icons/im';
import { DiamanteIcon } from '../icons';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';


interface propsBlockPlatillas {

}

const BlockPlantillas: FC<propsBlockPlatillas> = () => {
  const { t } = useTranslation();
  const { user } = AuthContextProvider()
  const { event, setEvent } = EventContextProvider()
  const { psTemplates } = EventsGroupContextProvider()
  const handleClick = (item: planSpace) => {
    try {
      fetchApiEventos({
        query: queries.getPsTemplate,
        variables: { uid: user.uid }
      })
    } catch (error) {
      console.log(error)
    }
  }
  const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
  const redireccionFacturacion = window.origin.includes("://test") ? path?.replace("//", "//test") : path

  return (
    <div className="w-full h-full overflow-auto">
      {
        false &&
        <BlockDefault listaLength={psTemplates?.length}>
          {psTemplates?.map((item, idx) => {
            return (
              <div onClick={() => handleClick(item)} key={idx} className="w-full h-full p-2 flex-col justify-center items-center cursor-pointer">
                <div key={idx} className={`rounded-lg flex w-full h-full transform hover:scale-105 transition justify-start gap-2`}>
                  <ImInsertTemplate className={`text-primary w-5 h-5 2xl:w-12 2xl:h-12 `} />
                  <span className='w-[calc(100%-44px)] truncate'> {item?.title}</span>
                </div>
              </div>)
          })
          }

        </BlockDefault>
      }
      {true && (
        <div className="w-full py-2 text-xs 2xl:text-sm">
          <div className="flex flex-col items-center justify-center w-full h-full px-2">
            <p className="w-full text-center">
              <span className="text-primary ">{t("createtemplates ")}</span>
              {t("livingroom")}
            </p>
            <p className="hidden md:block w-full text-center px-4 mt-2">
              {t("designthelayout")}<br />{t("creativefreedom")}<br />{t("eventsOrganizer")}
            </p>
            <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2 cursor-default">
              <div>
                <DiamanteIcon />
              </div>
              <Link href={`${redireccionFacturacion}`}>
                <p>
                  {t("activateversion")}<span className="font-semibold cursor-pointer">{t("premium")}</span>
                </p>
              </Link>
            </div>
            <Link href={`${redireccionFacturacion}`}>
              <button className="text-white bg-primary px-7 py-1 rounded-lg" >
                {t("begin")}
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlockPlantillas