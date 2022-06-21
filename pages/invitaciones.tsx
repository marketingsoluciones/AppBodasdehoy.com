import {forwardRef,useContext,useEffect,useMemo,useRef,useState,} from "react";
import Breadcumbs from "../components/DefaultLayout/Breadcumb";
import {CompartirIcon,InvitacionesIcon,SubirImagenIcon2,} from "../components/icons";
import BlockTitle from "../components/Utils/BlockTitle";
import useHover from "../hooks/useHover";
import { Swiper, SwiperSlide } from "swiper/react";
import ModuloSubida from "../components/Invitaciones/ModuloSubida";
import { motion } from "framer-motion";
import { EventContextProvider } from "../context";
import { useRowSelect, useSortBy, useTable } from "react-table";
import { api } from "../api";
import Banner from "../components/Invitaciones/Banner";
import Test from '../components/Invitaciones/Test'
import VistaPrevia from "../components/Invitaciones/VistaPrevia";

const Invitaciones = () => {
  const [hoverRef, isHovered] = useHover();
  const { event } = EventContextProvider();

  return (
    <section className="bg-base w-full pb-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="max-w-screen-lg mx-auto inset-x-0 w-full px-5 md:px-0 gap-4"
      >
        
        <Breadcumbs />
    
        <BlockTitle title="Invitaciones" />

        <div className="w-full flex-col flex md:flex-row my-6 gap-6 relative">
          
          <div ref={hoverRef} className="relative w-full h-96 md:w-1/3 ">
            <div className={`hidden md:block h-40 bg-secondary w-20 rounded-xl  absolute z-0 left-0 top-0 bottom-0 m-auto transform transition duration-400 ${isHovered && "-translate-x-1/2"} `}>
              <div className="w-1/2 text-white flex flex-col items-center justify-center h-full gap-4">
                <CompartirIcon />
                <SubirImagenIcon2 />
              </div>
            </div>
            <ModuloSubida evento={event} />
          </div>

          <div className="w-full md:w-2/3 gap-6 h-full relative flex-col flex justify-end">
            <EstadisticasInvitaciones />
            <Test />
          </div>

        </div>

        {event?.invitados_array?.length > 0 && (
          <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
            <TablaDeInvitados />
          </div>
        )}

        <VistaPrevia evento={event} />

        <h2 className="font-display font-semibold text-2xl text-gray-500 p-4">
          Diseña tu invitación
        </h2>
        <div className="w-full rounded-xl bg-secondary shadow-lg py-3 mb-10 px-6">
          <p className=" font-display">
            Encuentra a un diseñador para tu invitación
          </p>
        </div>
        <Banner />
        </motion.div>
      <style jsx>
        {`
          section {
            min-height: calc(100vh - 9rem);
          }
        `}
      </style>
    </section>
  );
};

export default Invitaciones;

const EstadisticasInvitaciones = () => {
  const { event } = EventContextProvider();
  const Invitaciones = event?.invitados_array?.reduce(
    (acc, invitado) => {
      if (invitado.invitacion) {
        acc.enviadas++;
        acc.total++;
      } else {
        acc.pendientes++;
        acc.total++;
      }
      return acc;
    },
    { enviadas: 0, pendientes: 0, total: 0 }
  );

  return (
    <div>
      <h2 className="font-display font-semibold text-gray-500 text-2xl text-center py-4">
        Estadisticas de invitaciones
      </h2>
      <div className="bg-white py-10 w-full shadow-lg rounded-xl ">
        <Swiper
          spaceBetween={50}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 25,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 25,
              allowTouchMove: false,
            },
          }}
          className="w-full h-max flex gap-12 items-center justify-center"
        >
          <SwiperSlide className="flex gap-3 items-center justify-center">
            <InvitacionesIcon className="text-secondary" />
            <p className="font-display font-bold text-2xl leading-4 text-gray-300 flex gap-1">
              {`${Invitaciones?.enviadas} de ${Invitaciones?.total}`}
              <span className="capitalize font-display font-medium text-sm">
                invitaciones enviadas
              </span>
            </p>
          </SwiperSlide>

          <SwiperSlide className="flex gap-3 items-center justify-center">
            <InvitacionesIcon className="text-primary" />
            <p className="font-display font-bold text-2xl leading-4 text-gray-300  flex gap-1">
              {`${Invitaciones?.pendientes} de ${Invitaciones?.total}`}
              <span className="capitalize font-display font-medium text-sm">
                invitaciones pendientes
              </span>
            </p>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
};

const TablaDeInvitados = () => {
  const { event } = EventContextProvider();
  const [data, setData] = useState([]);
  const [arrEnviarInvitaciones, setArrInvitaciones] = useState([]);

  useEffect(() => {
    setData(
      event?.invitados_array?.map((invitado) => {
        return {
          _id: invitado._id,
          nombre: invitado.nombre,
          correo: invitado.correo,
          sexo: invitado.sexo,
          invitacion: invitado.invitacion,
        };
      })
    );
  }, [event]);

  const Columna = useMemo(
    () => [
      {
        Header: "NOMBRE",
        accessor: "nombre",
        id: "nombre",
        Cell: (props) => {
          const [value, setValue] = useState(props.cell.value);
          useEffect(() => {
            setValue(props.cell.value);
          }, [props.cell.value]);
          const { sexo } = props?.row?.original;
          const image = {
            hombre: {
              image: "/profile_men.png",
              alt: "Hombre",
            },
            mujer: {
              image: "profile_woman.png",
              alt: "Mujer",
            },
          };
          return (
            <div className="flex gap-4 items-center w-full">
              <img
                src={image[sexo]?.image}
                className="rounded-full object-cover w-10 h-10"
              />
              <p className="font-display text-sm capitalize overflow-ellipsis">
                {value}
              </p>
            </div>
          );
        },
      },
      {
        Header: "CORREO",
        accessor: "correo",
        id: "correo",
      },
      {
        Header: "¿ENVIADA?",
        accessor: "invitacion",
        id: "invitacion",
        Cell: (props) => {
          const [value, setValue] = useState(props.value);
          const [hoverRef, isHovered] = useHover();
          useEffect(() => {
            setValue(props.value);
          }, [props.value]);

          const mensaje = {
            true: "Enviado",
            false: "No enviado",
          };

          const handleClick = () => {
            if (!value) {
              setArrInvitaciones([props?.row?.original?._id]);
            }
          };

          return (
            <>
              <div
                ref={hoverRef}
                className={`relative w-full h-full flex items-center justify-center gap-2 text-${value
                  ? "green"
                  : "red cursor-pointer transform transition hover:scale-105"
                  }`}
                onClick={handleClick}
              >
                <InvitacionesIcon className="w-5 h-5 " />
                <p className="font-display text-md">{mensaje[value]}</p>
                {value && isHovered && (
                  <div className="transform bg-white w-2/3 shadow absolute right-0 mx-auto inset-x-0 translate-x-full rounded-lg text-gray-500 text-sm">
                    Enviado el <br /> 27 Junio 2021
                  </div>
                )}
              </div>
            </>
          );
        },
      },
    ],
    []
  );

  return (
    <>
      {arrEnviarInvitaciones.length > 0 && (
        <ConfirmacionBlock
          arrEnviarInvitaciones={arrEnviarInvitaciones}
          set={(act) => setArrInvitaciones(act)}
        />
      )}
      <DataTable columns={Columna} data={data} />
    </>
  );
};

const DataTable = ({ columns, data = [] }) => {
  const { getTableProps, getTableBodyProps, headerGroups, prepareRow, rows } =
    useTable({ columns, data }, useSortBy, useRowSelect, (hooks) => {
      hooks.visibleColumns.push((columns) => [
        {
          id: "selection",
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <div>
              {/*<IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />*/}
            </div>
          ),
          Cell: ({ row }) => (
            <div>
              {/*<IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />*/}
            </div>
          ),
        },
        ...columns,
      ]);
    });

  const colSpan = {
    selection: 1,
    nombre: 3,
    invitacion: 2,
    correo: 3,
  };
  return (
    <table
      {...getTableProps()}
      className="table w-full rounded-lg relative p-4"
    >
      <thead>
        {headerGroups.map((headerGroup: any, id: any) => (
          <tr
            {...headerGroup.getHeaderGroupProps()}
            className="w-full grid grid-cols-9 py-2 px-4 "
            key={id}
          >
            {headerGroup.headers.map((column: any, id: any) => (
              <th
                {...column.getHeaderProps(column.getSortByToggleProps())}
                className={`capitalize text-sm text-gray-500 font-light font-display col-span-${colSpan[column.id]
                  }`}
                key={id}
              >
                {column.render("Header")}
                <span>
                  {column.isSorted ? (column.isSortedDesc ? " 🠻" : " 🠹") : ""}
                </span>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()} className="text-gray-300 text-sm ">
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr
              key={i}
              {...row.getRowProps()}
              className="w-full transition border-b border-base hover:bg-base  w-full grid grid-cols-9 px-4"
            >
              {row.cells.map((cell, i) => {
                return (
                  <td
                    key={i}
                    {...cell.getCellProps()}
                    className={`font-display grid place-items-center text-sm w-full h-full text-center text-left py-2 col-span-${colSpan[cell.column.id]
                      }`}
                  >
                    {cell.render("Cell")}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

/*const IndeterminateCheckbox = forwardRef(({ indeterminate, ...rest }, ref) => {
  const defaultRef = useRef();
  const resolvedRef = ref || defaultRef;

  useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate;
  }, [resolvedRef, indeterminate]);

  return (
    <>
      <input type="checkbox" ref={resolvedRef} {...rest} />
    </>
  );
});
*/
const ConfirmacionBlock = ({ arrEnviarInvitaciones, set }) => {
  const { event, setEvent } = EventContextProvider();

  const Cancelar = () => {
    set([]);
  };

  const Aceptar = async () => {
    const params = {
      query: `mutation{
        enviaInvitacion(evento_id:"${event?._id
        }",invitados_ids_array:${JSON.stringify(arrEnviarInvitaciones)}){
          _id,
          invitados_array{_id,invitacion,nombre,correo,rol
            chats_array{_id,tipo}
          }
        }
      }
      `,
      variables: {},
    };

    try {
      await api.ApiBodas(params);
    } catch (error) {
      console.log(error);
    } finally {
      setEvent((old) => {
        arrEnviarInvitaciones.forEach((invitado) => {
          const idxInvitado = event?.invitados_array?.findIndex(
            (inv) => inv._id == invitado
          );
          old.invitados_array[idxInvitado] = {
            ...old.invitados_array[idxInvitado],
            invitacion: true,
          };
        });

        return { ...old };
      });
      set([])
    }
  };
  return (
    <div className="w-full h-full absolute grid place-items-center p-4">
      <div className="bg-white rounded-xl relative w-max h-max p-6 z-30 flex flex-col gap-3">
        <p className="font-display text-gray-500">{`¿Desea enviar ${arrEnviarInvitaciones.length
          } ${arrEnviarInvitaciones.length > 1 ? "invitaciones" : "invitacion"
          } de su evento?`}</p>
        <div className="w-full flex gap-10 justify-center h-max items-center">
          <button
            onClick={Aceptar}
            className="rounded-md font-display focus:outline-none bg-green text-white hover:opacity-90 transition px-2 py-1"
          >
            Aceptar
          </button>
          <button
            onClick={Cancelar}
            className="rounded-md font-display focus:outline-none bg-primary text-white hover:opacity-90 transition px-2 py-1"
          >
            Cancelar
          </button>
        </div>
      </div>
      <div className="w-full h-full absolute bg-black rounded-xl opacity-50 z-20" />
    </div>
  );
};

