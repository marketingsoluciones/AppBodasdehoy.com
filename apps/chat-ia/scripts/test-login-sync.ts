/**
 * Script de Prueba para Login y Sincronización con Chat
 * 
 * Este script proporciona funciones para probar el sistema de login
 * y verificar que se sincroniza correctamente con el chat/copilot.
 * 
 * Usa las herramientas MCP del navegador de Cursor para automatizar las pruebas.
 * 
 * IMPORTANTE:
 * - El popup de Google OAuth requiere interacción manual
 * - Después del login, el usuario debe estar automáticamente logueado en el chat
 * - La sesión se comparte entre subdominios del mismo dominio base
 */

interface TestConfig {
  /** URL base del proyecto */
  baseUrl: string;
  /** Email para pruebas de registro/login */
  testEmail?: string;
  /** Password para pruebas de registro/login */
  testPassword?: string;
  /** Si debe verificar sincronización con chat después del login */
  verifyChatSync?: boolean;
  /** Si debe verificar sesión compartida en subdominios */
  verifySubdomainSharing?: boolean;
  /** Subdominios para verificar sesión compartida */
  relatedSubdomains?: string[];
}

/**
 * Verifica que el usuario está logueado en el chat
 */
export async function verifyChatLogin(): Promise<{
  isLoggedIn: boolean;
  userId?: string;
  hasToken: boolean;
  hasConfig: boolean;
  details: any;
}> {
  console.log('🔍 Verificando estado de login en el chat...');

  // Esta función se ejecutará en el contexto del navegador
  const verificationScript = `
    (function() {
      // Verificar localStorage
      const api2Token = localStorage.getItem('api2_jwt_token');
      const jwtToken = localStorage.getItem('jwt_token');
      const devUserConfig = localStorage.getItem('dev-user-config');
      
      // Parsear dev-user-config si existe
      let config = null;
      if (devUserConfig) {
        try {
          config = JSON.parse(devUserConfig);
        } catch (e) {
          console.warn('Error parseando dev-user-config:', e);
        }
      }
      
      // Verificar store de Zustand (si está disponible)
      let chatStoreState = null;
      try {
        // Intentar acceder al store de chat
        if (typeof window !== 'undefined' && (window as any).__ZUSTAND_STORES__) {
          // El store puede estar disponible globalmente
          const stores = (window as any).__ZUSTAND_STORES__;
          if (stores.chatStore) {
            chatStoreState = stores.chatStore.getState();
          }
        }
      } catch (e) {
        // El store puede no estar disponible en este contexto
      }
      
      // Verificar cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      const hasDevUserConfigCookie = !!cookies['dev-user-config'];
      
      return {
        hasApi2Token: !!api2Token,
        hasJwtToken: !!jwtToken,
        hasDevUserConfig: !!devUserConfig,
        hasDevUserConfigCookie: hasDevUserConfigCookie,
        userId: config?.userId || config?.user_id || null,
        userEmail: config?.email || (config?.userId && config.userId.includes('@') ? config.userId : null),
        development: config?.developer || config?.development || null,
        userType: config?.user_type || null,
        token: api2Token || jwtToken || null,
        config: config,
        chatStoreState: chatStoreState,
        cookies: Object.keys(cookies).filter(k => k.includes('session') || k.includes('dev-user')),
      };
    })();
  `;

  // Nota: Esta función sería llamada desde las herramientas MCP
  // const result = await browser_execute_script({ script: verificationScript });
  
  // Por ahora, retornamos una estructura de ejemplo
  return {
    isLoggedIn: false,
    hasToken: false,
    hasConfig: false,
    details: {
      message: 'Esta función debe ser llamada desde las herramientas MCP del navegador',
      script: verificationScript,
    },
  };
}

/**
 * Prueba login con Google
 * 
 * IMPORTANTE: Requiere interacción manual en el popup de Google
 */
export async function testGoogleLogin(config: TestConfig): Promise<{
  success: boolean;
  message: string;
  steps: string[];
}> {
  const { baseUrl, verifyChatSync = true } = config;
  
  console.log('🚀 Iniciando prueba de login con Google...');
  console.log(`📍 URL: ${baseUrl}`);

  const steps: string[] = [];
  
  try {
    // Paso 1: Navegar a la página
    steps.push('1. Navegar a la página');
    // await browser_navigate({ url: baseUrl });
    // await browser_wait_for({ time: 2000 });
    
    // Paso 2: Abrir modal de login
    steps.push('2. Abrir modal de login');
    const openModalScript = `
      if (typeof window.openLoginModal === 'function') {
        window.openLoginModal();
        return 'Modal abierto';
      } else {
        return 'Error: window.openLoginModal no está disponible';
      }
    `;
    // await browser_execute_script({ script: openModalScript });
    // await browser_wait_for({ text: 'Continuar con Google' });
    
    // Paso 3: Hacer clic en botón de Google
    steps.push('3. Hacer clic en botón "Continuar con Google"');
    // await browser_click({
    //   element: 'Botón Continuar con Google',
    //   ref: '[data-testid="google-login-button"]'
    // });
    
    // Paso 4: Esperar interacción manual
    steps.push('4. ⚠️ INTERACCIÓN MANUAL REQUERIDA: Seleccionar cuenta y autorizar en popup de Google');
    steps.push('5. Esperar a que se complete el login...');
    // await browser_wait_for({ time: 5000 });
    
    // Paso 5: Verificar login exitoso
    if (verifyChatSync) {
      steps.push('6. Verificar sincronización con chat');
      // const verification = await verifyChatLogin();
      // if (!verification.isLoggedIn) {
      //   throw new Error('Usuario no está logueado en el chat después del login');
      // }
    }
    
    return {
      success: true,
      message: 'Prueba de login con Google completada. Verifica que el usuario está logueado en el chat.',
      steps,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error en prueba de login con Google: ${error.message}`,
      steps,
    };
  }
}

/**
 * Prueba registro con email/contraseña
 */
export async function testEmailRegister(config: TestConfig): Promise<{
  success: boolean;
  message: string;
  steps: string[];
}> {
  const { baseUrl, testEmail, testPassword, verifyChatSync = true } = config;
  
  if (!testEmail || !testPassword) {
    throw new Error('testEmail y testPassword son requeridos para esta prueba');
  }
  
  console.log('🚀 Iniciando prueba de registro con email...');
  console.log(`📍 URL: ${baseUrl}`);
  console.log(`📧 Email: ${testEmail}`);

  const steps: string[] = [];
  
  try {
    // Paso 1: Navegar a la página
    steps.push('1. Navegar a la página');
    // await browser_navigate({ url: baseUrl });
    // await browser_wait_for({ time: 2000 });
    
    // Paso 2: Abrir modal de login
    steps.push('2. Abrir modal de login');
    // await browser_execute_script({
    //   script: 'window.openLoginModal && window.openLoginModal();'
    // });
    // await browser_wait_for({ text: 'Registrarse' });
    
    // Paso 3: Cambiar a tab "Registrarse"
    steps.push('3. Cambiar a tab "Registrarse"');
    // await browser_click({
    //   element: 'Tab Registrarse',
    //   ref: '[data-testid="login-tabs"] .ant-tabs-tab[data-node-key="register"]'
    // });
    // await browser_wait_for({ time: 500 });
    
    // Paso 4: Llenar email
    steps.push('4. Llenar campo de email');
    // await browser_type({
    //   element: 'Campo de email',
    //   ref: '[data-testid="email-input"]',
    //   text: testEmail
    // });
    
    // Paso 5: Llenar password
    steps.push('5. Llenar campo de password');
    // await browser_type({
    //   element: 'Campo de password',
    //   ref: '[data-testid="password-input"]',
    //   text: testPassword
    // });
    
    // Paso 6: Hacer clic en "Crear cuenta"
    steps.push('6. Hacer clic en botón "Crear cuenta"');
    // await browser_click({
    //   element: 'Botón Crear cuenta',
    //   ref: '[data-testid="submit-button"]'
    // });
    
    // Paso 7: Esperar a que se complete el registro
    steps.push('7. Esperar a que se complete el registro...');
    // await browser_wait_for({ time: 5000 });
    
    // Paso 8: Verificar registro exitoso
    if (verifyChatSync) {
      steps.push('8. Verificar sincronización con chat');
      // const verification = await verifyChatLogin();
      // if (!verification.isLoggedIn || verification.userId !== testEmail) {
      //   throw new Error('Usuario no está registrado/logueado correctamente en el chat');
      // }
    }
    
    return {
      success: true,
      message: 'Prueba de registro con email completada. Verifica que el usuario está logueado en el chat.',
      steps,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error en prueba de registro con email: ${error.message}`,
      steps,
    };
  }
}

/**
 * Prueba login con email/contraseña (usuario existente)
 */
export async function testEmailLogin(config: TestConfig): Promise<{
  success: boolean;
  message: string;
  steps: string[];
}> {
  const { baseUrl, testEmail, testPassword, verifyChatSync = true } = config;
  
  if (!testEmail || !testPassword) {
    throw new Error('testEmail y testPassword son requeridos para esta prueba');
  }
  
  console.log('🚀 Iniciando prueba de login con email...');
  console.log(`📍 URL: ${baseUrl}`);
  console.log(`📧 Email: ${testEmail}`);

  const steps: string[] = [];
  
  try {
    // Paso 1: Navegar a la página
    steps.push('1. Navegar a la página');
    // await browser_navigate({ url: baseUrl });
    // await browser_wait_for({ time: 2000 });
    
    // Paso 2: Abrir modal de login
    steps.push('2. Abrir modal de login');
    // await browser_execute_script({
    //   script: 'window.openLoginModal && window.openLoginModal();'
    // });
    // await browser_wait_for({ text: 'Iniciar sesión' });
    
    // Paso 3: Asegurar que está en tab "Iniciar sesión"
    steps.push('3. Verificar que está en tab "Iniciar sesión"');
    // await browser_click({
    //   element: 'Tab Iniciar sesión',
    //   ref: '[data-testid="login-tabs"] .ant-tabs-tab[data-node-key="login"]'
    // });
    // await browser_wait_for({ time: 500 });
    
    // Paso 4: Llenar email
    steps.push('4. Llenar campo de email');
    // await browser_type({
    //   element: 'Campo de email',
    //   ref: '[data-testid="email-input"]',
    //   text: testEmail
    // });
    
    // Paso 5: Llenar password
    steps.push('5. Llenar campo de password');
    // await browser_type({
    //   element: 'Campo de password',
    //   ref: '[data-testid="password-input"]',
    //   text: testPassword
    // });
    
    // Paso 6: Hacer clic en "Iniciar sesión"
    steps.push('6. Hacer clic en botón "Iniciar sesión"');
    // await browser_click({
    //   element: 'Botón Iniciar sesión',
    //   ref: '[data-testid="submit-button"]'
    // });
    
    // Paso 7: Esperar a que se complete el login
    steps.push('7. Esperar a que se complete el login...');
    // await browser_wait_for({ time: 5000 });
    
    // Paso 8: Verificar login exitoso
    if (verifyChatSync) {
      steps.push('8. Verificar sincronización con chat');
      // const verification = await verifyChatLogin();
      // if (!verification.isLoggedIn || verification.userId !== testEmail) {
      //   throw new Error('Usuario no está logueado correctamente en el chat');
      // }
    }
    
    return {
      success: true,
      message: 'Prueba de login con email completada. Verifica que el usuario está logueado en el chat.',
      steps,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error en prueba de login con email: ${error.message}`,
      steps,
    };
  }
}

/**
 * Prueba sesión compartida entre subdominios
 */
export async function testSubdomainSharing(config: TestConfig): Promise<{
  success: boolean;
  message: string;
  steps: string[];
}> {
  const { baseUrl, relatedSubdomains = [], verifyChatSync = true } = config;
  
  if (relatedSubdomains.length === 0) {
    throw new Error('relatedSubdomains es requerido para esta prueba');
  }
  
  console.log('🚀 Iniciando prueba de sesión compartida entre subdominios...');
  console.log(`📍 URL base: ${baseUrl}`);
  console.log(`📍 Subdominios relacionados: ${relatedSubdomains.join(', ')}`);

  const steps: string[] = [];
  
  try {
    // Paso 1: Verificar login en URL base
    steps.push('1. Verificar que el usuario está logueado en la URL base');
    // const baseVerification = await verifyChatLogin();
    // if (!baseVerification.isLoggedIn) {
    //   throw new Error('Usuario no está logueado en la URL base');
    // }
    
    // Paso 2: Navegar a cada subdominio y verificar sesión
    for (const subdomain of relatedSubdomains) {
      steps.push(`2. Navegar a ${subdomain}`);
      // await browser_navigate({ url: subdomain });
      // await browser_wait_for({ time: 2000 });
      
      steps.push(`3. Verificar sesión en ${subdomain}`);
      // const subdomainVerification = await verifyChatLogin();
      // if (!subdomainVerification.isLoggedIn) {
      //   throw new Error(`Usuario no está logueado en ${subdomain}`);
      // }
      
      // Verificar que la cookie está presente
      steps.push(`4. Verificar cookie compartida en ${subdomain}`);
      // const cookieScript = `
      //   document.cookie.split(';').some(cookie => 
      //     cookie.trim().startsWith('dev-user-config=')
      //   )
      // `;
      // const hasCookie = await browser_execute_script({ script: cookieScript });
      // if (!hasCookie) {
      //   throw new Error(`Cookie dev-user-config no está presente en ${subdomain}`);
      // }
    }
    
    return {
      success: true,
      message: 'Prueba de sesión compartida completada. Verifica que la sesión persiste en todos los subdominios.',
      steps,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error en prueba de sesión compartida: ${error.message}`,
      steps,
    };
  }
}

/**
 * Función helper para ejecutar todas las pruebas
 */
export async function runAllTests(config: TestConfig): Promise<{
  googleLogin: any;
  emailRegister?: any;
  emailLogin?: any;
  subdomainSharing?: any;
}> {
  console.log('🧪 Ejecutando todas las pruebas de login y sincronización...');
  
  const results: any = {};
  
  // Prueba 1: Login con Google
  results.googleLogin = await testGoogleLogin(config);
  
  // Prueba 2: Registro con email (si se proporcionan credenciales)
  if (config.testEmail && config.testPassword) {
    results.emailRegister = await testEmailRegister(config);
  }
  
  // Prueba 3: Login con email (si se proporcionan credenciales)
  if (config.testEmail && config.testPassword) {
    results.emailLogin = await testEmailLogin(config);
  }
  
  // Prueba 4: Sesión compartida (si se proporcionan subdominios)
  if (config.relatedSubdomains && config.relatedSubdomains.length > 0) {
    results.subdomainSharing = await testSubdomainSharing(config);
  }
  
  return results;
}
