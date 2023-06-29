import { api } from "../api";

export const fetchApi = async ({
  query = ``,
  variables = {},
  type = "json",
  token,
}) => {
  try {
    if (type === "json") {
      const {
        data: { data },
      } = await api.ApiBodasExpress({ query, variables }, token);
      return Object.values(data)[0];
    } else if (type === "formData") {
      const formData = new FormData();
      const values = Object?.entries(variables);

      // Generar el map del Form Data para las imagenes
      const map = values?.reduce((acc, item) => {
        if (item[1] instanceof File) {
          acc[item[0]] = [`variables.${item[0]}`];
        }
        if (item[1] instanceof Object) {
          Object.entries(item[1]).forEach((el) => {
            if (el[1] instanceof File) {
              acc[el[0]] = [`variables.${item[0]}.${el[0]}`];
            }
            if (el[1] instanceof Object) {
              Object.entries(el[1]).forEach((elemento) => {
                if (elemento[1] instanceof File) {
                  acc[elemento[0]] = [
                    `variables.${item[0]}.${el[0]}.${elemento[0]}`,
                  ];
                }
              });
            }
          });
        }
        return acc;
      }, {});

      // Agregar filas al FORM DATA

      formData.append("operations", JSON.stringify({ query, variables }));
      formData.append("map", JSON.stringify(map));
      values.forEach((item) => {
        if (item[1] instanceof File) {
          formData.append(item[0], item[1]);
        }
        if (item[1] instanceof Object) {
          Object.entries(item[1]).forEach((el) => {
            if (el[1] instanceof File) {
              formData.append(el[0], el[1]);
            }
            if (el[1] instanceof Object) {
              Object.entries(el[1]).forEach((elemento) => {
                if (elemento[1] instanceof File) {
                  formData.append(elemento[0], elemento[1]);
                }
              });
            }
          });
        }
      });

      const { data } = await api.graphql(
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
        token
      );

      if (data.errors) {
        throw new Error(JSON.stringify(data.errors));
      }

      return Object.values(data.data)[0];
    }
  } catch (error) {
    console.log(error);
  }
};

interface argsFetchApi {
  query: string;
  variables: object;
  token?: string;
}
export const fetchApiEventos = async ({
  query,
  variables,
  token,
}: argsFetchApi) => {
  const {
    data: { data },
  } = await api.ApiBodas({ query, variables }, token);
  return Object.values(data)[0];
};

export const queries = {
  getUser: `query ($uid: ID) {
        getUser(uid:$uid){
          phoneNumber
          role
          typeRole
          city
          country
          weddingDate
          signUpProgress
          status
          createdAt
          updatedAt
        }
      }`,
  authStatus: `mutation ($sessionCookie : String){
        status(sessionCookie: $sessionCookie){
          customToken
        }
      }`,
  eventCreate: `mutation (
    $nombre: String,
    $tipo: String!,
    $fecha: String,
    $pais: String,
    $poblacion: String,
    $usuario_id: String!
    $usuario_nombre: String!
  ){
    crearEvento(
      nombre: $nombre,
      tipo: $tipo,
      fecha: $fecha,
      pais: $pais,
      poblacion: $poblacion,
      usuario_id: $usuario_id,
      usuario_nombre: $usuario_nombre
    ){
      _id
      grupos_array
      estatus
      nombre
      fecha_actualizacion
      fecha_creacion
      tipo
      usuario_id
      usuario_nombre
      fecha
      poblacion
      pais
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
            }
          }
          
        }
      }
    }
  }`,
  guardarListaRegalos: `mutation($evento_id: String!, $variable_reemplazar: String, $valor_reemplazar: String){
    editEvento(
      evento_id:$evento_id
      variable_reemplazar:$variable_reemplazar
      valor_reemplazar:$valor_reemplazar
    ){
      _id
      listaRegalos
    }
  }`,
  getEventsByID: `query SolicitarEventos($userID : String) {
    queryenEvento(variable: "usuario_id", valor: $userID){
      _id
      grupos_array
      estatus
      color
      temporada
      estilo
      tematica
      tarta
      nombre
      fecha_actualizacion
      fecha_creacion
      tipo
      usuario_id
      usuario_nombre
      fecha
      listaRegalos
      poblacion
      pais
      imgInvitacion{
        _id
        i1024
        i800
        i640
        i320
        createdAt
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
  }`,
  getListaRegalos: `query($_id: String){
    queryenEvento_id(
      var_1:$_id
    ){
      _id
      nombre
      listaRegalos
    }
  }`,
  eventDelete: `mutation ($eventoID : String!) {
    borrarEvento(evento_id:$eventoID){
      modificado
    }
  }
  `,
  eventUpdate: `mutation ($idEvento: String!, $variable:String, $value : String){
    editEvento(
      evento_id: $idEvento, 
      variable_reemplazar: $variable, 
      valor_reemplazar: $value
      ){
      _id
    }
  }`,
  createGuests: `mutation ($eventID: String, $guestsArray : [invitAinput]) {
    creaInvitado(evento_id: $eventID, invitados_array: $guestsArray){
     invitados_array{
       _id
       nombre
       grupo_edad
       correo
       telefono
       nombre_mesa
       puesto
       asistencia
       rol
       correo
       sexo
       invitacion
     }
   }
   }`,
  editGuests: `mutation ($eventID:String, $guestID:String, $variable: String, $value:String) {
    editInvitado(
      evento_id:$eventID, 
      invitado_id:$guestID, 
      variable_reemplazar:$variable,
      valor_reemplazar:$value){
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
  removeGuests: `mutation ($eventID:String, $guests: [String]){
      borraInvitados(evento_id:$eventID,
      invitados_ids_array:$guests){
        invitados_array{
          _id
          nombre
          sexo
          grupo_edad
          correo
          telefono
          nombre_mesa
          puesto
          asistencia
          rol
        }
      }
    }`,
  createGroup: `mutation ($eventID: String, $name: String) {
    creaGrupo(evento_id:$eventID, nombre_grupo: $name){
      grupos_array
    }
  }`,
  createTable: `mutation ($eventID:String, $tableName: String, $tableType:String, $numberChairs:  Int, $position: [posicionAinput]) {
    creaMesa(evento_id:$eventID,mesas_array:{nombre_mesa:$tableName, tipo:$tableType, cantidad_sillas:$numberChairs, posicion:$position}){
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
    }
  }`,
  editTable: `mutation ($eventID:String, $tableID: String, $variable: String, $coordenadas: [posicionAinput]) {
    editMesa(evento_id:$eventID,mesa_id:$tableID, variable_reemplazar:$variable, coordenadas:$coordenadas) {
      _id
      nombre_mesa
      posicion {
        x
        y
      }
      cantidad_sillas
    }
  }`,
  editNameTable: `mutation ($eventID:String, $tableID: String, $variable: String, $valor_reemplazar: String) {
    editMesa(evento_id:$eventID,mesa_id:$tableID, variable_reemplazar:$variable, valor_reemplazar:$valor_reemplazar) {
      _id
      nombre_mesa
      posicion {
        x
        y
      }
      cantidad_sillas
      tipo
    }
  }`,
  deleteTable: `mutation ($eventID:String, $tableID: String) {
    borraMesa(evento_id:$eventID,mesa_id:$tableID) {
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
    }
  }`,
  signOut: `mutation ($sessionCookie :String){
    signOut(sessionCookie:$sessionCookie)
  }`,
};
