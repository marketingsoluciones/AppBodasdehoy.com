import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import { BorrarIcon, EditarIcon, PlusIcon } from "../icons";
import { api } from "../../api";
import { useContext, useEffect, useState } from "react";
import { EventContextProvider, AuthContextProvider } from "../../context";
import FormEditarPago from "../Forms/FormEditarPago";

const SubComponentePagos = ({ row, cate, gasto, wantCreate,getId }) => {
  const [show, setShow] = useState(true);
  const [PagoModificar, setPagoModificar] = useState("")
  

  useEffect(() => {
    if (row.original.pagos_array.length <= 0) {
      row.toggleRowExpanded(false);
    }
  }, [row.original.pagos_array]);

  return (
    <div className="grid bg-base px-10 pb-12 pt-6 relative">
      {show ? (
        <ListadoComponent
          pagos_array={row?.original?.pagos_array}
          cate={cate}
          gasto={gasto}
          wantCreate={wantCreate}
          idModificar={id => {
            setPagoModificar(id)
            setShow(!show)
          }}
          row={row}
        />
      ) : (
        <div className="w-full h-max p-6 bg-white relative">
          <p onClick={() => setShow(!show)} className="absolute font-display text-xl transform transition top-5 right-5 text-gray-500 hover:scale-125 cursor-pointer">X</p>
          <FormEditarPago getId={getId} categorias={cate} ListaPagos={row.original.pagos_array} IDPagoAModificar={PagoModificar} IDs={{ idGasto: gasto, idCategoria: cate }} set={act => setShow(act)} state={show} />
        </div>
      )}
    </div>
  );
};

export default SubComponentePagos;

const ListadoComponent = ({ pagos_array, cate, gasto, wantCreate, idModificar, row }) => {
  const { event, setEvent } = EventContextProvider();
  const {currency} = AuthContextProvider()
  const BorrarPago = async (pagoID) => {
    let data;
    const params = {
      query: `mutation {
        borraPago(evento_id:"${event?._id}", categoria_id: "${cate}", gasto_id: "${gasto}", pago_id: "${pagoID}"){
          pagado
          categorias_array{
            pagado
            gastos_array{
              pagado
            }
          }
        }
      }`,
      variables: {},
    };

    try {
      const { data: res } = await api.ApiApp(params);
      data = res.data.borraPago;
    } catch (error) {
      console.log(error);
    } finally {
      setEvent((old) => {
        // Encontrar posicion de la categoria en el array categorias
        const idxCategoria =
          old?.presupuesto_objeto?.categorias_array?.findIndex(
            (item) => item._id == cate
          );

        const idxGastos = old?.presupuesto_objeto?.categorias_array[
          idxCategoria
        ]?.gastos_array?.findIndex((item) => item._id == gasto);

        // Sustraer el gasto a eliminar del array de gastos
        const filterPagosArray = old?.presupuesto_objeto?.categorias_array[
          idxCategoria
        ]?.gastos_array[idxGastos]?.pagos_array?.filter(
          (item) => item._id !== pagoID
        );

        //Actualizar pagado del evento
        old.presupuesto_objeto.pagado = data?.pagado;

        //Actualizar pagado de la categoria
        old.presupuesto_objeto.categorias_array[idxCategoria].pagado =
          data?.categorias_array[0]?.pagado;

        //Actualizar pagado del gasto
        old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[
          idxGastos
        ].pagado = data?.categorias_array[0]?.gastos_array[0]?.pagado;

        // Sobrescribir arr de pagos anterior por el nuevo
        old.presupuesto_objeto.categorias_array[idxCategoria].gastos_array[
          idxGastos
        ].pagos_array = filterPagosArray;

        return { ...old };
      });
    }
  };
 
  return (
    <>
      <button
        className="top-5 right-5 text-lg font-display text-gray-500 hover:text-gray-300 transition hover:scale-125 absolute transform focus:outline-none"
        onClick={() => row.toggleRowExpanded(false)}
      >
        X
      </button>
      <p className="text-gray-500 font-display text-lg pb-2">
        Detalles de pagos
      </p>
      {pagos_array.map((item, idx) => (
        <div
          key={idx}
          className="grid grid-cols-10 px-5 justify-between border-b py-4 border-gray-100 hover:bg-base transition bg-white  "
        >
          <span className="items-center col-span-1 flex flex-col justify-center">
            <p className="font-display text-sm font-medium">#PAGO</p>
            <p className="font-display text-md">{idx + 1}</p>
          </span>

          <span className="items-center col-span-2 flex flex-col justify-center">
            <p className="font-display text-md font-medium">IMPORTE</p>
            <p className="font-display text-md">{getCurrency(item.importe, currency)}</p>
          </span>

          <span className="items-center col-span-2 flex flex-col justify-center">
            <p className="font-display text-md font-medium">DETALLES</p>
            <p
              className={`font-display text-md ${item.estado == "pagado" ? "text-green" : " text-red"
                }`}
            >
              {capitalize(item.estado)}
            </p>
          </span>

          <span className="items-center col-span-3 flex flex-col justify-center">
            <p className="font-display text-md font-medium">Fecha de pago</p>
            <p className={`font-display text-md`}>{item.fecha_pago}</p>
          </span>

          <span className="items-center col-span-2 flex gap-3 text-gray-500 justify-center">
            <EditarIcon onClick={() => idModificar(item._id)} className="w-4 h-4 cursor-pointer transform hover:scale-105 transition" />
            <BorrarIcon
              onClick={() => BorrarPago(item._id)}
              className="w-4 h-4 cursor-pointer transform hover:scale-105 transition"
            />
          </span>
        </div>
      ))}
      <div className="flex px-5 justify-start border-b py-4 border-gray-100  bg-white  ">
        <button
          onClick={() => wantCreate(true)}
          className="focus:outline-none items-center flex justify-center gap-1 text-primary hover:scale-105 transition transform cursor-pointer"
        >
          <PlusIcon className="text-primary" />
          <p className="font-display text-md">Añadir nuevo pago</p>
        </button>
      </div>
    </>
  );
};
