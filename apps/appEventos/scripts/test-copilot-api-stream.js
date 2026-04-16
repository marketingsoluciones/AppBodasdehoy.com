/**
 * Test: Verificar API con streaming
 */

(async () => {
  console.log("=== TEST API COPILOT CON STREAMING ===\n");

  const API_URL = "https://app-test.bodasdehoy.com/api/copilot/chat";

  const payload = {
    messages: [
      {
        role: "user",
        content: "Hola, soy un usuario invitado. Funciona el chat?"
      }
    ],
    stream: true,
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
    console.log("Content-Type:", response.headers.get("content-type"));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let chunkCount = 0;

    console.log("\n=== CHUNKS ===");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunkCount++;

      // Parse SSE
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            console.log("  [DONE]");
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              process.stdout.write(content);
            }
          } catch (e) {
            console.log("  Parse error:", data.substring(0, 50));
          }
        }
      }
    }

    console.log("\n\n=== RESUMEN ===");
    console.log("Chunks recibidos:", chunkCount);
    console.log("Contenido total length:", fullContent.length);
    console.log("Contenido:", fullContent.substring(0, 200));

    if (fullContent.length > 0) {
      console.log("\n✅ STREAMING FUNCIONA");
    } else {
      console.log("\n❌ STREAMING RETORNÓ VACÍO");
    }

  } catch (error) {
    console.log("\n❌ Error:", error.message);
  }

  console.log("\n=== FIN TEST ===");
})();
