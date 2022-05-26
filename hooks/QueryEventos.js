import { api } from "../api";

export const GetEventosUser = async (userID, set) => {
  let eventos = []

  const peticion = {
    query: `query SolicitarEventos($userID : String) {
     queryenEvento(variable: "usuario_id", valor: $userID){
       _id
       grupos_array
       estatus
       nombre
       fecha_actualizacion
       tipo
       usuario_id
       usuario_nombre
       fecha
       poblacion
       pais
       invitacion_objeto{
         id
         path
         fecha_subida
         filename
         mimetype
         path_public
       }
       notificaciones_array{
         _id
         fecha_creacion
         fecha_lectura
         mensaje
       }
       mesas_array{
            _id
            nombre_mesa
            tipo
            cantidad_sillas
            posicion {
              x
              y
            }
       }
       invitados_array{
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
         invitacion
       }
       presupuesto_objeto{
        coste_final
        pagado
        coste_estimado
        categorias_array{
          _id
          nombre
          coste_estimado
          coste_final
          pagado
          gastos_array {
            _id
            coste_estimado
            coste_final
            pagado
            nombre
            pagos_array {
              _id
              estado
              fecha_creacion
              fecha_pago
              fecha_vencimiento
              medio_pago
              importe
              pagado_por
            }
          }
          
        }
      }
     }
   }
    `,
    variables: {
      userID : JSON.stringify(userID),
    },
  }

  try {
  const response = await api.ApiBodas(peticion);
  const { data: uno } = response;
  const { data: dos } = uno;
  const { queryenEvento: data } = dos;
  
  eventos = data
  
  } catch (error) {
    console.log(error)
  } finally {
    set(eventos)
  }
   
}


export const EliminarEvento = async (evento, setContext) => {
  try {
    const params = {
      query: `mutation ($eventoID : String) {
        borrarEvento(evento_id:$eventoID){
          modificado
        }
      }
      `,
      variables: {},
    }
    await api.ApiBodas(params)
    
  } catch (error) {
    console.log(error)
  } finally {
    setContext(old => old.filter(item => item._id !== evento))
  }
}

export const AddInvitado = async (evento, invitado, setContext) => {
  try {
    const params = {
      query: `mutation {
        creaInvitado(evento_id:"${evento}", invitados_array:"${invitado}"){
          _id
        }
      }
      `,
      variables: {},
    }
    await api.ApiBodas(params)
    
  } catch (error) {
    console.log(error)
  } finally {
    // setContext(old => [...old, invitado])
  }
}
