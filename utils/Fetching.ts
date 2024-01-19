import { api } from "../api";

interface propsFetchApiBodas {
  query: string
  variables: any
  type?: string
  development: string
  token?: string
}

export const fetchApiBodas = async ({ query = ``, variables = {}, type = "json", token, development }: propsFetchApiBodas): Promise<any> => {
  try {
    if (type === "json") {
      const {
        data: { data },
      } = await api.ApiBodas({ data: { query, variables }, development, token });
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
export const fetchApiEventos = async ({ query, variables, token }: argsFetchApi) => {
  const {
    data: { data },
  } = await api.ApiApp({ query, variables }, token);
  return Object.values(data)[0];
};

export const queries = {
  getEmailValid: `query ($email :String){
    getEmailValid(email:$email){
      valid
      validators{
        regex{
          valid, reason
        }
        typo{
          valid, reason
        }
        disposable{
          valid, reason
        }
        mx{
          valid, reason
        }
        smtp{
          valid, reason
        }
      }
      reason
    }
  }`,

  getGeoInfo: `query  {
    getGeoInfo {
      referer
      acceptLanguage
      loop
      connectingIp
      ipcountry
    }
  }`,
  auth: `mutation ($idToken : String){
    auth(idToken: $idToken){
      sessionCookie
    }
  }`,
  updateUser: `mutation ($uid:ID, $variable:String, $valor:String){
    updateUser(uid:$uid, variable:$variable, valor:$valor)
  }`,
  createUser: `mutation  ($uid : ID, $city: String, $country : String, $weddingDate : String, $phoneNumber : String, $role : [String]) {
    createUser(uid: $uid, city : $city, country : $country, weddingDate : $weddingDate, phoneNumber : $phoneNumber, role: $role){
          city
          country
          weddingDate
          phoneNumber
          role
        }
      }`,
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
          eventSelected
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
      planSpaceSelect
      planSpace{
      _id
      title
      size{
        width
        height
      }
      spaceChairs
      template
      sections{
        _id
        title
        position{
          x
          y
        }
        size{
          width
          height
        }
        color
        elements{
          _id
          title
          rotation
          position{
            x
            y
          }
          size{
            width
            height
          }
        }
        tables{
          _id
          title
          rotation
          position{
            x
            y
          }
          size{
            width
            height
          }
          tipo
          numberChair
          guests{
            _id
            chair
            order
          }
        }
      }
      elements{
        _id
        title
        rotation
        position{
          x
          y
        }
        size{
          width
          height
        }
        tipo
      }
      tables{
        _id
        title
        rotation
        position{
          x
          y
        }
        size{
          width
          height
        }
        tipo
        numberChair
        guests{
          _id
          chair
          order
        }
      }
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
      menus_array{
        nombre_menu
        tipo
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
      planSpaceSelect
      planSpace{
      _id
      title
      size{
        width
        height
      }
      spaceChairs
      template
      sections{
        _id
        title
        position{
          x
          y
        }
        size{
          width
          height
        }
        color
        elements{
          _id
          title
          rotation
          position{
            x
            y
          }
          size{
            width
            height
          }
        }
        tables{
          _id
          title
          rotation
          position{
            x
            y
          }
          size{
            width
            height
          }
          tipo
          numberChair
          guests{
            _id
            chair
            order
          }
        }
      }
      elements{
        _id
        title
        rotation
        position{
          x
          y
        }
        size{
          width
          height
        }
        tipo
      }
      tables{
        _id
        title
        rotation
        position{
          x
          y
        }
        size{
          width
          height
        }
        tipo
        numberChair
        guests{
          _id
          chair
          order
        }
      }
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
        chairs{
          planSpaceID
          sectionID
          tableID
          position
          order
        }
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
        fecha_invitacion
      }
      menus_array{
        nombre_menu
        tipo
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
       nombre_menu
       puesto
       asistencia
       rol
       correo
       sexo
       invitacion
       fecha_invitacion
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
        nombre_menu
        puesto
        asistencia
        rol
        correo
        sexo
        invitacion
        fecha_invitacion
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
  createMenu: `mutation ($eventID: String, $name: String) {
    creaMenu(evento_id:$eventID, nombre_menu: $name){
      menus_array{
        nombre_menu
        tipo
      }
    }
  }`,
  deleteMenu: `mutation ($eventID: String, $name: String) {
    borraMenu(evento_id:$eventID, nombre_menu: $name){
      menus_array{
        nombre_menu
        tipo
      }
    }
  }`,
  // createTable: `mutation ($eventID:String, $tableName: String, $tableType:String, $numberChairs:  Int, $position: [posicionAinput]) {
  //   creaMesa(evento_id:$eventID,mesas_array:{nombre_mesa:$tableName, tipo:$tableType, cantidad_sillas:$numberChairs, posicion:$position}){
  //     mesas_array{
  //       _id
  //       nombre_mesa
  //       tipo
  //       cantidad_sillas
  //       posicion {
  //         x
  //         y
  //       }
  //     }
  //   }
  // }`,

  getPsTemplate: `query ($uid:String ) {
    getPsTemplate(uid:$uid) {
      _id
      title
    }
    }`,
  createPsTemplate: `mutation ($eventID:ID, $planSpaceID:ID, $title:String, $uid:String ) {
    createPsTemplate(eventID:$eventID, planSpaceID:$planSpaceID, title:$title, uid:$uid) {
      _id
      title
    }
  }`,
  createTable: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $values: String) {
    createTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, values:$values) {
      _id
      title
      rotation
      position{
        x
        y
      }
      size{
        width
        height
      }
      tipo
      numberChair
      guests{
        _id
        chair
        order
      }
    }
  }`,
  editTable: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID, $variable: String, $valor: String) {
    editTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID, variable:$variable, valor:$valor) {
      _id
      title
      rotation
      position{
        x
        y
      }
      size{
        width
        height
      }
      tipo
      numberChair
      guests{
        _id
        chair
        order
      }
    }
  }`,
  deleteTable: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $tableID: ID) {
    deleteTable(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, tableID:$tableID) 
  }`,


  createElement: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $values: String) {
    createElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, values:$values) {
      _id
      title
      rotation
      position{
        x
        y
      }
      size{
        width
        height
      }
      tipo
    }
  }`,
  editElement: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $elementID: ID, $variable: String, $valor: String) {
    editElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, elementID:$elementID, variable:$variable, valor:$valor) {
      _id
      title
      rotation
      position{
        x
        y
      }
      size{
        width
        height
      }
      tipo
    }
  }`,
  deleteElement: `mutation ($eventID:ID, $planSpaceID: ID, $sectionID: ID, $elementID: ID) {
    deleteElement(eventID:$eventID, planSpaceID:$planSpaceID, sectionID:$sectionID, elementID:$elementID) 
  }`,

  editTableOld: `mutation ($eventID:String, $tableID: String, $variable: String, $coordenadas: [posicionAinput]) {
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
  deleteTableOld: `mutation ($eventID:String, $tableID: String) {
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
