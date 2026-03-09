/**
 * Test: Verificar API directamente sin browser
 */

(async () => {
  console.log("=== TEST API COPILOT DIRECTA ===\n");

  const API_URL = "https://app-test.bodasdehoy.com/api/copilot/chat";

  const payload = {
    messages: [
      {
        role: "user",
        content: "Hola, soy un usuario invitado. Funciona el chat?"
      }
    ],
    stream: false,
    metadata: {
      userId: "guest_test_123",
      development: "bodasdehoy"
    }
  };

  console.log("Llamando a:", API_URL);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Development": "bodasdehoy"
      },
      body: JSON.stringify(payload)
    });

    console.log("\n=== RESPUESTA ===");
    console.log("Status:", response.status);
    console.log("Headers:");
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('x-') || key.toLowerCase() === 'content-type') {
        console.log(`  ${key}: ${value}`);
      }
    });

    const text = await response.text();
    console.log("\nBody raw:", text.substring(0, 500));

    try {
      const json = JSON.parse(text);
      console.log("\nBody parsed:");
      console.log(JSON.stringify(json, null, 2));

      if (json.choices && json.choices[0]) {
        console.log("\n✅ RESPUESTA DEL MODELO:");
        console.log(json.choices[0].message?.content || json.choices[0].delta?.content || "(vacío)");
      } else if (json.error) {
        console.log("\n❌ ERROR:");
        console.log(json.error, json.message);
      }
    } catch (e) {
      console.log("\n(No es JSON válido)");
    }

  } catch (error) {
    console.log("\n❌ Error de fetch:", error.message);
  }

  console.log("\n=== FIN TEST ===");
})();
