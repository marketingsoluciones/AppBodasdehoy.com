import { resolveApiBodasOrigin } from './apiEndpoints'

export const createURL = (slug : string | undefined | null) => {
    if(slug) return `${resolveApiBodasOrigin()}${slug}`
}
