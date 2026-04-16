/**
 * Test: Llamar al backend Python directamente
 */

(async () => {
  console.log("=== TEST PYTHON BACKEND DIRECTAMENTE ===\n");

  const PYTHON_BACKEND = "https://api-ia.bodasdehoy.com";
  const ENDPOINT = "/webapi/chat/auto";

  const systemPrompt = `Eres el Copilot de Bodas de Hoy, un asistente inteligente para ayudar a organizar eventos y bodas.`;

  const payload = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Hola, di algo corto" }
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 100
  };

  console.log("Llamando a:", PYTHON_BACKEND + ENDPOINT);

  try {
    const response = await fetch(PYTHON_BACKEND + ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Development": "bodasdehoy"
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    console.log("\n=== RAW SSE DATA ===");
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("\n[Stream ended]");
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log("RAW:", JSON.stringify(chunk));

      // Parse SSE
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data:")) {
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              fullContent += parsed.choices[0].delta.content;
            }
            if (parsed.content) {
              fullContent += parsed.content;
            }
          } catch {}
        }
        if (line.startsWith("event:")) {
          console.log("  Event:", line);
        }
      }
    }

    console.log("\n=== CONTENIDO EXTRAÍDO ===");
    console.log(fullContent || "(vacío)");

  } catch (error) {
    console.log("\n❌ Error:", error.message);
  }

  console.log("\n=== FIN TEST ===");
})();
