import Link from 'next/link'
import { useContext } from 'react';
import LoadingContext from '../../context/LoadingContext';
import { Loading } from '../../utils/Funciones';

type DropdownProps = {
  state: boolean;
  ListaBotones: Array<{ href: string; titulo: string }>;
  set: (state: boolean) => void;
  [key: string]: any;
};

const Dropdown = (props: DropdownProps) => {
  const { state, ListaBotones, set, ...rest } = props
  const { setLoading } = useContext(LoadingContext)
  return (
    <>
      <div
        className={`${state ? "" : "hidden"
          } absolute right-0 bottom-0 transform translate-y-full w-48 bg-white rounded-md overflow-hidden shadow-xl z-10`}
        onClick={() => set(!state)}
      >
        {ListaBotones.map((boton: { href: string; titulo: string }, index: number) => {
          return (
            <Link key={index} href={boton.href}>
              <p onClick={() => Loading(setLoading)} className=" transition cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white" {...rest}>{boton.titulo}</p>
            </Link>
          )
        })}
      </div>
    </>
  );
};

export default Dropdown;
