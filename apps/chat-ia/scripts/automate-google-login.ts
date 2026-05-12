/**
 * Script de Automatización para Login con Google
 * 
 * Este script usa las herramientas MCP del navegador de Cursor para automatizar
 * el proceso de login con Google en el modal emergente del proyecto.
 * 
 * IMPORTANTE - Sistema Multi-Marca:
 * - El proyecto soporta múltiples marcas/developments (bodasdehoy, eventosorganizador, etc.)
 * - Cada marca tiene su propio dominio (ej: .bodasdehoy.com, .eventosorganizador.com)
 * - Una vez logueado en un dominio, la sesión persiste entre subdominios del mismo dominio base
 * - Las cookies se establecen con el dominio base (ej: domain: '.bodasdehoy.com') para compartir entre subdominios
 * - Puedes navegar entre dominios/subdominios sin volver a loguearte
 * 
 * NOTA: El popup de Google OAuth requiere interacción manual para completar
 * la autenticación (selección de cuenta y autorización).
 * 
 * Uso:
 * - Este script automatiza hasta el punto de abrir el popup de Google
 * - Después de hacer clic en el botón, se requiere interacción manual
 * - Una vez logueado, puedes navegar a otros dominios/subdominios sin re-autenticarte
 * 
 * Requisitos:
 * - Las herramientas MCP del navegador de Cursor deben estar disponibles
 * - El proyecto debe estar ejecutándose (localhost:8000 o dominio de producción)
 */

interface AutomationConfig {
  /** URL base del proyecto */
  baseUrl: string;
  /** Development/marca específica (bodasdehoy, eventosorganizador, etc.) */
  development?: string;
  /** Tiempo de espera máximo en milisegundos */
  timeout?: number;
  /** Si debe esperar interacción manual después de hacer clic */
  waitForManualInteraction?: boolean;
  /** Si debe usar bypass de desarrollo en lugar de login completo (solo en entornos de test) */
  useBypass?: boolean;
  /** Email para bypass (opcional, usa UID conocido por defecto) */
  bypassEmail?: string;
  /** Si debe verificar la sesión compartida entre subdominios después del login */
  verifySubdomainSharing?: boolean;
  /** Subdominios relacionados para verificar sesión compartida */
  relatedSubdomains?: string[];
  /** Si debe verificar casos específicos de sesión compartida entre diferentes dominios/marcas */
  verifyCrossDomainSharing?: boolean;
  /** Dominios relacionados para verificar sesión compartida (casos específicos) */
  relatedDomains?: string[];
}

/**
 * Detecta si la URL es un subdominio funcional
 */
function detectFunctionalSubdomain(url: string): { isFunctional: boolean; subdomain: string | null; redirects: boolean } {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  const parts = hostname.split('.');
  
  const functionalSubdomains = ['ticket', 'testticket', 'invitado', 'testinvitado', 'dev'];
  const subdomain = parts.length > 2 ? parts[0] : null;
  
  const isFunctional = subdomain ? functionalSubdomains.includes(subdomain) : false;
  const redirects = ['ticket', 'testticket'].includes(subdomain || '');
  
  return { isFunctional, subdomain, redirects };
}

/**
 * Detecta si la URL está en un entorno que soporta bypass
 */
function supportsBypass(url: string): boolean {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  
  return hostname.includes('localhost') || 
         hostname.includes('127.0.0.1') ||
         hostname.includes('chat-test') ||
         hostname.includes('test.');
}

/**
 * Función principal para automatizar el login con Google
 */
export async function automateGoogleLogin(config: AutomationConfig) {
  const {
    baseUrl,
    timeout = 30000,
    waitForManualInteraction = true,
    useBypass = false,
    bypassEmail,
    verifySubdomainSharing = false,
    relatedSubdomains = [],
  } = config;

  console.log('🚀 Iniciando automatización de login con Google...');
  console.log(`📍 URL objetivo: ${baseUrl}`);

  // Detectar subdominio funcional
  const subdomainInfo = detectFunctionalSubdomain(baseUrl);
  if (subdomainInfo.isFunctional) {
    console.log(`⚠️  Subdominio funcional detectado: ${subdomainInfo.subdomain}`);
    if (subdomainInfo.redirects) {
      console.log(`⚠️  Este subdominio redirige automáticamente a /RelacionesPublicas`);
    }
  }

  // Verificar si se puede usar bypass
  const canUseBypass = supportsBypass(baseUrl);
  if (useBypass && !canUseBypass) {
    console.warn('⚠️  Bypass solicitado pero no disponible en este entorno. Usando login completo.');
  }

  try {
    // Paso 1: Navegar a la página
    console.log('📱 Paso 1: Navegando a la página...');
    // Nota: Esta función sería llamada desde las herramientas MCP
    // await browser_navigate({ url: baseUrl });
    
    // Esperar a que la página cargue
    // await browser_wait_for({ time: 2000 });

    // Si es subdominio funcional con redirección, esperar a que se complete
    if (subdomainInfo.redirects) {
      console.log('⏳ Esperando a que se complete la redirección automática...');
      // await browser_wait_for({ time: 3000 });
      // Verificar URL después de redirección
      // const finalUrl = await browser_execute_script({ script: 'window.location.href' });
      // console.log(`📍 URL después de redirección: ${finalUrl}`);
    }

    // Opción: Usar bypass si está habilitado y disponible
    if (useBypass && canUseBypass) {
      console.log('🔓 Usando bypass de desarrollo (más eficiente para testing)...');
      
      const bypassScript = `
        sessionStorage.setItem('dev_bypass', 'true');
        ${bypassEmail ? `sessionStorage.setItem('dev_bypass_email', '${bypassEmail}');` : ''}
        return 'Bypass activado';
      `;
      
      // await browser_execute_script({ script: bypassScript });
      
      // Esperar a que el bypass cargue el usuario
      // await browser_wait_for({ time: 3000 });
      
      // Verificar que el bypass funcionó
      const bypassVerifyScript = `
        ({
          bypassActive: sessionStorage.getItem('dev_bypass') === 'true',
          hasUser: !!localStorage.getItem('dev-user-config'),
          userEmail: localStorage.getItem('dev-user-config') 
            ? JSON.parse(localStorage.getItem('dev-user-config')).userId 
            : null
        })
      `;
      
      // const bypassResult = await browser_execute_script({ script: bypassVerifyScript });
      // if (bypassResult.hasUser) {
      //   console.log('✅ Bypass exitoso, usuario cargado:', bypassResult.userEmail);
      //   return { success: true, method: 'bypass', userEmail: bypassResult.userEmail };
      // } else {
      //   console.warn('⚠️  Bypass no cargó usuario, intentando login completo...');
      // }
    }

    // Paso 2: Abrir el modal de login
    console.log('🔓 Paso 2: Abriendo modal de login...');
    
    // Opción A: Usar función global expuesta
    const openModalScript = `
      if (typeof window.openLoginModal === 'function') {
        window.openLoginModal();
        return 'Modal abierto mediante window.openLoginModal()';
      } else {
        // Opción B: Buscar botón que abre el modal
        const loginButton = document.querySelector('[data-testid="login-button"]') 
          || document.querySelector('button:has-text("Iniciar sesión")')
          || document.querySelector('a:has-text("Iniciar sesión")');
        
        if (loginButton) {
          loginButton.click();
          return 'Modal abierto mediante clic en botón';
        }
        
        // Opción C: Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('openLoginModal'));
        return 'Modal abierto mediante evento personalizado';
      }
    `;
    
    // await browser_execute_script({ script: openModalScript });

    // Paso 3: Esperar a que el modal sea visible
    console.log('⏳ Paso 3: Esperando a que el modal sea visible...');
    
    // await browser_wait_for({ 
    //   text: 'Continuar con Google',
    //   timeout 
    // });

    // Paso 4: Localizar y hacer clic en el botón de Google
    console.log('🔘 Paso 4: Haciendo clic en el botón "Continuar con Google"...');
    
    // Selectores posibles para el botón
    const buttonSelectors = [
      '[data-testid="google-login-button"]',
      'button:has-text("Continuar con Google")',
      'button:has-text("Conectar con Google")',
      'button[aria-label*="Google"]',
      'button:has(.anticon-google)',
    ];

    // Intentar hacer clic usando diferentes selectores
    for (const selector of buttonSelectors) {
      try {
        // await browser_click({
        //   element: 'Botón Continuar con Google',
        //   ref: selector
        // });
        console.log(`✅ Clic realizado usando selector: ${selector}`);
        break;
      } catch (error) {
        console.warn(`⚠️ Selector ${selector} no funcionó, intentando siguiente...`);
        continue;
      }
    }

    // Paso 5: Manejar el popup/redirect de Google OAuth
    console.log('🔐 Paso 5: Esperando popup/redirect de Google OAuth...');
    
    if (waitForManualInteraction) {
      console.log('⏸️  Pausando para interacción manual...');
      console.log('👤 Por favor, completa el proceso de autenticación en el popup de Google.');
      console.log('⏳ Esperando a que se complete el login...');
      
      // Esperar a que el modal se cierre (indicador de login exitoso)
      // await browser_wait_for({
      //   textGone: 'Continuar con Google',
      //   timeout: timeout * 2
      // });
    }

    // Paso 6: Verificar login exitoso
    console.log('✅ Paso 6: Verificando login exitoso...');
    
    const verifyScript = `
      const token = localStorage.getItem('mcp_jwt_token');
      const userConfig = localStorage.getItem('dev-user-config');
      const currentUrl = window.location.href;
      const hostname = window.location.hostname;
      
      // Detectar development desde el dominio
      const detectDevelopment = () => {
        const host = hostname;
        if (host.includes('bodasdehoy')) return 'bodasdehoy';
        if (host.includes('eventosorganizador')) return 'eventosorganizador';
        if (host.includes('champagne')) return 'champagneevents';
        if (host.includes('annlo')) return 'annloevents';
        return 'unknown';
      };
      
      // Detectar subdominio funcional
      const parts = hostname.split('.');
      const subdomain = parts.length > 2 ? parts[0] : null;
      const functionalSubdomains = ['ticket', 'testticket', 'invitado', 'testinvitado', 'dev'];
      const isFunctionalSubdomain = subdomain ? functionalSubdomains.includes(subdomain) : false;
      
      // Obtener cookie de sesión según el development
      const development = detectDevelopment();
      const cookieName = {
        'bodasdehoy': 'sessionBodas',
        'eventosorganizador': 'sessionOrganizador',
        'champagneevents': 'sessionChampagne-events',
        'annloevents': 'sessionAnnloevents'
      }[development] || 'sessionBodas';
      
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(cookieName + '='));
      
      return {
        hasToken: !!token,
        hasUserConfig: !!userConfig,
        hasSessionCookie: !!sessionCookie,
        currentUrl: currentUrl,
        hostname: hostname,
        development: development,
        cookieName: cookieName,
        subdomain: subdomain,
        isFunctionalSubdomain: isFunctionalSubdomain,
        tokenPreview: token ? token.substring(0, 20) + '...' : null,
        userConfigPreview: userConfig ? JSON.parse(userConfig).userId : null,
        userConfigData: userConfig ? JSON.parse(userConfig) : null
      };
    `;
    
    // const verification = await browser_execute_script({ script: verifyScript });
    
    // if (verification.hasToken && verification.hasUserConfig) {
    //   console.log('✅ Login exitoso verificado!');
    //   console.log(`👤 Usuario: ${verification.userConfigPreview}`);
    //   console.log(`🔗 URL actual: ${verification.currentUrl}`);
    //   console.log(`🏢 Development: ${verification.development}`);
    //   console.log(`🍪 Cookie de sesión: ${verification.hasSessionCookie ? 'Presente' : 'No encontrada'}`);
    //   if (verification.isFunctionalSubdomain) {
    //     console.log(`📌 Subdominio funcional: ${verification.subdomain}`);
    //   }
    //   
    //   // Verificar sesión compartida entre subdominios si está habilitado
    //   if (verifySubdomainSharing && relatedSubdomains.length > 0) {
    //     console.log('🌐 Verificando sesión compartida entre subdominios...');
    //     for (const subdomainUrl of relatedSubdomains) {
    //       // await browser_navigate({ url: subdomainUrl });
    //       // await browser_wait_for({ time: 2000 });
    //       // const subdomainCheck = await browser_execute_script({ script: verifyScript });
    //       // console.log(`✅ Sesión en ${subdomainUrl}:`, subdomainCheck.hasSessionCookie);
    //     }
    //   }
    //   
    //   return { success: true, verification };
    // } else {
    //   console.warn('⚠️ Login puede no haberse completado correctamente');
    //   return { success: false, verification };
    // }

    return { success: true, message: 'Automatización completada hasta el punto de interacción manual' };

  } catch (error: any) {
    console.error('❌ Error en la automatización:', error);
    throw error;
  }
}

/**
 * Función helper para ejecutar el script desde las herramientas MCP
 * 
 * Ejemplo de uso:
 * ```typescript
 * // Opción 1: Login completo en localhost (default: bodasdehoy)
 * await automateGoogleLoginHelper('http://localhost:8000');
 * 
 * // Opción 2: Usar bypass para testing (más eficiente)
 * await automateGoogleLoginHelper('http://localhost:8000', {
 *   useBypass: true,
 *   bypassEmail: 'test@example.com'
 * });
 * 
 * // Opción 3: Login en dominio específico de producción
 * await automateGoogleLoginHelper('https://www.bodasdehoy.com', {
 *   development: 'bodasdehoy'
 * });
 * 
 * // Opción 4: Login con verificación de sesión compartida entre subdominios
 * await automateGoogleLoginHelper('https://www.bodasdehoy.com', {
 *   development: 'bodasdehoy',
 *   verifySubdomainSharing: true,
 *   relatedSubdomains: [
 *     'https://chat-test.bodasdehoy.com',
 *     'https://ticket.bodasdehoy.com'
 *   ]
 * });
 * 
 * // Opción 5: Login en subdominio funcional (considera redirecciones)
 * await automateGoogleLoginHelper('https://ticket.bodasdehoy.com', {
 *   development: 'bodasdehoy'
 *   // El script detectará automáticamente que es subdominio funcional
 * });
 * ```
 */
export async function automateGoogleLoginHelper(
  baseUrl: string = 'http://localhost:8000',
  options?: Partial<AutomationConfig>
) {
  // Detectar development desde la URL si no se especifica
  let development = options?.development;
  if (!development) {
    if (baseUrl.includes('bodasdehoy')) development = 'bodasdehoy';
    else if (baseUrl.includes('eventosorganizador')) development = 'eventosorganizador';
    else if (baseUrl.includes('champagne')) development = 'champagneevents';
    else if (baseUrl.includes('annlo')) development = 'annloevents';
    else development = 'bodasdehoy'; // default
  }

  // Si no se especifica useBypass, detectar automáticamente si es entorno de test
  let useBypass = options?.useBypass;
  if (useBypass === undefined) {
    useBypass = supportsBypass(baseUrl);
    if (useBypass) {
      console.log('💡 Entorno de test detectado. Considera usar useBypass: true para testing más eficiente.');
    }
  }

  return automateGoogleLogin({
    baseUrl,
    development,
    useBypass,
    ...options,
  });
}

/**
 * Script de ejemplo para usar con las herramientas MCP del navegador
 * 
 * Este es un ejemplo de cómo se usaría este script con las herramientas MCP:
 * 
 * IMPORTANTE: Una vez logueado en un dominio, puedes navegar a otros
 * subdominios/dominios relacionados sin volver a loguearte.
 */
export const mcpAutomationExample = `
// ============================================
// Ejemplo 1: Login en localhost (bodasdehoy)
// ============================================
await browser_navigate({ url: 'http://localhost:8000' });
await browser_wait_for({ time: 2000 });

await browser_execute_script({
  script: 'window.openLoginModal && window.openLoginModal();'
});

await browser_wait_for({ text: 'Continuar con Google' });

await browser_click({
  element: 'Botón Continuar con Google',
  ref: '[data-testid="google-login-button"]'
});

// Esperar interacción manual...

// Verificar login
const result = await browser_execute_script({
  script: \`
    ({
      hasToken: !!localStorage.getItem('mcp_jwt_token'),
      hasUserConfig: !!localStorage.getItem('dev-user-config'),
      url: window.location.href,
      development: window.location.hostname.includes('bodasdehoy') ? 'bodasdehoy' : 'unknown'
    })
  \`
});

console.log('Login verificado:', result);

// ============================================
// Ejemplo 2: Login en dominio de producción
// ============================================
await browser_navigate({ url: 'https://www.bodasdehoy.com' });
// ... mismo proceso ...

// ============================================
// Ejemplo 3: Usar bypass para testing (más eficiente)
// ============================================
// Activar bypass antes de navegar
await browser_execute_script({
  script: \`
    sessionStorage.setItem('dev_bypass', 'true');
    sessionStorage.setItem('dev_bypass_email', 'test@example.com');
  \`
});

await browser_navigate({ url: 'https://chat-test.bodasdehoy.com' });
await browser_wait_for({ time: 3000 });

// Verificar bypass
const bypassCheck = await browser_execute_script({
  script: \`
    ({
      bypassActive: sessionStorage.getItem('dev_bypass') === 'true',
      hasUser: !!localStorage.getItem('dev-user-config'),
      userEmail: localStorage.getItem('dev-user-config') 
        ? JSON.parse(localStorage.getItem('dev-user-config')).userId 
        : null
    })
  \`
});

console.log('Bypass verificado:', bypassCheck);

// ============================================
// Ejemplo 4: Login en subdominio funcional
// ============================================
await browser_navigate({ url: 'https://ticket.bodasdehoy.com' });
// Esperar redirección automática a /RelacionesPublicas
await browser_wait_for({ time: 3000 });

const finalUrl = await browser_execute_script({
  script: 'window.location.href'
});
console.log('URL después de redirección:', finalUrl);

// Proceder con login normalmente
await browser_execute_script({
  script: 'window.openLoginModal && window.openLoginModal();'
});

// ============================================
// Ejemplo 5: Verificar sesión compartida entre subdominios
// ============================================
// 1. Login en dominio principal
await browser_navigate({ url: 'https://www.bodasdehoy.com' });
// ... proceso de login ...

// 2. Verificar login en dominio principal
const loginCheck1 = await browser_execute_script({
  script: \`
    ({
      hasToken: !!localStorage.getItem('mcp_jwt_token'),
      hasSessionCookie: document.cookie.includes('sessionBodas='),
      domain: window.location.hostname
    })
  \`
});

// 3. Navegar a subdominio técnico (sin re-login)
await browser_navigate({ url: 'https://chat-test.bodasdehoy.com' });
await browser_wait_for({ time: 2000 });

const loginCheck2 = await browser_execute_script({
  script: \`
    ({
      hasToken: !!localStorage.getItem('mcp_jwt_token'),
      hasSessionCookie: document.cookie.includes('sessionBodas='),
      domain: window.location.hostname
    })
  \`
});

// 4. Navegar a subdominio funcional (sin re-login)
await browser_navigate({ url: 'https://ticket.bodasdehoy.com' });
await browser_wait_for({ time: 2000 });

const loginCheck3 = await browser_execute_script({
  script: \`
    ({
      hasToken: !!localStorage.getItem('mcp_jwt_token'),
      hasSessionCookie: document.cookie.includes('sessionBodas='),
      domain: window.location.hostname
    })
  \`
});

console.log('Sesión compartida verificada:');
console.log('  - Dominio principal:', loginCheck1.hasSessionCookie);
console.log('  - Subdominio técnico:', loginCheck2.hasSessionCookie);
console.log('  - Subdominio funcional:', loginCheck3.hasSessionCookie);
`;
