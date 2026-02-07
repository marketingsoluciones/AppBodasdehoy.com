import { getCurrency } from "../../utils/Funciones";
import { capitalize } from '../../utils/Capitalize';
import { BorrarIcon, EditarIcon, PlusIcon } from "../icons";
import { api } from "../../api";
import { useContext, useEffect, useState } from "react";
import { EventContextProvider, AuthContextProvider } from "../../context";
import FormEditarPago from "../Forms/FormEditarPago";
import { GoPlusCircle } from "react-icons/go";
import { useTranslation } from 'react-i18next';
import { GrDocumentDownload } from "react-icons/gr";
import { Modal } from "../Utils/Modal";

const SubComponentePagos = ({ row, cate, gasto, wantCreate, getId }) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(true);
  const [PagoModificar, setPagoModificar] = useState("")
  const [showSoporte, setShowSoporte] = useState({ state: false, data: null })



  useEffect(() => {
    if (row.original.pagos_array.length <= 0) {
      row.toggleRowExpanded(false);
    }
  }, [row.original.pagos_array]);

  return (
    <>
      <div className="grid bg-base px-10 pb-12 pt-6 relative">
        {show ? (
          <ListadoComponent
            pagos_array={row?.original?.pagos_array}
            cate={cate}
            gasto={gasto}
            wantCreate={wantCreate}
            showSoporte={showSoporte}
            setShowSoporte={setShowSoporte}
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
      {
        showSoporte.state &&
        <Modal set={setShowSoporte} state={showSoporte.state} classe={"w-[95%] md:w-[450px] max-h-[600px] min-h-[100px] flex items-center justify-center"}>
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-h-[550px] flex flex-col items-center justify-center p-6">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => setShowSoporte({ state: false, data: null })}
              aria-label="Cerrar"
            >
              ×
            </button>
            <span className="font-display text-lg text-gray-700 mb-4">Factura de soporte</span>
            <div className="flex items-center justify-center w-full h-full max-h-[400px]">
              <img
                src={showSoporte?.data}
                alt="Factura de soporte"
                className="object-contain max-h-[400px] w-auto rounded-md border border-gray-100 shadow"
              />
            </div>
          </div>
        </Modal>
      }
    </>
  );
};

export default SubComponentePagos;

const ListadoComponent = ({ pagos_array, cate, gasto, wantCreate, idModificar, row, showSoporte, setShowSoporte }) => {
  const { t } = useTranslation();
  const { event, setEvent } = EventContextProvider();
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
  console.log("pagos", showSoporte)
  return (
    <>
      <button
        className="top-5 right-5 text-lg font-display text-gray-500 hover:text-gray-300 transition hover:scale-125 absolute transform focus:outline-none"
        onClick={() => row.toggleRowExpanded(false)}
      >
        X
      </button>
      <p className="text-gray-500 font-display text-lg pb-2">
        {t("paymentdetails")}
      </p>
      {pagos_array.map((item, idx) => (
        <div
          key={idx}
          className="grid grid-cols-10 px-5 justify-between border-b py-4 border-gray-100 hover:bg-base transition bg-white  "
        >
          <span className="items-center col-span-1 flex flex-col justify-center">
            <p className="font-display text-sm font-medium">{t("payment")}</p>
            <p className="font-display text-md">{idx + 1}</p>
          </span>

          <span className="items-center col-span-2 flex flex-col justify-center">
            <p className="font-display text-md font-medium">{t("amount")}</p>
            <p className="font-display text-md">{getCurrency(item.importe, event?.presupuesto_objeto?.currency)}</p>
          </span>

          <span className="items-center col-span-2 flex flex-col justify-center">
            <p className="font-display text-md font-medium">{t("details")}</p>
            <p
              className={`font-display text-md ${item.estado == "pagado" ? "text-green" : " text-red"
                }`}
            >
              {capitalize(item.estado)}
            </p>
          </span>

          <span className="items-center col-span-3 flex flex-col justify-center">
            <p className="font-display text-md font-medium">{t("paymentdate")}</p>
            <p className={`font-display text-md`}>{item.fecha_pago}</p>
          </span>

          <span className="items-center col-span-2 flex gap-3 text-gray-500 justify-center">
            {
              item?.soporte?.image_url != null &&
              <GrDocumentDownload onClick={() => setShowSoporte({ state: true, data: item?.soporte?.image_url })} className="w-6 h-6 cursor-pointer p-1 hover:shadow-md hover:bg-gray-300 rounded-md" />
            }
            <EditarIcon onClick={() => idModificar(item._id)} className="w-[20px] h-[20px] cursor-pointer transform hover:scale-105 transition" />
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
          <p className="font-display text-md">{t("addnewpayment")}</p>
        </button>
      </div>
    </>
  );
};