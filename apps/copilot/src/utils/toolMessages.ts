/**
 * Mapeo de nombres de herramientas a mensajes descriptivos en español
 * para mostrar al usuario qué está haciendo el sistema durante la ejecución
 */

export const TOOL_STATUS_MESSAGES: Record<string, string> = {
  
  // Invitados
add_guest: '➕ Agregando invitado...',
  

analyzing: '🧠 Analizando datos...',
  


calculating: '🧮 Calculando...',
  



complete_task: '✅ Completando tarea...',
  



confirm_guest: '✅ Confirmando asistencia del invitado...',
  



create_budget_item: '➕ Agregando item al presupuesto...',
  



create_event: '✨ Creando nuevo evento...',
  




create_provider: '✨ Creando nuevo proveedor...',
  





create_task: '➕ Creando nueva tarea...',
  
  
  



// Mensajes genéricos
default: '⏳ Procesando tu solicitud...',
  



delete_budget_item: '🗑️ Eliminando item del presupuesto...',
  



delete_event: '🗑️ Eliminando evento...',
  




delete_guest: '🗑️ Eliminando invitado...',
  




// Presupuestos
get_budget: '💰 Consultando presupuesto...',
  




get_budget_details: '📊 Obteniendo detalles del presupuesto...',
  
  
  



get_event_details: '📅 Obteniendo detalles del evento...',
  



get_event_guests: '👥 Consultando lista de invitados...',
  



get_event_timeline: '⏰ Consultando cronograma del evento...',
  



get_provider_details: '📋 Obteniendo detalles del proveedor...',
  


// Proveedores
get_providers: '🏢 Buscando proveedores...',
  
  
  

// Tareas
get_tasks: '📝 Consultando tareas...',
  

// Eventos
get_user_events: '🔍 Buscando tus eventos...',
  

loading: '⏳ Cargando...',
  


reject_guest: '❌ Rechazando asistencia del invitado...',
  
  
  


search_budgets_by_category: '🔍 Buscando presupuestos por categoría...',
  


search_guests: '🔎 Buscando invitados...',
  


search_special_menu_guests: '🍽️ Buscando invitados con menús especiales...',
  


searching: '🔍 Buscando información...',
  
  
  
update_budget_item: '✏️ Actualizando item del presupuesto...',
  update_event: '✏️ Actualizando evento...',
  update_guest: '✏️ Actualizando información del invitado...',
  update_provider: '✏️ Actualizando proveedor...',
  update_task: '✏️ Actualizando tarea...',
};

/**
 * Obtiene un mensaje descriptivo para una herramienta
 */
export function getToolStatusMessage(toolName: string, args?: Record<string, any>): string {
  // Buscar mensaje específico para la herramienta
  const specificMessage = TOOL_STATUS_MESSAGES[toolName];
  if (specificMessage) {
    return specificMessage;
  }
  
  // Intentar inferir el tipo de operación desde el nombre
  const lowerName = toolName.toLowerCase();
  
  if (lowerName.includes('search') || lowerName.includes('buscar')) {
    return TOOL_STATUS_MESSAGES.searching;
  }
  
  if (lowerName.includes('get') || lowerName.includes('obtener') || lowerName.includes('consultar')) {
    return TOOL_STATUS_MESSAGES.loading;
  }
  
  if (lowerName.includes('create') || lowerName.includes('crear') || lowerName.includes('agregar')) {
    return '✨ Creando...';
  }
  
  if (lowerName.includes('update') || lowerName.includes('actualizar') || lowerName.includes('modificar')) {
    return '✏️ Actualizando...';
  }
  
  if (lowerName.includes('delete') || lowerName.includes('eliminar') || lowerName.includes('borrar')) {
    return '🗑️ Eliminando...';
  }
  
  if (lowerName.includes('analyze') || lowerName.includes('analizar')) {
    return TOOL_STATUS_MESSAGES.analyzing;
  }
  
  if (lowerName.includes('calculate') || lowerName.includes('calcular')) {
    return TOOL_STATUS_MESSAGES.calculating;
  }
  
  // Mensaje por defecto
  return TOOL_STATUS_MESSAGES.default;
}

/**
 * Obtiene un mensaje más detallado basado en los argumentos de la herramienta
 */
export function getDetailedToolMessage(toolName: string, args?: Record<string, any>): string {
  const baseMessage = getToolStatusMessage(toolName, args);
  
  if (!args) {
    return baseMessage;
  }
  
  // Agregar contexto adicional basado en los argumentos
  const contextParts: string[] = [];
  
  if (args.event_id) {
    contextParts.push('del evento');
  }
  
  if (args.category) {
    contextParts.push(`en la categoría "${args.category}"`);
  }
  
  if (args.filter_by_name) {
    contextParts.push(`buscando "${args.filter_by_name}"`);
  }
  
  if (args.filter_by_year) {
    contextParts.push(`del año ${args.filter_by_year}`);
  }
  
  if (contextParts.length > 0) {
    return `${baseMessage} ${contextParts.join(' ')}...`;
  }
  
  return baseMessage;
}




































