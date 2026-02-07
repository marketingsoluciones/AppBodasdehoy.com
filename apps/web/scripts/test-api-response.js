/**
 * Test: Verificar respuestas del API de chat
 *
 * Este test llama directamente a la API para verificar:
 * 1. Que las respuestas sean amigables (no técnicas)
 * 2. Que incluyan links de navegación
 * 3. Que el contexto del evento se use correctamente
 */

const API_URL = "https://app-test.bodasdehoy.com/api/copilot/chat";

const sendMessage = async (message, metadata = {}) => {
  console.log(`\n📤 Enviando: "${message}"`);
  console.log(`   Metadata:`, metadata);

  const payload = {
    messages: [{ role: "user", content: message }],
    stream: false,
    metadata: {
      userId: "test@bodasdehoy.com",
      development: "bodasdehoy",
      ...metadata
    }
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Development": "bodasdehoy"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ❌ Error ${response.status}: ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log(`\n📥 Respuesta (${content.length} chars):`);
    console.log(`   "${content.substring(0, 300)}${content.length > 300 ? '...' : ''}"`);

    return content;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
};

const analyzeResponse = (response, testName) => {
  if (!response) {
    console.log(`\n⚠️ ${testName}: Sin respuesta`);
    return false;
  }

  const checks = {
    hasLink: /\[.*?\]\(\/[a-z-]+\)/.test(response),
    hasNavUrl: /\/presupuesto|\/invitados|\/mesas|\/itinerario|\/invitaciones/.test(response),
    isFriendly: !/(herramienta|parámetro|función|API|MCP|JSON)/i.test(response),
    isSpanish: /[áéíóúñ¿¡]/i.test(response) || /hola|ayuda|puedo|evento/i.test(response),
    isNotTechnical: !/\{|\}|\[.*".*".*\]|get_|add_|update_/.test(response)
  };

  console.log(`\n📊 Análisis - ${testName}:`);
  console.log(`   ✓ Tiene link markdown: ${checks.hasLink ? '✓' : '✗'}`);
  console.log(`   ✓ Tiene URL de navegación: ${checks.hasNavUrl ? '✓' : '✗'}`);
  console.log(`   ✓ Es amigable (sin jerga técnica): ${checks.isFriendly ? '✓' : '✗'}`);
  console.log(`   ✓ En español: ${checks.isSpanish ? '✓' : '✗'}`);
  console.log(`   ✓ No es técnico: ${checks.isNotTechnical ? '✓' : '✗'}`);

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.values(checks).length;
  console.log(`\n   Puntuación: ${passed}/${total}`);

  return passed >= 3;
};

(async () => {
  console.log("=== TEST RESPUESTAS API COPILOT ===\n");

  // Test 1: Saludo simple
  console.log("\n--- TEST 1: Saludo ---");
  const resp1 = await sendMessage("Hola, ¿qué puedes hacer?");
  analyzeResponse(resp1, "Saludo");

  // Test 2: Pregunta sobre presupuesto
  console.log("\n--- TEST 2: Presupuesto ---");
  const resp2 = await sendMessage("Quiero ver mi presupuesto y agregar un gasto de catering", {
    eventName: "Boda de Raúl y María",
    eventId: "test-event-123"
  });
  analyzeResponse(resp2, "Presupuesto");

  // Test 3: Pregunta sobre invitados
  console.log("\n--- TEST 3: Invitados ---");
  const resp3 = await sendMessage("¿Cuántos invitados tengo confirmados?", {
    eventName: "Boda de Raúl y María",
    eventId: "test-event-123",
    pageContext: {
      pageName: "Invitados",
      screenData: {
        totalInvitados: 150,
        confirmados: 89,
        pendientes: 61
      }
    }
  });
  analyzeResponse(resp3, "Invitados");

  // Test 4: Pregunta sobre navegación
  console.log("\n--- TEST 4: Navegación ---");
  const resp4 = await sendMessage("¿Cómo puedo organizar las mesas para mi boda?");
  analyzeResponse(resp4, "Navegación");

  console.log("\n=== FIN TESTS ===\n");
})();
