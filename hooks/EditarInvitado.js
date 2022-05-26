import { api } from "../api";

export const EditarInvitado = async (eventoID, invitadoID, variable_reemplazar, valor_reemplazar) => {
  const params = {
    query: `mutation {
            editInvitado(
              evento_id:"${eventoID}", 
              invitado_id:"${invitadoID}", 
              variable_reemplazar:"${variable_reemplazar}",
              valor_reemplazar:"${valor_reemplazar}"){
                _id
                nombre
                grupo_edad
                correo
                telefono
                nombre_mesa
                puesto
                asistencia
                nombre_menu
                rol
                correo
                sexo
                movil
                poblacion
                pais
                direccion
              }
            }`,
    variables: {},
  };
  
  const {data: {data: editInvitado}} = await api.ApiBodas(params);
  return {
    editInvitado,
  };
};


export const BorrarInvitado = async (eventoID, invitadoID) => {
  const params = {
    query: `mutation {
      borraInvitado(evento_id: "${eventoID}", invitado_id: "${invitadoID}"){
        fecha_actualizacion
      }
    }`,
    variables: {},
  };
  
  const resp = await api.ApiBodas(params);
  
  return resp
};

