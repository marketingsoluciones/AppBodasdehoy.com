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
  const { user, config } = AuthContextProvider()
  const { event, setEvent, planSpaceActive } = EventContextProvider()
  const { psTemplates } = EventsGroupContextProvider()
  const handleClick = async (item: planSpace) => {
    if (!confirm(t("loadtemplatequestion") || `¿Cargar la plantilla "${item.title}"? Esto reemplazará el plano actual.`)) return
    try {
      const result = await fetchApiEventos({
        query: queries.getPsTemplate,
        variables: { evento_id: event?._id, development: config?.development || "bodasdehoy" }
      })
      // If result contains templates, find the selected one and apply
      const templates = Array.isArray(result) ? result : result?.psTemplates || []
      const template = templates.find((t: any) => t._id === item._id || t.title === item.title)
      if (template) {
        // Apply template tables and elements to current planSpace
        const currentPlanSpace = event.planSpace?.find((ps: any) => ps._id === planSpaceActive?._id)
        if (currentPlanSpace) {
          currentPlanSpace.tables = template.tables || []
          currentPlanSpace.elements = template.elements || []
          setEvent({ ...event })
        }
      }
    } catch (error) {
      console.error("[BlockPlantillas] Error cargando template:", error)
    }
  }
  const path = `${process.env.NEXT_PUBLIC_CMS}/facturacion`
  const redireccionFacturacion = (typeof window !== 'undefined' && window.origin.includes("://test")) ? path?.replace("//", "//test") : path

  return (
    <div className="w-full h-full overflow-auto">
      {psTemplates?.length > 0 ? (
        <BlockDefault listaLength={psTemplates?.length}>
          {psTemplates?.map((item, idx) => (
            <div onClick={() => handleClick(item)} key={idx} className="w-full h-full p-2 flex-col justify-center items-center cursor-pointer">
              <div className="rounded-lg flex w-full h-full transform hover:scale-105 transition justify-start gap-2">
                <ImInsertTemplate className="text-primary w-5 h-5 2xl:w-12 2xl:h-12" />
                <span className="w-[calc(100%-44px)] truncate">{item?.title}</span>
              </div>
            </div>
          ))}
        </BlockDefault>
      ) : (
        <div className="w-full py-2 text-xs 2xl:text-sm">
          <div className="flex flex-col items-center justify-center w-full h-full px-2">
            <VscLayoutMenubar className="text-gray-300 w-8 h-8 mb-2" />
            <p className="w-full text-center text-gray-500">
              {t("createtemplates") || "No hay plantillas guardadas"}
            </p>
            <p className="w-full text-center text-gray-400 text-[10px] mt-1">
              {t("designthelayout") || "Usa el icono de guardar en la barra del plano"}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlockPlantillas