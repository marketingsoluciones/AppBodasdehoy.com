/**
 * Script de prueba para verificar sincronización de API keys
 * Ejecutar en consola del navegador
 */

export async function testApiKeySync() {
  console.log('🧪 Iniciando test de sincronización de API keys...');
  
  // 1. Verificar desarrollo actual
  const { useChatStore } = await import('@/store/chat');
  const chatStore = useChatStore.getState();
  const development = chatStore.development;
  
  console.log('📋 Desarrollo actual:', development);
  
  if (!development) {
    console.error('❌ No hay development configurado');
    return;
  }
  
  // 2. Verificar keyVaults actuales
  const { useUserStore } = await import('@/store/user');
  const userStore = useUserStore.getState();
  const keyVaults = userStore.keyVaults || {};
  
  console.log('🔑 KeyVaults actuales:', Object.keys(keyVaults));
  console.log('   Detalles:', keyVaults);
  
  // 3. Intentar sincronizar
  console.log('🔄 Intentando sincronizar API keys del whitelabel...');
  
  try {
    await chatStore.syncWhitelabelApiKeys();
    
    // 4. Verificar después de sincronizar
    const userStoreAfter = useUserStore.getState();
    const keyVaultsAfter = userStoreAfter.keyVaults || {};
    
    console.log('✅ Después de sincronizar:');
    console.log('   KeyVaults:', Object.keys(keyVaultsAfter));
    console.log('   Detalles:', keyVaultsAfter);
    
    // 5. Verificar configuración del whitelabel
    console.log('🔍 Verificando configuración del whitelabel...');
    
    try {
      const backendResponse = await fetch(
        `http://localhost:8030/api/developers/${development}/config`,
      );
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        const devConfig = backendData.config || {};
        
        console.log('📊 Configuración del backend:');
        console.log('   Provider:', devConfig.ai_provider || devConfig.aiProvider);
        console.log('   Model:', devConfig.ai_model || devConfig.aiModel);
        console.log('   API Key:', devConfig.ai_api_key || devConfig.aiApiKey ? '✅ Configurada' : '❌ No configurada');
      } else {
        console.error('❌ Error obteniendo configuración:', backendResponse.status);
      }
    } catch (error: any) {
      console.error('❌ Error obteniendo configuración:', error.message);
    }
    
    // 6. Verificar GraphQL
    console.log('🔍 Verificando GraphQL...');
    
    try {
      const { apolloClient } = await import('@/libs/graphql/client');
      const { GET_WHITELABEL_CONFIG } = await import('@/libs/graphql/queries');
      const { getSupportKey } = await import('@/const/supportKeys');
      const supportKey = getSupportKey(development);
      
      const { data } = await apolloClient.query({
        errorPolicy: 'ignore',
        fetchPolicy: 'network-only',
        query: GET_WHITELABEL_CONFIG,
        variables: { development, supportKey },
      });
      
      const whitelabelConfig = data?.getWhiteLabelConfig;
      
      console.log('📊 Configuración desde GraphQL:');
      console.log('   Provider:', whitelabelConfig?.aiProvider);
      console.log('   Model:', whitelabelConfig?.aiModel);
      console.log('   API Key:', whitelabelConfig?.aiApiKey ? '✅ Configurada' : '❌ No configurada');
    } catch (error: any) {
      console.warn('⚠️ Error obteniendo desde GraphQL:', error.message);
    }
    
  } catch (error: any) {
    console.error('❌ Error sincronizando API keys:', error);
  }
  
  console.log('✅ Test completado');
}

// Ejecutar en consola del navegador:
// import { testApiKeySync } from '@/utils/testApiKeySync'; testApiKeySync();
















































