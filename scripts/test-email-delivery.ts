#!/usr/bin/env tsx
/**
 * Script para probar el envío de emails y verificar si llegan
 * 
 * Uso:
 *   tsx scripts/test-email-delivery.ts --email=test@example.com --evento=EVENTO_ID
 * 
 * Requisitos:
 *   - Tener el servidor de desarrollo corriendo (localhost:3220)
 *   - Tener un evento con template de email configurado
 */

import { fetchApiEventos, queries } from '../apps/appEventos/utils/Fetching';

interface TestEmailOptions {
  email: string;
  eventoId: string;
  phoneNumber?: string;
  lang?: string;
  development?: string;
}

async function testEmailDelivery(options: TestEmailOptions) {
  const {
    email,
    eventoId,
    phoneNumber,
    lang = 'es',
    development = 'bodasdehoy'
  } = options;

  console.log('🚀 Probando envío de email...');
  console.log(`📧 Email destino: ${email}`);
  console.log(`🎉 Evento ID: ${eventoId}`);
  console.log(`🌐 Development: ${development}`);
  console.log(`🌍 Idioma: ${lang}`);

  try {
    // Usar la mutación testInvitacion
    const result = await fetchApiEventos({
      query: queries.testInvitacion,
      variables: {
        evento_id: eventoId,
        email: email,
        phoneNumber: phoneNumber,
        lang: lang
      },
      development: development
    });

    console.log('✅ Email de prueba enviado exitosamente');
    console.log('📤 Respuesta del servidor:', JSON.stringify(result, null, 2));

    // Verificar si hay información de tracking
    if (result?.data?.testInvitacion) {
      console.log('📊 ID de envío:', result.data.testInvitacion);
    }

    // Instrucciones para verificar manualmente
    console.log('\n🔍 Para verificar si el email llegó:');
    console.log('1. Revisa la bandeja de entrada de', email);
    console.log('2. Busca en la carpeta de spam si no aparece en la bandeja principal');
    console.log('3. Si usas Mailinblue/Brevo, revisa el panel de estadísticas');
    console.log('4. Verifica los logs del servidor de email');

    return result;
  } catch (error) {
    console.error('❌ Error al enviar email de prueba:', error);
    throw error;
  }
}

async function checkEmailStatus(email: string, eventoId: string) {
  console.log('\n🔍 Verificando estado del email...');
  console.log('⚠️  Nota: Esta funcionalidad requiere integración con webhooks de Mailinblue/Brevo');
  console.log('📋 Para verificar manualmente:');
  console.log('   1. Accede al panel de Mailinblue/Brevo');
  console.log('   2. Busca la campaña o envío correspondiente');
  console.log('   3. Revisa las estadísticas de entrega y apertura');
  console.log('   4. Verifica los logs de webhooks si están configurados');
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const options: Partial<TestEmailOptions> = {};

  // Parsear argumentos
  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      options.email = arg.split('=')[1];
    } else if (arg.startsWith('--evento=')) {
      options.eventoId = arg.split('=')[1];
    } else if (arg.startsWith('--phone=')) {
      options.phoneNumber = arg.split('=')[1];
    } else if (arg.startsWith('--lang=')) {
      options.lang = arg.split('=')[1];
    } else if (arg.startsWith('--dev=')) {
      options.development = arg.split('=')[1];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Uso: tsx scripts/test-email-delivery.ts [opciones]

Opciones:
  --email=EMAIL      Email destino para la prueba (requerido)
  --evento=ID        ID del evento (requerido)
  --phone=NUMERO     Número de teléfono para WhatsApp (opcional)
  --lang=IDIOMA      Idioma (es, en, etc.) - por defecto: es
  --dev=DEVELOPMENT  Development/whitelabel - por defecto: bodasdehoy
  --help, -h         Muestra esta ayuda

Ejemplos:
  tsx scripts/test-email-delivery.ts --email=test@example.com --evento=1234567890
  tsx scripts/test-email-delivery.ts --email=jcc@bodasdehoy.com --evento=EVENTO_ID --dev=eventosorganizador
      `);
      return;
    }
  }

  // Validar argumentos requeridos
  if (!options.email || !options.eventoId) {
    console.error('❌ Error: Se requieren --email y --evento');
    console.log('   Usa --help para ver las opciones disponibles');
    process.exit(1);
  }

  try {
    // Enviar email de prueba
    await testEmailDelivery(options as TestEmailOptions);
    
    // Ofrecer verificación de estado
    console.log('\n¿Quieres verificar el estado del email? (s/n)');
    // Nota: En un script real necesitaríamos leer de stdin
    // Por ahora solo mostramos las instrucciones
    await checkEmailStatus(options.email, options.eventoId);
    
  } catch (error) {
    console.error('❌ Error en la ejecución:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}

export { testEmailDelivery, checkEmailStatus };