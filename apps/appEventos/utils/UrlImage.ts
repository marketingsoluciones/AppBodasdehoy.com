export const createURL = (slug : string | undefined | null) => {
    if(slug) return `${process.env.NEXT_PUBLIC_API_MCP_URL}${slug}`
}