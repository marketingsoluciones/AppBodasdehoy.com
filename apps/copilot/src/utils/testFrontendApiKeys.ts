/**
 * Script de prueba para verificar el flujo completo de API keys desde el frontend
 * Ejecutar en consola del navegador después de cargar la página
 */

export async function testFrontendApiKeyFlow() {
  console.log('🧪 Iniciando test completo de flujo de API keys...');

  // 1. Verificar variables de entorno
  console.log('\n1️⃣ Verificando variables de entorno:');
  const { getPythonBackendConfig } = await import('@/utils/checkPythonBackendConfig');
  const { USE_PYTHON_BACKEND, PYTHON_BACKEND_URL } = getPythonBackendConfig();

  console.log('   USE_PYTHON_BACKEND:', USE_PYTHON_BACKEND);
  console.log('   PYTHON_BACKEND_URL:', PYTHON_BACKEND_URL);

  // También mostrar variables raw para debugging
  console.log('   NEXT_PUBLIC_USE_PYTHON_BACKEND:', process.env.NEXT_PUBLIC_USE_PYTHON_BACKEND);
  console.log('   NEXT_PUBLIC_PYTHON_BACKEND_URL:', process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL);
  console.log('   NEXT_PUBLIC_BACKEND_URL:', process.env.NEXT_PUBLIC_BACKEND_URL);

  // 2. Verificar desarrollo y keyVaults
  console.log('\n2️⃣ Verificando store:');
  const { useChatStore } = await import('@/store/chat');
  const { useUserStore } = await import('@/store/user');

  const chatStore = useChatStore.getState();
  const userStore = useUserStore.getState();

  console.log('   Development:', chatStore.development);
  console.log('   Current User ID:', chatStore.currentUserId);
  console.log('   KeyVaults:', Object.keys(userStore.keyVaults || {}));
  console.log('   KeyVaults detalle:', userStore.keyVaults);

  // 3. Probar createPayloadWithKeyVaults
  console.log('\n3️⃣ Probando createPayloadWithKeyVaults:');
  const { createPayloadWithKeyVaults } = await import('@/services/_auth');

  const testProviders = ['openai', 'anthropic', 'ollama'];
  for (const provider of testProviders) {
    const payload = createPayloadWithKeyVaults(provider);
    console.log(`   ${provider}:`, {
      hasApiKey: !!payload.apiKey,
      keys: Object.keys(payload),
      runtimeProvider: payload.runtimeProvider,
    });
  }

  // 4. Verificar sincronización
  console.log('\n4️⃣ Verificando sincronización:');
  try {
    await chatStore.syncWhitelabelApiKeys();
    const userStoreAfter = useUserStore.getState();
    console.log('   KeyVaults después de sincronizar:', Object.keys(userStoreAfter.keyVaults || {}));
  } catch (error: any) {
    console.error('   ❌ Error sincronizando:', error.message);
  }

  // 5. Probar proxy al backend Python
  console.log('\n5️⃣ Probando proxy al backend Python:');
  try {
    const testPayload = {
      messages: [{ content: 'test', role: 'user' }],
      model: 'gpt-3.5-turbo',
      stream: false,
    };

    const response = await fetch('/webapi/chat/openai', {
      body: JSON.stringify(testPayload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    console.log('   Status:', response.status);
    console.log('   Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const text = await response.text();
      console.log('   ✅ Proxy funcionó, respuesta:', text.slice(0, 200));
    } else {
      const errorText = await response.text();
      console.error('   ❌ Proxy falló:', errorText.slice(0, 200));
    }
  } catch (error: any) {
    console.error('   ❌ Error probando proxy:', error.message);
  }

  // 6. Verificar configuración del whitelabel
  console.log('\n6️⃣ Verificando configuración del whitelabel:');
  try {
    const development = chatStore.development || 'bodasdehoy';
    const backendUrl = PYTHON_BACKEND_URL || 'http://localhost:8030';

    const configResponse = await fetch(`${backendUrl}/api/developers/${development}/config`);
    if (configResponse.ok) {
      const config = await configResponse.json();
      const devConfig = config.config || {};

      console.log('   Provider:', devConfig.ai_provider || devConfig.aiProvider);
      console.log('   Model:', devConfig.ai_model || devConfig.aiModel);
      console.log('   API Key:', devConfig.ai_api_key || devConfig.aiApiKey ? '✅ Configurada' : '❌ No configurada');
    } else {
      console.error('   ❌ Error obteniendo config:', configResponse.status);
    }
  } catch (error: any) {
    console.error('   ❌ Error:', error.message);
  }

  console.log('\n✅ Test completado');
  console.log('\n📋 Resumen:');
  console.log('   - Si USE_PYTHON_BACKEND=true, NO debería requerir API keys en el frontend');
  console.log('   - El proxy debería funcionar y enviar al backend Python');
  console.log('   - El backend Python manejará las credenciales desde API2');
}

// Ejecutar en consola del navegador:
// import { testFrontendApiKeyFlow } from '@/utils/testFrontendApiKeys'; testFrontendApiKeyFlow();
















































