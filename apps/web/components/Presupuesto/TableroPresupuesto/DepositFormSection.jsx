import { Plus, CheckCircle, Upload } from "lucide-react";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { fetchApiEventos, queries } from "../../../utils/Fetching";
import { EventContextProvider } from "../../../context/";

const DepositFormSection = ({
  onDepositSubmit,
  buttonText = "Registrar Nuevo Depósito de la Novia",
}) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { event, setEvent } = EventContextProvider();
  const validationSchema = Yup.object({
    monto: Yup.number()
      .required("El monto es requerido")
      .positive("El monto debe ser positivo")
      .min(0.01, "El monto debe ser mayor a 0"),
    metodoPago: Yup.string().required("El método de pago es requerido"),
    referencia: Yup.string().required("La referencia es requerida"),
    baucher: Yup.mixed().nullable(),
  });

  const initialValues = {
    monto: "",
    metodoPago: "",
    referencia: "",
    baucher: null,
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      fetchApiEventos({
        query: queries.addWeddingPlannerIngreso,
        variables: {
          evento_id: event?._id,
          weddingPlannerIngreso: {
            fecha: new Date(),
            monto: values.monto,
            metodo: values.metodoPago,
            referencia: values.referencia,
          },
        },
      }).then((result) => {
        const updatedIngresos = [
          ...(event?.presupuesto_objeto?.weddingPlannerIngresos || []),
          result
        ];
        
        const updatedEvent = {
          ...event,
          presupuesto_objeto: {
            ...event.presupuesto_objeto,
            weddingPlannerIngresos: updatedIngresos
          }
        };
        
        setEvent(updatedEvent);
      });
    } catch (error) {
      console.log("error", error);
    }
    setSubmitting(false);
    setMostrarFormulario(false);
  };

  const handleFileChange = (event, setFieldValue) => {
    const file = event.target.files[0];
    if (file) {
      setFieldValue("baucher", file);
    }
  };

  return (
    <div className="mb-6">
      {!mostrarFormulario ? (
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 text-base"
        >
          <Plus className="w-4 h-4" />
          {buttonText}
        </button>
      ) : (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            isSubmitting,
            values,
            setFieldValue,
            resetForm,
            isValid,
            dirty,
          }) => (
            <Form className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Monto del depósito
                  </label>
                  <Field
                    type="number"
                    name="monto"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500 "
                  />
                  <ErrorMessage
                    name="monto"
                    component="div"
                    className="text-red text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Método de pago
                  </label>
                  <Field
                    as="select"
                    name="metodoPago"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-0 focus:ring-blue-500 text-gray-700"
                  >
                    <option value="">Seleccionar método</option>
                    <option value="transferencia">
                      Transferencia bancaria
                    </option>
                    <option value="efectivo">Efectivo</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta de crédito/débito</option>
                    <option value="otro">Otro</option>
                  </Field>
                  <ErrorMessage
                    name="metodoPago"
                    component="div"
                    className="text-red text-xs mt-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Referencia
                  </label>
                  <Field
                    type="text"
                    name="referencia"
                    placeholder="Número de referencia o descripción"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <ErrorMessage
                    name="referencia"
                    component="div"
                      className="text-red text-xs mt-1"
                  />
                </div>

                {/* <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Baucher/Comprobante
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, setFieldValue)}
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      id="baucher-input"
                    />
                    <label
                      htmlFor="baucher-input"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex items-center justify-center gap-2 hover:bg-gray-50 border-gray-500"
                    >
                      <Upload className="w-4 h-4 text-gray-500" />
                      {values.baucher ? (
                        <p className="text-[10px] text-gray-500">
                          {values.baucher.name}
                        </p>
                      ) : (
                        <p className="text-gray-500">Seleccionar archivo</p>
                      )}
                    </label>
                  </div>
                  {values.baucher && (
                    <p className="text-[10px] text-green-600 mt-1">
                      Archivo seleccionado: {values.baucher.name}
                    </p>
                  )}
                </div> */}
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !isValid || !dirty}
                  className="bg-green text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isSubmitting ? "Enviando..." : "Confirmar Depósito"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMostrarFormulario(false);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
};

export default DepositFormSection;
