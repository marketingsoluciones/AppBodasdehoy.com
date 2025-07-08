import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Formik, Form, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { Task } from '../../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { AuthContextProvider, EventContextProvider } from '../../../context';

import InputField from '../../Forms/InputField';
import { ResponsableSelector } from './ResponsableSelector';
import { InputTags } from '../../Forms/InputTags';
import InputAttachments from '../../Forms/InputAttachments';
import { MyEditor } from './QuillText';

interface TaskEditModalProps {
  task: Task;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onClose: () => void;
  itinerario: any;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  onClose,
  itinerario,
}) => {
  const { t } = useTranslation();
  const { config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();

  const f = new Date(task?.fecha);
  const y = f.getFullYear();
  const m = f.getMonth() + 1;
  const d = f.getDate();

  const initialValues = {
    ...task,
    fecha: f ? `${y}-${m < 10 ? "0" : ""}${m}-${d < 10 ? "0" : ""}${d}` : "",
    hora: f ? f.toTimeString().split(' ')[0] : "",
    estado: task.estado,
    prioridad: task.prioridad
  };

// Modificar handleSubmit para mantener el estado actual si no se modifica
const handleSubmit = async (values: any, actions: any,) => {
  try {
    const d = values?.fecha?.split("-");
    const h = values?.hora?.split(":");
    const dataSend = {
      ...values,
      estado: values.estado ?? task.estado, // Mantener el estado actual si no se modifica
      ...(new Date(d[0], d[1] - 1, d[2], h[0], h[1]).getTime() > 0 
        ? { fecha: new Date(d[0], d[1] - 1, d[2], h[0], h[1]) } 
        : { fecha: "" })
    };
    delete dataSend.hora;

    const response = await fetchApiEventos({
      query: queries.editTask,
      variables: {
        eventID: event._id,
        itinerarioID: itinerario._id,
        taskID: values._id,
        variable: "all",
        valor: JSON.stringify(dataSend)
      },
      domain: config.domain
    });

    if (response) {
      const f1 = event.itinerarios_array.findIndex(elem => elem._id === itinerario._id);
      const f2 = event.itinerarios_array[f1].tasks.findIndex(elem => elem._id === values._id);
      event.itinerarios_array[f1].tasks[f2] = dataSend;
      setEvent({ ...event });
      toast("success", t("Item guardado con éxito"));
      onClose();
    }
  } catch (error) {
    toast("error", `${t("Ha ocurrido un error")} ${error}`);
    console.log(error);
  }
};
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("edit")} {t("task")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
        >
          {({ values, setFieldValue }) => (
            <Form className="p-6 space-y-6">
              <AutoSubmitToken />
              
              
              <InputField
                name="descripcion"
                label={t("name")}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="grid grid-cols-2 gap-4">
                <InputField
                  name="fecha"
                  label={t("Fecha")}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <div className="w-full flex space-x-2">
                  <InputField
                    name="hora"
                    label={t("Hora")}
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="flex items-end space-x-1 w-1/3">
                    <InputField
                      name="duracion"
                      label={t("duraction")}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-xs -translate-y-2">min</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("Estado")}
                  </label>
                  <select
                    name="estado"
                    value={values.estado}
                    onChange={(e) => setFieldValue("estado", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">{t("Pendiente")}</option>
                    <option value="in_progress">{t("En Curso")}</option>
                    <option value="completed">{t("Completado")}</option>
                    <option value="blocked">{t("Bloqueado")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("Prioridad")}
                  </label>
                  <select
                    name="prioridad"
                    value={values.prioridad}
                    onChange={(e) => setFieldValue("prioridad", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="alta">{t("Alta")}</option>
                    <option value="media">{t("Media")}</option>
                    <option value="baja">{t("Baja")}</option>
                  </select>
                </div>
              </div>

              <div className="w-full h-max relative">
                <label className="font-display text-primary text-sm w-full capitalize">
                  {t("responsables")}
                </label>
                <ResponsableSelector 
                  name="responsable" 
                  handleChange={(fieldName, value) => setFieldValue(fieldName, value)}
                  disable={false}
                />
              </div>

              <div className="w-full h-max relative">
                <label className="font-display text-primary text-sm w-full capitalize">
                  {t("items")}
                </label>
                <MyEditor name="tips" />
              </div>

              <div className="w-full h-max relative">
                <label className="font-display text-primary text-sm w-full capitalize">
                  {t("etiquetas")}
                </label>
                <InputTags name="tags" />
              </div>

              <div className="w-full flex pb-0">
                <InputAttachments
                  name="attachments"
                  label={t("archivos adjuntos")}
                  itinerarioID={itinerario._id}
                  task={task}
                />
              </div>

              <button
                className="font-display rounded-full py-2 px-6 text-white font-medium transition w-full hover:opacity-70 bg-primary"
                type="submit"
              >
                {t("save")}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

const AutoSubmitToken = () => {
  const { values, errors } = useFormikContext();
  
  useEffect(() => {
    console.log("errors", errors);
  }, [errors]);

  useEffect(() => {
    // console.log("values", values);
  }, [values]);

  return null;
};

export default TaskEditModal;