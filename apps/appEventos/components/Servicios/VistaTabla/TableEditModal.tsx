import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Formik, Form, useFormikContext } from 'formik';
import { Task, Itinerary } from '../../../utils/Interfaces';
import { fetchApiEventos, queries } from '../../../utils/Fetching';
import { useToast } from '../../../hooks/useToast';
import { useTranslation } from 'react-i18next';
import { AuthContextProvider, EventContextProvider } from '../../../context';

import InputField from '../../Forms/InputField';

import { InputTags } from '../../Forms/InputTags';
import InputAttachments from '../../Forms/InputAttachments';
import { MyEditor } from '../Utils/QuillText';
import { ResponsableSelector } from '../Utils/ResponsableSelector';


interface TableEditModalProps {
  task: Task;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onClose: () => void;
  itinerario: Itinerary;
}

export const TableEditModal: React.FC<TableEditModalProps> = ({
  task,
  onClose,
  onSave,
  itinerario,
}) => {
  const { t } = useTranslation();
  const { config } = AuthContextProvider();
  const { event, setEvent } = EventContextProvider();
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Preparar fecha y hora
  const f = task?.fecha ? new Date(task.fecha) : new Date();
  const y = f.getFullYear();
  const m = f.getMonth() + 1;
  const d = f.getDate();

  const initialValues = {
    ...task,
    fecha: `${y}-${m < 10 ? "0" : ""}${m}-${d < 10 ? "0" : ""}${d}`,
    hora: f.toTimeString().split(' ')[0].substring(0, 5), // HH:MM
    estado: task.estado || 'pending',
    prioridad: task.prioridad || 'media',
    responsable: Array.isArray(task.responsable) ? task.responsable : [],
    tags: Array.isArray(task.tags) ? task.tags : [],
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
    tips: task.tips || '',
    duracion: task.duracion || 30
  };

  const handleSubmit = async (values: any, actions: any) => {
    try {
      setIsSaving(true);
      
      const d = values?.fecha?.split("-");
      const h = values?.hora?.split(":");
      
      // Crear fecha completa con hora
      const fechaCompleta = new Date(d[0], d[1] - 1, d[2], h[0] || 0, h[1] || 0);
      
      // Crear objeto con todos los datos actualizados
      const dataSend = {
        descripcion: values.descripcion,
        fecha: fechaCompleta,
        duracion: Number(values.duracion) || 30,
        responsable: values.responsable || [],
        tags: values.tags || [],
        attachments: values.attachments || [],
        tips: values.tips || '',
        spectatorView: values.spectatorView !== undefined ? values.spectatorView : true,
        estatus: values.estatus !== undefined ? values.estatus : false,
        estado: values.estado || 'pending',
        prioridad: values.prioridad || 'media',
      };

      // Actualizar cada campo individualmente
      const updatePromises = [];
      
      // Actualizar campos básicos
      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "descripcion",
            valor: dataSend.descripcion
          },
          domain: config.domain
        })
      );

      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "fecha",
            valor: dataSend.fecha.toISOString()
          },
          domain: config.domain
        })
      );

      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "duracion",
            valor: String(dataSend.duracion)
          },
          domain: config.domain
        })
      );

      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "estado",
            valor: dataSend.estado
          },
          domain: config.domain
        })
      );

      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "prioridad",
            valor: dataSend.prioridad
          },
          domain: config.domain
        })
      );

      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "tips",
            valor: dataSend.tips
          },
          domain: config.domain
        })
      );

      // Actualizar arrays
      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "responsable",
            valor: JSON.stringify(dataSend.responsable)
          },
          domain: config.domain
        })
      );

      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "tags",
            valor: JSON.stringify(dataSend.tags)
          },
          domain: config.domain
        })
      );

      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "attachments",
            valor: JSON.stringify(dataSend.attachments)
          },
          domain: config.domain
        })
      );

      // Actualizar booleanos
      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "spectatorView",
            valor: JSON.stringify(dataSend.spectatorView)
          },
          domain: config.domain
        })
      );

      updatePromises.push(
        fetchApiEventos({
          query: queries.editTask,
          variables: {
            eventID: event._id,
            itinerarioID: itinerario._id,
            taskID: task._id,
            variable: "estatus",
            valor: JSON.stringify(dataSend.estatus)
          },
          domain: config.domain
        })
      );

      // Ejecutar todas las actualizaciones
      await Promise.all(updatePromises);

      // Llamar al callback de guardado
      await onSave(task._id, dataSend);
      
      toast("success", t("Tarea actualizada correctamente"));
      onClose();
    } catch (error) {
      toast("error", `${t("Error al actualizar")} ${error}`);
      console.error(error);
    } finally {
      setIsSaving(false);
      actions.setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {t("Editar Tarea Completa")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, setFieldValue, isSubmitting }) => (
            <Form className="max-h-[70vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("Título")}
                  </label>
                  <InputField
                    name="descripcion"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={t("Ingrese el título de la tarea")}
                  />
                </div>

                {/* Fecha y Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("Fecha")}
                    </label>
                    <InputField
                      name="fecha"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("Hora")}
                      </label>
                      <InputField
                        name="hora"
                        type="time"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("Duración")}
                      </label>
                      <div className="flex items-center">
                        <InputField
                          name="duracion"
                          type="number"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <span className="ml-2 text-sm text-gray-600">min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estado y Prioridad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("Estado")}
                    </label>
                    <select
                      name="estado"
                      value={values.estado}
                      onChange={(e) => setFieldValue("estado", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="pending">{t("Pendiente")}</option>
                      <option value="in_progress">{t("En Curso")}</option>
                      <option value="completed">{t("Completado")}</option>
                      <option value="blocked">{t("Bloqueado")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("Prioridad")}
                    </label>
                    <select
                      name="prioridad"
                      value={values.prioridad}
                      onChange={(e) => setFieldValue("prioridad", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="alta">{t("Alta")}</option>
                      <option value="media">{t("Media")}</option>
                      <option value="baja">{t("Baja")}</option>
                    </select>
                  </div>
                </div>

                {/* Responsables */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("Responsables")}
                  </label>
                  <ResponsableSelector 
                    name="responsable" 
                    handleChange={(fieldName, value) => setFieldValue(fieldName, value)}
                    disable={false}
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("Descripción")}
                  </label>
                  <div className="border border-gray-300 rounded-lg">
                    <MyEditor name="tips" />
                  </div>
                </div>

                {/* Etiquetas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("Etiquetas")}
                  </label>
                  <InputTags name="tags" />
                </div>

                {/* Archivos adjuntos */}
                <div>
                  <InputAttachments
                    name="attachments"
                    label={t("Archivos adjuntos")}
                    itinerarioID={itinerario._id}
                    task={task}
                  />
                </div>

                {/* Opciones adicionales */}
                <div className="flex items-center space-x-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={values.spectatorView}
                      onChange={(e) => setFieldValue("spectatorView", e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{t("Visible para espectadores")}</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={values.estatus}
                      onChange={(e) => setFieldValue("estatus", e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{t("Marcar como completada")}</span>
                  </label>
                </div>
              </div>

              {/* Footer con botones */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t("Cancelar")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isSaving}
                  className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? t("Guardando...") : t("Guardar cambios")}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};