import Link from 'next/link'
import { useContext } from 'react';
import LoadingContext from '../../context/LoadingContext';
import { Loading } from '../../utils/Funciones';

const Dropdown = (props) => {
  const { state, ListaBotones, set, ...rest } = props
  const { setLoading } = useContext(LoadingContext)
  return (
    <>
      <div
        className={`${state ? "" : "hidden"
          } absolute right-0 bottom-0 transform translate-y-full w-48 bg-white rounded-md overflow-hidden shadow-xl z-10`}
        onClick={() => set(!state)}
      >
        {ListaBotones.map((boton, index) => {
          return (
            // eslint-disable-next-line @next/next/link-passhref
            <Link key={index} href={boton.href}>
              <p onClick={Loading(setLoading)} className=" transition cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-purple-600 hover:text-white" {...rest}>{boton.titulo}</p>
            </Link>
          )
        })}
      </div>
    </>
  );
};

export default Dropdown;
