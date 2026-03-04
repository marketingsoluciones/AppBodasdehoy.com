declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      /**
       * Dominios corporativos con acceso al debug (separados por coma)
       * Los usuarios con email en estos dominios pueden acceder al debug
       * Ejemplo: "bodasdehoy.com,miempresa.com"
       */
      NEXT_PUBLIC_DEBUG_ADMIN_DOMAINS: string;
      /**
       * Lista de emails con acceso al panel de debug (separados por coma)
       * Ejemplo: "admin@company.com,dev@company.com"
       */
      NEXT_PUBLIC_DEBUG_ADMIN_EMAILS: string;
      NEXT_PUBLIC_DEVELOPER_DEBUG: string;
      NEXT_PUBLIC_I18N_DEBUG: string;
      NEXT_PUBLIC_I18N_DEBUG_BROWSER: string;
      NEXT_PUBLIC_I18N_DEBUG_SERVER: string;
    }
  }
}

export const getDebugConfig = () => ({
  
  
// Corporate domains for debug panel access (comma-separated)
DEBUG_ADMIN_DOMAINS: (process.env.NEXT_PUBLIC_DEBUG_ADMIN_DOMAINS || 'bodasdehoy.com')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),

  
  


// Admin emails for debug panel access (comma-separated)
DEBUG_ADMIN_EMAILS: (process.env.NEXT_PUBLIC_DEBUG_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  


// developer debug mode
DEBUG_MODE: process.env.NEXT_PUBLIC_DEVELOPER_DEBUG === '1',
  

// i18n debug mode
I18N_DEBUG: process.env.NEXT_PUBLIC_I18N_DEBUG === '1',

  
  
I18N_DEBUG_BROWSER: process.env.NEXT_PUBLIC_I18N_DEBUG_BROWSER === '1',

  
  I18N_DEBUG_SERVER: process.env.NEXT_PUBLIC_I18N_DEBUG_SERVER === '1',
});
