
export interface Event {
    _id: string
    fecha_creacion: string
    estatus: string
    fecha_actualizacion: string
    tipo: string
    nombre: string
    usuario_id: string
    detalles_usuario_id: detalle_compartidos_array
    usuario_nombre: string
    compartido_array: string[]
    detalles_compartidos_array: detalle_compartidos_array[]
    nonce: string
    fecha: string
    poblacion: string
    pais: string
    cant_invitados: number
    invitados_array: guests[]
    menus_array: menu[]
    planSpaceSelect: string
    planSpace: planSpace[]
    mesas_array: tableOld[]
    grupos_array: string[]
    notificaciones_array: notification[]
    imgInvitacion: image
    presupuesto_objeto: estimate
    listaRegalos: string
    permissions: permission[]
    valirRemote: boolean
    showChildrenGuest: string
    itinerarios_array: Itinerary[]
    //permission: boolean
}

export interface FileData {
    _id: string | undefined | null
    name: string
    size: number
    createdAt?: Date
    updatedAt?: Date
}

export interface Task {
    _id: string
    fecha: Date | string
    hora: string
    icon: string
    descripcion: string
    responsable: string[]
    duracion: number
    tags: string[]
    tips: string
    attachments: FileData[]
}

export interface Itinerary {
    _id: string
    title: string
    tasks: Task[]
    tipo: string
    estatus: string //activo, borrado
    fecha_creacion: Date
    icon?: JSX.Element
}

export interface OptionsSelect {
    value: string
    icon?: JSX.Element
    title: string
    onClick: any
}

export interface Notification {
    _id: string
    uid: string
    message: string
    state: string
    type: string
    createdAt: number
    updatedAt: number
}

export interface ResultNotifications {
    total: number
    results: Notification[]
}

export interface menu {
    nombre_menu: string
    tipo: string
}

interface permission {
    title: string
    value: string
}
interface onLine {
    status: boolean
    dateConection: number
}

export interface detalle_compartidos_array {
    uid: string
    email: string
    displayName: string
    photoURL: string
    onLine: onLine
    permissions?: permission[]
}

interface estimate {
    coste_estimado: number
    coste_final: number
    pagado: number
    currency: string
    categorias_array: estimateCategory[]
}

interface cost {
    _id: string
    coste_proporcion: number
    coste_estimado: number
    coste_final: number
    pagado: number
    nombre: string
}
interface estimateCategory extends cost {
    gastos_array: expenses[]
}

interface expenses extends cost {
    pagos_array: pay[]
}

interface pay {
    _id: string
    estado: string
    fecha_creacion: string
    fecha_pago: string
    fecha_vencimiento: string
    medio_pago: string
    importe: number
    pagado_por: string
}

export interface image {
    _id: string
    i1024: string
    i800: string
    i640: string
    i320: string
    createdAt: string
}
interface notification {
    _id: string
    fecha_creacion: string,
    fecha_lectura: string
    mensaje: string
}

export interface position {
    x: number
    y: number
}
export interface size {
    width: number
    height: number
}
interface propsBase {
    _id?: string
    title: string
    rotation: number
    position: position
    size: size
}
export interface element extends propsBase {
    tipo: string
}

export interface guest {
    _id: string,
    chair: number,
    order: Date
}

export interface table extends element {
    numberChair: number
    guests: guest[]
}

interface section extends propsBase {
    color: string
    elements: element[]
    tables: table[]
}
export interface planSpace {
    _id: string
    title: string
    size: size
    spaceChairs: number,
    template: boolean,
    sections: section[]
    elements: element[]
    tables: table[]
}

export interface tableOld {
    _id: string
    nombre_mesa: string
    tipo: string
    posicion: {
        x: number
        y: number
    }
    cantidad_sillas: number
}

export interface guests {
    _id: string
    invitacion: boolean
    fecha_invitacion: string
    estatus: string
    nombre: string
    rol: string
    sexo: string
    grupo_edad: string
    correo: string
    telefono: string
    chairs: any
    nombre_mesa: string
    puesto: string | number
    orden_puesto: string
    asistencia: string
    alergenos: string[]
    nombre_menu: string
    grupo_relacion: string
    chats_array: chat[]
    movil: string
    direccion: string
    poblacion: string
    pais: string
    father: string
    passesQuantity: number
}

export interface filterGuest extends guests {
    planSpaceID: string,
    sectionID: string,
    tableID: string,
    guestID: string,
    chair: number
}

interface chat {
    _id: string
    tipo: string
    icono: string
    nombre: string
    receptor_id: string
}

export interface signalItem {
    tipo: string;
    invitado: guests;
}

export interface EditDefaultState {
    item?: table
    itemTipo?: string
    setShowFormEditar?: any
}