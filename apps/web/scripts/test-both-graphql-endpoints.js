#!/usr/bin/env node

/**
 * Script para probar ambos endpoints GraphQL y determinar cuál está fallando
 */

const axios = require('axios');
const fs = require('fs');

const GUEST_USER_ID = 'IWOuWvPD110InSCk1XymPBKNsA-D';
const DEVELOPMENT = 'bodasdehoy';

// Query que se está usando actualmente
const QUERY_EVENTOS = `query ($variable: String, $valor: String, $development: String!) {
  queryenEvento( variable:$variable, valor:$valor, development:$development){
    _id
    development
    nombre
    tipo
    usuario_id
    usuario_nombre
    fecha
    poblacion
    pais
  }
}`;

async function testEndpoint(name, url, query, variables) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`PROBANDO: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(80));

  try {
    const requestData = { query, variables };
    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Development': DEVELOPMENT
    };

    console.log('\n📤 Request:');
    console.log(JSON.stringify(requestData, null, 2));

    const response = await axios.post(url, requestData, {
      headers: requestHeaders,
      validateStatus: () => true // No lanzar error en status codes
    });

    console.log(`\n📥 Response: ${response.status} ${response.statusText}`);
    console.log(JSON.stringify(response.data, null, 2));

    return {
      name,
      url,
      status: response.status,
      statusText: response.statusText,
      request: requestData,
      response: response.data,
      success: response.status === 200 && !response.data.errors
    };

  } catch (error) {
    console.log(`\n❌ Error:`, error.message);
    return {
      name,
      url,
      error: error.message,
      success: false
    };
  }
}

(async () => {
  console.log('\n' + '='.repeat(80));
  console.log('DIAGNÓSTICO DE ENDPOINTS GRAPHQL');
  console.log('='.repeat(80));
  console.log(`\nUsuario ID (guest): ${GUEST_USER_ID}`);
  console.log(`Development: ${DEVELOPMENT}`);

  const variables = {
    variable: 'usuario_id',
    valor: GUEST_USER_ID,
    development: DEVELOPMENT
  };

  // Probar ambos endpoints
  const results = [];

  results.push(await testEndpoint(
    'ApiApp (Eventos)',
    'http://localhost:8080/api/proxy/graphql',
    QUERY_EVENTOS,
    variables
  ));

  results.push(await testEndpoint(
    'ApiBodas (Bodas)',
    'http://localhost:8080/api/proxy-bodas/graphql',
    QUERY_EVENTOS,
    variables
  ));

  // Generar reporte
  console.log('\n' + '='.repeat(80));
  console.log('RESUMEN');
  console.log('='.repeat(80));

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`\n${status} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    if (result.status) {
      console.log(`   Status: ${result.status} ${result.statusText}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.response?.errors) {
      console.log(`   GraphQL Error: ${result.response.errors[0]?.message}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('CONCLUSIÓN');
  console.log('='.repeat(80));

  const report = {
    timestamp: new Date().toISOString(),
    issue: 'EventsGroupContext está usando fetchApiEventos (ApiApp) con una query de ApiBodas',
    evidence: {
      file: 'apps/web/context/EventsGroupContext.tsx',
      line: '118-121',
      code: `fetchApiEventos({
  query: queries.getEventsByID,
  variables: { variable: "usuario_id", valor: userIdToUse, development: config?.development },
})`,
      problem: 'fetchApiEventos usa api.ApiApp que apunta a /api/proxy/graphql, pero la query queryenEvento solo existe en /api/proxy-bodas/graphql'
    },
    endpoints_tested: results,
    recommendation: null
  };

  // Determinar recomendación
  const apiAppSuccess = results.find(r => r.name === 'ApiApp (Eventos)')?.success;
  const apiBodasSuccess = results.find(r => r.name === 'ApiBodas (Bodas)')?.success;

  if (!apiAppSuccess && !apiBodasSuccess) {
    report.recommendation = 'Ninguno de los endpoints funciona. La query puede estar obsoleta o el usuario guest no tiene acceso.';
    console.log('\n❌ Ninguno de los endpoints funciona con esta query.');
  } else if (apiBodasSuccess && !apiAppSuccess) {
    report.recommendation = 'Cambiar fetchApiEventos por fetchApiBodas en EventsGroupContext.tsx línea 118';
    console.log('\n✅ SOLUCIÓN ENCONTRADA:');
    console.log('   Cambiar en EventsGroupContext.tsx línea 118:');
    console.log('   DE: fetchApiEventos({');
    console.log('   A:  fetchApiBodas({');
  } else if (apiAppSuccess) {
    report.recommendation = 'ApiApp funciona correctamente. No se necesita cambio.';
    console.log('\n✅ ApiApp funciona correctamente.');
  }

  // Guardar reporte
  const reportPath = '/tmp/graphql-endpoints-diagnosis.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);

  console.log('\n' + '='.repeat(80) + '\n');
})();
