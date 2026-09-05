import { resolveImagesOrigin } from './apiEndpoints'

// Construye la URL final de una imagen a partir del valor guardado.
// - Si ya es absoluta (http(s)://, data:, blob:) → se devuelve tal cual (imágenes NUEVAS,
//   que se guardan con la URL absoluta de nuestro host → estáticas, no dependen de prefijo).
// - Si es ruta relativa (/...) → se le antepone el host de imágenes (resolveImagesOrigin),
//   repunteable el día que se apague apiapp sin tocar código ni BD.
export const createURL = (slug: string | undefined | null) => {
    if (!slug) return undefined
    if (/^(https?:|data:|blob:)/i.test(slug)) return slug
    return `${resolveImagesOrigin()}${slug}`
}
