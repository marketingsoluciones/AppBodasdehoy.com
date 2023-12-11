import { FC } from 'react';
import BlockDefault from './BlockDefault';
import { AuthContextProvider, EventContextProvider, EventsGroupContextProvider } from '../../context';
import { VscLayoutMenubar } from 'react-icons/vsc';
import { planSpace } from '../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { ImInsertTemplate } from 'react-icons/im';
import { DiamanteIcon } from '../icons';
import Link from 'next/link';


interface propsBlockPlatillas {

}

const BlockPlantillas: FC<propsBlockPlatillas> = () => {
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
  const redireccionFacturacion = window.origin.includes("://test") ? process.env.NEXT_PUBLIC_DIRECTORY_FACTURACION?.replace("//", "//test") : process.env.NEXT_PUBLIC_DIRECTORY_FACTURACION

  return (
    <>
      {
        false &&
        <BlockDefault>
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
        <div className="flex flex-col items-center justify-center h-full overflow-y-auto ">
          <p className="text-sm font-display">
            <span className="text-primary ">Crear Plantillas </span>
            para organizar tu salón.
          </p>
          <p className="text-sm text-center md:block hidden ">
            Diseña la distribución de tu celebración con la <br /> libertad  creativa que te facilita tu<br /> EventosOrganizador.
          </p>
          <div className="text-yellow-500 flex items-center justify-center space-x-1 md:my-2  text-sm cursor-default">
            <div>
              <DiamanteIcon />
            </div>
            <Link href={`${redireccionFacturacion}`}>
              <p>
                Activar la versión <span className="font-semibold cursor-pointer">PREMIUM</span>
              </p>
            </Link>
          </div>
          <Link href={`${redireccionFacturacion}`}>
            <button className="text-sm text-white bg-primary px-7 py-1 rounded-lg" >
              Empezar
            </button>
          </Link>
        </div>
      )}
    </>
  )
}

export default BlockPlantillas