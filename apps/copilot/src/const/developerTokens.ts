/**
 * Tokens JWT por developer para modo desarrollo
 * 
 * ⚠️ IMPORTANTE: Estos tokens son solo para desarrollo local
 * En producción, los usuarios deben autenticarse normalmente
 */

export const DEVELOPER_TOKENS: Record<string, string> = {
  'bodasdehoy': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJib2Rhc2RlaG95LWFkbWluLWJvZGFzZWhveS1jb20tMTc2MzAyNjg5MTU1OCIsImVtYWlsIjoiYWRtaW5AbW9kYXNkZWhveS5jb20iLCJyb2xlIjoiYWRtaW4iLCJkZXZlbG9wbWVudCI6ImJvZGFzZGVob3kiLCJpYXQiOjE3NjMwMjY4OTEsImV4cCI6MTc2NTYxODg5MTd9.RSTE1bxElZH4l9aYHWwwE12Puto4zSFknqPydVzc8BQ',
  'marcablanca': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJtYXJjYWJsYW5jYS1hZG1pbi1tYXJjYWJsYW5jYS1jb20tMTc2MzAyNjYyMzExMiIsImVtYWlsIjoiYWRtaW5AbWFyY2FibGxjYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJkZXZlbG9wbWVudCI6Im1hcmNhYmxhbmNhIiwiaWF0IjoxNzYzMDI2NjIzLCJleHAiOjE3NjU2MTg2MjN9.nmyvv_oxvlFjEw-8h8Dmy3tysJPLHURJD5Gw352z4aY',
  'wildliberty': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiJ3aWxkbGliZXJ0eS12aXNpdGEtd2lsZGxpYnJ0eS1jb20tMTc2MzAyNjYxNjg0MCIsImVtYWlsIjoidmlzaXRhQHdpbGRsaWJydHkuY29tIiwicm9sZSI6InVzZXIiLCJkZXZlbG9wbWVudCI6IndpbGRsaWJydHkiLCJpYXQiOjE3NjMwMjY2MTYsImV4cCI6MTc2NTYxODYxNn0.YL7z1Q8shMaQHLegkHo66A0hmMYhgco_H53pV6DHh04',
};

export const getDeveloperToken = (developer: string): string | undefined => {
  return DEVELOPER_TOKENS[developer];
};

export const setDeveloperToken = (developer: string, token: string): void => {
  if (typeof window !== 'undefined' && token) {
    // Guardar en localStorage para que apolloClient lo use
    localStorage.setItem('jwt_token', token);
    
    // También actualizar en dev-user-config
    try {
      const configStr = localStorage.getItem('dev-user-config');
      let config = {};
      if (configStr) {
        try {
          if (configStr.trim().startsWith('{') || configStr.trim().startsWith('[')) {
            config = JSON.parse(configStr);
          }
        } catch (e) {
          console.warn('⚠️ Error parseando dev-user-config en developerTokens:', e);
          config = {};
        }
      }
      config.token = token;
      config.development = developer;
      config.timestamp = Date.now();
      localStorage.setItem('dev-user-config', JSON.stringify(config));
      
      console.log(`✅ Token JWT guardado para ${developer}`);
    } catch (e) {
      console.warn('Error guardando config:', e);
    }
  }
};
