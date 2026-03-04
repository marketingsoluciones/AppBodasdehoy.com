#!/usr/bin/env node

/**
 * Script para capturar el error 500 de GraphQL con pruebas concretas
 * para enviar al proveedor del backend
 */

const axios = require('axios');
const fs = require('fs');

// Configuración
const BACKEND_URL = 'http://localhost:8080/api/proxy-bodas/graphql';
const GUEST_USER_ID = 'IWOuWvPD110InSCk1XymPBKNsA-D'; // ID del usuario guest
const DEVELOPMENT = 'bodasdehoy';

// Query exacta que está fallando (de Fetching.ts línea 1833)
const QUERY = `query ($variable: String, $valor: String, $development: String!) {
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

async function captureGraphQLError() {
  console.log('='.repeat(80));
  console.log('CAPTURA DE ERROR GRAPHQL 500 - PRUEBA PARA BACKEND PROVIDER');
  console.log('='.repeat(80));
  console.log();

  const timestamp = new Date().toISOString();

  // Preparar request
  const requestData = {
    query: QUERY,
    variables: {
      variable: 'usuario_id',
      valor: GUEST_USER_ID,
      development: DEVELOPMENT
    }
  };

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  console.log('📋 INFORMACIÓN DE LA SOLICITUD');
  console.log('-'.repeat(80));
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Endpoint: ${BACKEND_URL}`);
  console.log(`Method: POST`);
  console.log();

  console.log('Headers:');
  console.log(JSON.stringify(requestHeaders, null, 2));
  console.log();

  console.log('Request Body:');
  console.log(JSON.stringify(requestData, null, 2));
  console.log();
  console.log('-'.repeat(80));
  console.log();

  try {
    console.log('⏳ Enviando solicitud...');

    const response = await axios.post(BACKEND_URL, requestData, {
      headers: requestHeaders,
      validateStatus: () => true // No lanzar error en status codes
    });

    console.log('📥 RESPUESTA RECIBIDA');
    console.log('-'.repeat(80));
    console.log(`Status Code: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    console.log();

    console.log('Response Headers:');
    console.log(JSON.stringify(response.headers, null, 2));
    console.log();

    console.log('Response Body:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('-'.repeat(80));
    console.log();

    // Generar reporte
    const report = {
      timestamp,
      error_summary: {
        issue: 'GraphQL endpoint returns HTTP 500 when querying events with guest user ID',
        impact: 'Application cannot load events, preventing Copilot from accessing user data',
        reproduced_by: 'Automated test script',
        environment: 'localhost:8080 (development)'
      },
      request: {
        url: BACKEND_URL,
        method: 'POST',
        headers: requestHeaders,
        body: requestData
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        body: response.data
      },
      context: {
        file_triggering_error: 'apps/web/context/EventsGroupContext.tsx',
        line_number: '116-122',
        function: 'fetchApiEventos',
        query_name: 'queries.getEventsByID',
        variables_used: {
          variable: 'usuario_id',
          valor: GUEST_USER_ID,
          development: DEVELOPMENT
        }
      },
      console_logs_evidence: [
        '[EventsGroup] Buscando eventos para usuario_id: ' + GUEST_USER_ID,
        '=======> User {uid: ' + GUEST_USER_ID + ', displayName: guest}',
        'Failed to load resource: the server responded with a status of 500 (Internal Server Error)',
        '[App] ✅ http://localhost:8080/api/proxy-bodas/graphql - Status: 500'
      ]
    };

    // Guardar reporte
    const reportPath = '/tmp/graphql-500-error-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('✅ REPORTE GENERADO');
    console.log(`📄 Reporte guardado en: ${reportPath}`);
    console.log();

    // Generar versión para markdown
    const markdownReport = `# GraphQL 500 Error Report

## Error Summary
- **Issue**: GraphQL endpoint returns HTTP 500 when querying events with guest user ID
- **Impact**: Application cannot load events, preventing Copilot from accessing user data
- **Reproduced by**: Automated test script
- **Environment**: localhost:8080 (development)
- **Timestamp**: ${timestamp}

## Request Details

### Endpoint
\`\`\`
POST ${BACKEND_URL}
\`\`\`

### Headers
\`\`\`json
${JSON.stringify(requestHeaders, null, 2)}
\`\`\`

### Body
\`\`\`json
${JSON.stringify(requestData, null, 2)}
\`\`\`

## Response Details

### Status
\`\`\`
HTTP ${response.status} ${response.statusText}
\`\`\`

### Response Body
\`\`\`json
${JSON.stringify(response.data, null, 2)}
\`\`\`

## Code Context

**File**: \`apps/web/context/EventsGroupContext.tsx\` (lines 116-122)

\`\`\`typescript
console.log("[EventsGroup] Buscando eventos para usuario_id:", userIdToUse)

fetchApiEventos({
  query: queries.getEventsByID,
  variables: { variable: "usuario_id", valor: userIdToUse, development: config?.development },
})
\`\`\`

## Console Log Evidence

\`\`\`
${report.console_logs_evidence.join('\n')}
\`\`\`

## Expected Behavior
The GraphQL endpoint should either:
1. Return empty results for guest users, OR
2. Return a proper error message (4xx status code with GraphQL error format), OR
3. Not be called at all when user is guest

## Actual Behavior
Backend returns HTTP 500 (Internal Server Error) when queried with guest user ID.
`;

    const markdownPath = '/tmp/graphql-500-error-report.md';
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`📄 Reporte Markdown guardado en: ${markdownPath}`);
    console.log();

    if (response.status === 500) {
      console.log('❌ ERROR 500 CONFIRMADO - Backend está retornando error 500');
      console.log('🔍 Este es el error que debe ser enviado al proveedor del backend');
    } else {
      console.log(`ℹ️ Status Code recibido: ${response.status}`);
    }

    console.log();
    console.log('='.repeat(80));
    console.log('SIGUIENTE PASO: Envía estos archivos al proveedor del backend:');
    console.log('  1. ' + reportPath);
    console.log('  2. ' + markdownPath);
    console.log('='.repeat(80));

  } catch (error) {
    console.error();
    console.error('❌ ERROR AL REALIZAR LA SOLICITUD');
    console.error('-'.repeat(80));
    console.error('Error Type:', error.name);
    console.error('Error Message:', error.message);

    if (error.response) {
      console.error();
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }

    if (error.code) {
      console.error('Error Code:', error.code);
    }

    console.error('-'.repeat(80));

    // Guardar error también
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : null
      },
      request: {
        url: BACKEND_URL,
        method: 'POST',
        headers: requestHeaders,
        body: requestData
      }
    };

    const errorPath = '/tmp/graphql-request-error.json';
    fs.writeFileSync(errorPath, JSON.stringify(errorReport, null, 2));
    console.error();
    console.error('📄 Error report guardado en:', errorPath);
  }
}

// Ejecutar
captureGraphQLError().catch(console.error);
