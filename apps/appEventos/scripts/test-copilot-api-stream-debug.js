/**
 * Test: Debug SSE raw response
 */

(async () => {
  console.log("=== TEST API COPILOT SSE DEBUG ===\n");

  const API_URL = "https://app-test.bodasdehoy.com/api/copilot/chat";

  const payload = {
    messages: [
      {
        role: "user",
        content: "Hola"
      }
    ],
    stream: true,
    metadata: {
      userId: "guest_test_123",
      development: "bodasdehoy"
    }
  };

  console.log("Llamando a:", API_URL);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Development": "bodasdehoy"
      },
      body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get("content-type"));
    console.log("X-Request-Id:", response.headers.get("x-request-id"));
    console.log("X-Backend-Error-Code:", response.headers.get("x-backend-error-code"));
    console.log("X-Backend-Trace-Id:", response.headers.get("x-backend-trace-id"));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    console.log("\n=== RAW SSE DATA ===");
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("\n[Stream ended]");
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log("RAW CHUNK:");
      console.log("---");
      console.log(JSON.stringify(chunk));
      console.log("---\n");
    }

  } catch (error) {
    console.log("\n❌ Error:", error.message);
  }

  console.log("\n=== FIN TEST ===");
})();
