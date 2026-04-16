/**
 * Configuración que la app host debe inyectar al Creador.
 * apiBaseUrl: base del backend (GraphQL, chat, etc.)
 * tenantId / theme: para whitelabel.
 */
export interface WeddingCreatorConfig {
  apiBaseUrl: string;
  tenantId?: string;
  theme?: {
    primaryColor?: string;
    logoUrl?: string;
    name?: string;
  };
  /** Token o callback para auth en llamadas a API */
  getAuthToken?: () => Promise<string | null>;
}
