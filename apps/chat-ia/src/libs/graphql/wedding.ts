import { gql } from '@apollo/client';

/**
 * GraphQL Queries y Mutations para Wedding Web Creator
 * ====================================================
 * Según guía de implementación backend - 14 de Diciembre 2025
 * Endpoint: https://api2.eventosorganizador.com/graphql
 */

// ========================================
// QUERIES
// ========================================

/**
 * Obtener Wedding Web por EventId
 */
export const GET_WEDDING_WEB = gql`
  query GetWeddingWeb($eventId: String!) {
    getWeddingWeb(eventId: $eventId) {
      success
      weddingWeb {
        weddingWebId
        status
        subdomain
        previewToken
        couple {
          partner1 { name photoUrl role }
          partner2 { name photoUrl role }
          hashtag
        }
        style {
          template
          primaryColor
          secondaryColor
          heroImageUrl
          fontHeading
          fontBody
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Obtener Wedding Web por ID
 */
export const GET_WEDDING_WEB_BY_ID = gql`
  query GetWeddingWebById($weddingWebId: String!) {
    getWeddingWebById(weddingWebId: $weddingWebId) {
      success
      weddingWeb {
        weddingWebId
        status
        subdomain
        previewToken
        couple {
          partner1 { name photoUrl role }
          partner2 { name photoUrl role }
          hashtag
        }
        style {
          template
          primaryColor
          secondaryColor
          heroImageUrl
          fontHeading
          fontBody
        }
        sections {
          name
          enabled
        }
        rsvpConfig {
          enabled
          deadline
          maxPlusOnes
          mealOptions
          questions { id question type options required order }
        }
        venue {
          ceremony {
            name
            address
            city
            time
            coordinates { lat lng }
            dressCode
            notes
          }
          reception {
            name
            address
            city
            time
            coordinates { lat lng }
          }
          sameVenue
          parkingInfo
          accommodationInfo
        }
        ourStory {
          howWeMet
          firstDate
          proposal
          photos
        }
        giftRegistry {
          enabled
          message
          links {
            id
            name
            url
            logoUrl
            description
          }
          cashOption {
            enabled
            message
            iban
          }
        }
        faqItems {
          id
          question
          answer
          order
        }
        seo {
          title
          description
          ogImage
          keywords
          noIndex
        }
        albumId
        eventDate
        eventName
        createdAt
        updatedAt
        publishedAt
      }
      errors { field message code }
    }
  }
`;

/**
 * Obtener Wedding Web Pública (Sin Auth)
 */
export const GET_PUBLIC_WEDDING_WEB = gql`
  query GetPublicWeddingWeb($subdomain: String!) {
    getPublicWeddingWeb(subdomain: $subdomain) {
      success
      weddingWeb {
        subdomain
        couple {
          partner1 { name photoUrl }
          partner2 { name photoUrl }
          hashtag
        }
        style {
          template
          primaryColor
          secondaryColor
          heroImageUrl
        }
        sections {
          name
          enabled
        }
        eventDate
        eventName
        galleryPhotos {
          id
          url
          caption
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Preview con Token (Sin Auth)
 */
export const GET_WEDDING_WEB_PREVIEW = gql`
  query GetWeddingWebPreview($previewToken: String!) {
    getWeddingWebPreview(previewToken: $previewToken) {
      success
      weddingWeb {
        weddingWebId
        status
        subdomain
        previewToken
        couple {
          partner1 { name photoUrl role }
          partner2 { name photoUrl role }
          hashtag
        }
        style {
          template
          primaryColor
          secondaryColor
          heroImageUrl
        }
        sections {
          name
          enabled
        }
        venue {
          ceremony { name address city time }
          reception { name address city time }
          sameVenue
        }
        rsvpConfig {
          enabled
          deadline
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Listar Webs del Usuario
 */
export const GET_MY_WEDDING_WEBS = gql`
  query GetMyWeddingWebs(
    $development: String!
    $status: WeddingWebStatus
    $pagination: CRM_PaginationInput
  ) {
    getMyWeddingWebs(
      development: $development
      status: $status
      pagination: $pagination
    ) {
      success
      weddingWebs {
        weddingWebId
        eventId
        status
        subdomain
        createdAt
      }
      total
      pagination {
        limit
        offset
        hasMore
      }
      errors { field message code }
    }
  }
`;

/**
 * Verificar Disponibilidad de Subdomain
 */
export const CHECK_SUBDOMAIN_AVAILABILITY = gql`
  query CheckSubdomainAvailability($subdomain: String!) {
    checkSubdomainAvailability(subdomain: $subdomain) {
      success
      available
      suggestion
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS CRUD
// ========================================

/**
 * Crear Wedding Web
 */
export const CREATE_WEDDING_WEB = gql`
  mutation CreateWeddingWeb($input: CreateWeddingWebInput!) {
    createWeddingWeb(input: $input) {
      success
      weddingWeb {
        weddingWebId
        status
        subdomain
        previewToken
        couple {
          partner1 { name photoUrl }
          partner2 { name photoUrl }
        }
        style {
          template
          primaryColor
          secondaryColor
        }
      }
      billing {
        sku
        quantity
        recorded
        withinQuota
      }
      errors { field message code }
    }
  }
`;

/**
 * Actualizar Wedding Web Completa
 */
export const UPDATE_WEDDING_WEB = gql`
  mutation UpdateWeddingWeb($weddingWebId: String!, $input: UpdateWeddingWebInput!) {
    updateWeddingWeb(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        weddingWebId
        couple {
          partner1 { name photoUrl }
          partner2 { name photoUrl }
        }
        ourStory {
          howWeMet
          firstDate
          proposal
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Eliminar Wedding Web
 */
export const DELETE_WEDDING_WEB = gql`
  mutation DeleteWeddingWeb($weddingWebId: String!) {
    deleteWeddingWeb(weddingWebId: $weddingWebId) {
      success
      errors { field message code }
    }
  }
`;

/**
 * Publicar Wedding Web
 */
export const PUBLISH_WEDDING_WEB = gql`
  mutation PublishWeddingWeb($weddingWebId: String!, $subdomain: String) {
    publishWeddingWeb(weddingWebId: $weddingWebId, subdomain: $subdomain) {
      success
      weddingWeb {
        status
        publishedAt
        subdomain
      }
      billing {
        sku
        quantity
        recorded
        withinQuota
      }
      errors { field message code }
    }
  }
`;

/**
 * Despublicar Wedding Web
 */
export const UNPUBLISH_WEDDING_WEB = gql`
  mutation UnpublishWeddingWeb($weddingWebId: String!) {
    unpublishWeddingWeb(weddingWebId: $weddingWebId) {
      success
      weddingWeb {
        status
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS GRANULARES - CONTENIDO
// ========================================

/**
 * Actualizar Información de Pareja
 */
export const UPDATE_WEDDING_COUPLE = gql`
  mutation UpdateWeddingCouple(
    $weddingWebId: String!
    $partner1: UpdatePartnerInput
    $partner2: UpdatePartnerInput
    $hashtag: String
  ) {
    updateWeddingCouple(
      weddingWebId: $weddingWebId
      partner1: $partner1
      partner2: $partner2
      hashtag: $hashtag
    ) {
      success
      weddingWeb {
        couple {
          partner1 { name photoUrl }
          partner2 { name photoUrl }
          hashtag
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Actualizar Historia de la Pareja
 */
export const UPDATE_WEDDING_OUR_STORY = gql`
  mutation UpdateWeddingOurStory($weddingWebId: String!, $input: OurStoryInput!) {
    updateWeddingOurStory(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        ourStory {
          howWeMet
          firstDate
          proposal
          photos
        }
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS GRANULARES - ESTILO
// ========================================

/**
 * Actualizar Estilo Completo
 */
export const UPDATE_WEDDING_STYLE = gql`
  mutation UpdateWeddingStyle($weddingWebId: String!, $input: WeddingStyleInput!) {
    updateWeddingStyle(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        style {
          template
          primaryColor
          secondaryColor
          fontHeading
          fontBody
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Actualizar Solo Colores
 */
export const UPDATE_WEDDING_COLORS = gql`
  mutation UpdateWeddingColors(
    $weddingWebId: String!
    $primaryColor: String
    $secondaryColor: String
    $accentColor: String
    $backgroundColor: String
    $textColor: String
  ) {
    updateWeddingColors(
      weddingWebId: $weddingWebId
      primaryColor: $primaryColor
      secondaryColor: $secondaryColor
      accentColor: $accentColor
      backgroundColor: $backgroundColor
      textColor: $textColor
    ) {
      success
      weddingWeb {
        style {
          primaryColor
          secondaryColor
          accentColor
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Cambiar Imagen Hero
 */
export const SET_WEDDING_HERO_IMAGE = gql`
  mutation SetWeddingHeroImage(
    $weddingWebId: String!
    $imageUrl: String!
    $overlayOpacity: Float
  ) {
    setWeddingHeroImage(
      weddingWebId: $weddingWebId
      imageUrl: $imageUrl
      overlayOpacity: $overlayOpacity
    ) {
      success
      weddingWeb {
        style {
          heroImageUrl
          heroOverlayOpacity
        }
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS GRANULARES - SECCIONES
// ========================================

/**
 * Actualizar Sección
 */
export const UPDATE_WEDDING_SECTION = gql`
  mutation UpdateWeddingSection($weddingWebId: String!, $input: UpdateSectionInput!) {
    updateWeddingSection(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        sections {
          name
          enabled
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Activar/Desactivar Sección
 */
export const TOGGLE_WEDDING_SECTION = gql`
  mutation ToggleWeddingSection(
    $weddingWebId: String!
    $section: WeddingSectionName!
    $enabled: Boolean!
  ) {
    toggleWeddingSection(
      weddingWebId: $weddingWebId
      section: $section
      enabled: $enabled
    ) {
      success
      weddingWeb {
        sections {
          name
          enabled
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Reordenar Secciones
 */
export const REORDER_WEDDING_SECTIONS = gql`
  mutation ReorderWeddingSections($weddingWebId: String!, $input: ReorderSectionsInput!) {
    reorderWeddingSections(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        sections {
          hero { order }
          couple { order }
          ourStory { order }
        }
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS GRANULARES - LUGARES
// ========================================

/**
 * Actualizar Lugares (Venue)
 */
export const UPDATE_WEDDING_VENUE = gql`
  mutation UpdateWeddingVenue($weddingWebId: String!, $input: VenueInfoInput!) {
    updateWeddingVenue(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        venue {
          ceremony {
            name
            address
            city
            time
            coordinates { lat lng }
          }
          reception {
            name
            address
            city
            time
          }
          sameVenue
        }
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS GRANULARES - RSVP
// ========================================

/**
 * Configurar RSVP
 */
export const UPDATE_WEDDING_RSVP = gql`
  mutation UpdateWeddingRSVP($weddingWebId: String!, $input: RSVPConfigInput!) {
    updateWeddingRSVP(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        rsvpConfig {
          enabled
          deadline
          maxPlusOnes
          mealOptions
          questions {
            id
            question
            type
            required
          }
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Añadir Pregunta RSVP
 */
export const ADD_WEDDING_RSVP_QUESTION = gql`
  mutation AddWeddingRSVPQuestion($weddingWebId: String!, $question: RSVPQuestionInput!) {
    addWeddingRSVPQuestion(weddingWebId: $weddingWebId, question: $question) {
      success
      weddingWeb {
        rsvpConfig {
          questions { id question type }
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Eliminar Pregunta RSVP
 */
export const REMOVE_WEDDING_RSVP_QUESTION = gql`
  mutation RemoveWeddingRSVPQuestion($weddingWebId: String!, $questionId: String!) {
    removeWeddingRSVPQuestion(weddingWebId: $weddingWebId, questionId: $questionId) {
      success
      weddingWeb {
        rsvpConfig {
          questions { id question }
        }
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS GRANULARES - REGALOS
// ========================================

/**
 * Actualizar Lista de Regalos
 */
export const UPDATE_WEDDING_GIFT_REGISTRY = gql`
  mutation UpdateWeddingGiftRegistry($weddingWebId: String!, $input: GiftRegistryInput!) {
    updateWeddingGiftRegistry(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        giftRegistry {
          enabled
          message
          links {
            id
            name
            url
          }
          cashOption {
            enabled
            message
            iban
          }
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Añadir Link a Lista de Regalos
 */
export const ADD_WEDDING_GIFT_LINK = gql`
  mutation AddWeddingGiftLink($weddingWebId: String!, $link: GiftRegistryLinkInput!) {
    addWeddingGiftLink(weddingWebId: $weddingWebId, link: $link) {
      success
      weddingWeb {
        giftRegistry {
          links { id name url }
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Eliminar Link de Lista de Regalos
 */
export const REMOVE_WEDDING_GIFT_LINK = gql`
  mutation RemoveWeddingGiftLink($weddingWebId: String!, $linkId: String!) {
    removeWeddingGiftLink(weddingWebId: $weddingWebId, linkId: $linkId) {
      success
      weddingWeb {
        giftRegistry {
          links { id name }
        }
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS GRANULARES - FAQS
// ========================================

/**
 * Añadir FAQ
 */
export const ADD_WEDDING_FAQ = gql`
  mutation AddWeddingFAQ($weddingWebId: String!, $faq: FAQItemInput!) {
    addWeddingFAQ(weddingWebId: $weddingWebId, faq: $faq) {
      success
      weddingWeb {
        faqItems {
          id
          question
          answer
          order
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Actualizar FAQ
 */
export const UPDATE_WEDDING_FAQ = gql`
  mutation UpdateWeddingFAQ($weddingWebId: String!, $faqId: String!, $faq: FAQItemInput!) {
    updateWeddingFAQ(weddingWebId: $weddingWebId, faqId: $faqId, faq: $faq) {
      success
      weddingWeb {
        faqItems {
          id
          question
          answer
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Eliminar FAQ
 */
export const REMOVE_WEDDING_FAQ = gql`
  mutation RemoveWeddingFAQ($weddingWebId: String!, $faqId: String!) {
    removeWeddingFAQ(weddingWebId: $weddingWebId, faqId: $faqId) {
      success
      weddingWeb {
        faqItems { id question }
      }
      errors { field message code }
    }
  }
`;

/**
 * Reordenar FAQs
 */
export const REORDER_WEDDING_FAQS = gql`
  mutation ReorderWeddingFAQs($weddingWebId: String!, $faqIds: [String!]!) {
    reorderWeddingFAQs(weddingWebId: $weddingWebId, faqIds: $faqIds) {
      success
      weddingWeb {
        faqItems {
          id
          question
          order
        }
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS GRANULARES - SEO Y CONFIG
// ========================================

/**
 * Actualizar SEO
 */
export const UPDATE_WEDDING_SEO = gql`
  mutation UpdateWeddingSEO($weddingWebId: String!, $input: SEOConfigInput!) {
    updateWeddingSEO(weddingWebId: $weddingWebId, input: $input) {
      success
      weddingWeb {
        seo {
          title
          description
          ogImage
          keywords
          noIndex
        }
      }
      errors { field message code }
    }
  }
`;

/**
 * Vincular Album
 */
export const LINK_WEDDING_ALBUM = gql`
  mutation LinkWeddingAlbum($weddingWebId: String!, $albumId: String!) {
    linkWeddingAlbum(weddingWebId: $weddingWebId, albumId: $albumId) {
      success
      weddingWeb {
        albumId
      }
      errors { field message code }
    }
  }
`;

/**
 * Desvincular Album
 */
export const UNLINK_WEDDING_ALBUM = gql`
  mutation UnlinkWeddingAlbum($weddingWebId: String!) {
    unlinkWeddingAlbum(weddingWebId: $weddingWebId) {
      success
      weddingWeb {
        albumId
      }
      errors { field message code }
    }
  }
`;

/**
 * Cambiar Subdomain
 */
export const CHANGE_WEDDING_SUBDOMAIN = gql`
  mutation ChangeWeddingSubdomain($weddingWebId: String!, $newSubdomain: String!) {
    changeWeddingSubdomain(weddingWebId: $weddingWebId, newSubdomain: $newSubdomain) {
      success
      weddingWeb {
        subdomain
      }
      errors { field message code }
    }
  }
`;

/**
 * Regenerar Preview Token
 */
export const REGENERATE_WEDDING_PREVIEW_TOKEN = gql`
  mutation RegenerateWeddingPreviewToken($weddingWebId: String!) {
    regenerateWeddingPreviewToken(weddingWebId: $weddingWebId) {
      success
      weddingWeb {
        previewToken
      }
      errors { field message code }
    }
  }
`;

// ========================================
// MUTATIONS PUBLICAS (Sin Auth)
// ========================================

/**
 * Enviar Respuesta RSVP (Sin Auth)
 */
export const SUBMIT_RSVP = gql`
  mutation SubmitRSVP($weddingWebId: String!, $input: RSVPResponseInput!) {
    submitRSVP(weddingWebId: $weddingWebId, input: $input) {
      success
      response {
        _id
        attending
        confirmationCode
      }
      errors { field message code }
    }
  }
`;
