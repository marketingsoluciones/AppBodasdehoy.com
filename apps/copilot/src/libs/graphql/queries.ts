import { gql } from '@apollo/client';

/**
 * Queries GraphQL para el sistema de chat externo
 * ✅ ACTUALIZADO según documentación OFICIAL de API2 (30 Nov 2025)
 *
 * IMPORTANTE - Cambios según proveedor API2:
 * - Pagination usa CRM_PaginationInput! (con !)
 * - getSession devuelve objeto DIRECTO, sin wrapper { success, session, errors }
 * - markAsRead usa sessionId + messageId
 */

// ========================================
// QUERIES DE SESIONES/CHATS
// ========================================

// Obtener lista de sesiones/chats del usuario
// ✅ OFICIAL: getSessions con CRM_PaginationInput!
export const GET_USER_CHATS = gql`
  query GetUserChats($userId: String!, $development: String!, $pagination: CRM_PaginationInput!) {
    getSessions(
      userId: $userId
      development: $development
      pagination: $pagination
    ) {
      success
      sessions {
        id
        titulo
        session_type
        participants
        unreadCount
        lastMessageAt
        status
      }
      total
      pagination {
        page
        limit
        totalPages
      }
      errors
    }
  }
`;

// Obtener mensajes de una sesión
// ✅ FINAL: getMessages - Message NO tiene sessionId como campo
export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($sessionId: String!, $pagination: CRM_PaginationInput!) {
    getMessages(
      sessionId: $sessionId
      pagination: $pagination
    ) {
      success
      messages {
        id
        role
        content
        type
        createdAt
      }
      total
      pagination {
        page
        limit
        totalPages
      }
      errors
    }
  }
`;

// Obtener información de una sesión específica (incluye session_type)
// ✅ FINAL: getSession devuelve OBJETO DIRECTO, sin wrapper
export const GET_CHAT_SOURCE = gql`
  query GetSession($sessionId: String!) {
    getSession(sessionId: $sessionId) {
      id
      titulo
      session_type
      participants
      lastMessageAt
      status
      unreadCount
    }
  }
`;

// ========================================
// MUTATIONS DE MENSAJES
// ========================================

// Mutation para enviar mensaje
// ✅ VERIFICADO: API requiere AMBOS chatId: ID! Y sessionId: String!
// Input es SendMessageInput!, role debe ser enum MessageRole (USER, ASSISTANT, SYSTEM)
// errors es [String!]! (array de strings simple)
export const SEND_MESSAGE = gql`
  mutation SendMessage($chatId: ID!, $sessionId: String!, $content: String!) {
    sendMessage(
      chatId: $chatId
      sessionId: $sessionId
      input: {
        role: USER
        content: $content
        type: TEXT
      }
    ) {
      success
      message {
        id
        content
        type
      }
      errors
    }
  }
`;

// Subscription para nuevos mensajes
// ✅ FINAL: onNewMessage - Message tiene role y createdAt
export const NEW_MESSAGE_SUBSCRIPTION = gql`
  subscription OnNewMessage($sessionId: String!) {
    onNewMessage(sessionId: $sessionId) {
      id
      role
      content
      type
      createdAt
    }
  }
`;

// Mutation para marcar mensaje como visto
// ✅ CORREGIDO (1 Dic 2025): Solo sessionId + messageId según API2
// errors es [String!]! (array de strings simple)
export const MARK_MESSAGE_AS_READ = gql`
  mutation MarkMessageAsRead($sessionId: String!, $messageId: String!) {
    markAsRead(sessionId: $sessionId, messageId: $messageId) {
      success
      message {
        id
        readBy
      }
      errors
    }
  }
`;

// Mutation para actualizar título de sesión
// ✅ NUEVO: Actualizar título de la conversación
export const UPDATE_SESSION_TITLE = gql`
  mutation UpdateSessionTitle($sessionId: String!, $titulo: String!) {
    updateSession(sessionId: $sessionId, input: { titulo: $titulo }) {
      success
      session {
        id
        titulo
      }
      errors
    }
  }
`;

// ========================================
// QUERIES DE CONFIGURACIÓN DE USUARIO
// ========================================

// Obtener configuraciones de API del usuario
// ✅ CORRECCIÓN: Estructura correcta { success, apiConfigs, errors }
export const GET_USER_API_CONFIGS = gql`
  query GetUserApiConfigs($userId: String!) {
    getUserApiConfigs(userId: $userId) {
      success
      apiConfigs {
        provider
        apiKey
        model
        enabled
      }
      errors
    }
  }
`;

// ========================================
// QUERIES DE EVENTOS
// ========================================

// Obtener eventos del usuario por EMAIL
export const GET_USER_EVENTS_BY_EMAIL = gql`
  query GetAllUserRelatedEventsByEmail(
    $email: String!
    $development: String!
    $pagination: CRM_PaginationInput!
  ) {
    getAllUserRelatedEventsByEmail(
      email: $email
      development: $development
      pagination: $pagination
    ) {
      success
      eventos {
        id
        nombre
        fecha
        tipo
        estatus
        usuario_id
        usuario_nombre
        createdAt
        updatedAt
      }
      total
      errors {
        message
        code
      }
    }
  }
`;

// Obtener eventos del usuario por TELÉFONO
// ✅ CORRECCIÓN: API2 usa "phone" no "phoneNumber"
export const GET_USER_EVENTS_BY_PHONE = gql`
  query GetAllUserRelatedEventsByPhone(
    $phone: String!
    $development: String!
    $pagination: CRM_PaginationInput!
  ) {
    getAllUserRelatedEventsByPhone(
      phone: $phone
      development: $development
      pagination: $pagination
    ) {
      success
      eventos {
        id
        nombre
        fecha
        tipo
        estatus
        usuario_id
        usuario_nombre
        createdAt
        updatedAt
      }
      total
      errors {
        message
        code
      }
    }
  }
`;

// ========================================
// QUERIES DE PERFIL DE USUARIO
// ========================================

// Obtener perfil del usuario por email
export const GET_USER_PROFILE = gql`
  query GetUserByEmail($email: String!, $development: String!) {
    getUserByEmail(email: $email, development: $development) {
      success
      user {
        id
        email
        name
        role
        status
        development
        metadata
        whitelabel_info {
          whitelabel_id
          name
          domain
        }
      }
      errors
    }
  }
`;

// ========================================
// QUERIES DE WHITELABEL
// ========================================

// Obtener configuración del whitelabel (incluye API keys globales)
// ⚠️ Requiere Authorization header o X-Support-Key header
export const GET_WHITELABEL_CONFIG = gql`
  query GetWhitelabelConfig($development: String!, $supportKey: String!) {
    getWhiteLabelConfig(development: $development, supportKey: $supportKey) {
      success
      aiProvider
      aiModel
      aiApiKey
      errors {
        field
        message
      }
    }
  }
`;

// Obtener configuración de storage del whitelabel (Cloudflare R2)
// ⚠️ Requiere Authorization header o X-Support-Key header
export const GET_WHITELABEL_STORAGE_CONFIG = gql`
  query GetWhitelabelStorageConfig($development: String!, $supportKey: String!) {
    getWhiteLabelStorageConfig(development: $development, supportKey: $supportKey) {
      success
      r2AccountId
      r2AccessKeyId
      r2SecretAccessKey
      r2Bucket
      publicBaseUrl
      errors {
        field
        message
      }
    }
  }
`;

// ========================================
// QUERIES DE SUSCRIPCIÓN Y USO (TIERS)
// ========================================

// Obtener suscripción del usuario (tier y cuotas)
// ✅ CORREGIDO (1 Dic 2025): Schema OFICIAL de API2
// - Parámetros: user_id (snake_case), development
// - Respuesta: Objeto directo (sin wrapper success/errors)
// - Tiers: FREE, BASIC, PRO, ENTERPRISE, CUSTOM
// ⚠️ Requiere JWT en Authorization header
export const GET_USER_SUBSCRIPTION = gql`
  query GetUserSubscription($userId: String!, $development: String!) {
    getUserSubscription(user_id: $userId, development: $development) {
      _id
      user_id
      plan_id
      status
      current_period_start
      current_period_end
      current_usage {
        sku
        quantity_used
        quota_limit
        overage
        last_updated
      }
      plan {
        name
        tier
        pricing {
          monthly_fee
        }
        product_limits {
          sku
          service_name
          free_quota
        }
        feature_restrictions {
          max_users
          api_access
          priority_support
        }
      }
    }
  }
`;

// Obtener tracking de uso de AI
// ✅ CORREGIDO (1 Dic 2025): Schema OFICIAL de API2
// - Parámetros: pagination, filters (objeto con user_id, development, date_from, date_to)
// - Respuesta: records (array), total, pagination
// - Campos: snake_case
// ⚠️ Requiere JWT en Authorization header
export const GET_USAGE_TRACKING = gql`
  query GetUsageTracking(
    $pagination: CRM_PaginationInput!
    $filters: UsageTrackingFiltersInput
  ) {
    getUsageTracking(
      pagination: $pagination
      filters: $filters
    ) {
      records {
        _id
        user_id
        development
        provider
        model
        input_tokens
        output_tokens
        total_tokens
        cost
        timestamp
        session_id
        request_type
      }
      total
      pagination {
        page
        limit
        total_pages
      }
    }
  }
`;

// Mutation para registrar uso de AI
// ✅ EXISTENTE: Para contabilizar tokens consumidos
export const TRACK_USAGE = gql`
  mutation TrackUsage($input: UsageTrackingInput!) {
    trackUsage(input: $input) {
      success
      tracking {
        id
        totalTokens
        cost
      }
      errors
    }
  }
`;
