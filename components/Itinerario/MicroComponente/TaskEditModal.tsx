import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Task, FileData } from '../../../utils/Interfaces';

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


const validationSchema = Yup.object().shape({
  descripcion: Yup.string().required('La descripción es requerida'),
  fecha: Yup.string()
    .nullable()
    .test('is-date', 'Fecha inválida', value => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    }),
  duracion: Yup.number().min(0),
  responsable: Yup.array(),
  tags: Yup.array(),
  tips: Yup.string(),
});

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  onSave,
  onClose,
  itinerario,
}) => {
    const [isFormDisabled, setIsFormDisabled] = useState(false);
  const initialValues = {
    descripcion: task.descripcion || '',
    fecha: task.fecha ? new Date(task.fecha).toISOString().split('T')[0] : '',
    duracion: task.duracion || 0,
    responsable: task.responsable || [],
    tags: task.tags || [],
    tips: task.tips || '',
    attachments: task.attachments || [],
    spectatorView: task.spectatorView,
    estatus: task.estatus,
    estado: task.estado || 'pending',
    prioridad: task.prioridad || 'media',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Editar Tarea
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
          validationSchema={validationSchema}
          onSubmit={(values) => {
            // Convertir el string de fecha a objeto Date
            const updatedValues = {
              ...values,
              fecha: values.fecha ? new Date(values.fecha) : null,
            };
            onSave(task._id, updatedValues);
            onClose();
          }}
        >
          {({ values, setFieldValue }) => (
            <Form className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <InputField
                  name="descripcion"
                  placeholder="Descripción de la tarea"
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <InputField
                    name="fecha"
                    type="date"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (minutos)
                  </label>
                  <InputField
                    name="duracion"
                    type="number"
                    className="w-full"
                  />
                </div>
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Responsables
  </label>
  <ResponsableSelector
    name="responsable"
    value={values.responsable}
    handleChange={(fieldName, value) => {
      setFieldValue(fieldName, value);
    }}
    disable={isFormDisabled}
  />
</div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiquetas
                </label>
                <InputTags
                  name="tags"
                  value={values.tags}
                  onChange={(value) => setFieldValue('tags', value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjuntos
                </label>
                <InputAttachments
                  name="attachments"
                  value={values.attachments.map((file) => file.name)} // Convertir a un array de strings (solo nombres)
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []); // Obtener los archivos del evento
                    setFieldValue(
                      'attachments',
                      files.map((file) => ({
                        name: file.name,
                        size: file.size, // Usar el tamaño real del archivo
                      }))
                    );
                  }}
                  itinerarioID={itinerario._id}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas
                </label>
                <MyEditor
                  name="tips"
                  value={values.tips}
                  onChange={(content) => setFieldValue('tips', content)}
                />
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Estado
  </label>
  <select
    name="estado"
    value={values.estado}
    onChange={(e) => setFieldValue("estado", e.target.value)}
    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
  >
    <option value="pending">Pendiente</option>
    <option value="in_progress">En Progreso</option>
    <option value="completed">Completado</option>
    <option value="blocked">Bloqueado</option>
  </select>
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Prioridad
  </label>
  <select
    name="prioridad"
    value={values.prioridad}
    onChange={(e) => setFieldValue("prioridad", e.target.value)}
    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
  >
    <option value="alta">Alta</option>
    <option value="media">Media</option>
    <option value="baja">Baja</option>
  </select>
</div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};