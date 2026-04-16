# Textos listos para pegar – verificación por proveedor (LLM)

**Uso:** copia el bloque `text` del proveedor que estés probando y pégalo en Slack / correo a **api-ia** o al canal acordado. Rellena modelo y entorno. Así mantenéis **una lista clara** de qué proveedor está cerrado y cuál no.

**Origen de la lista:** mismos proveedores que `DEFAULT_MODEL_PROVIDER_LIST` en `apps/chat-ia/src/config/modelProviders/index.ts`.

---

## Plantilla genérica (cualquier proveedor)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: NOMBRE_AMIGABLE
provider_id (config): ID_EN_LOBE
Entorno probado: app-test | producción | local
Modelo usado en la prueba: _________________________

Comprobaciones:
- [ ] Chat simple OK
- [ ] Streaming OK
- [ ] Tools / function calling: OK | N/A

Si NO OK (datos obligatorios):
1) Endpoint o query exacta
2) Timestamp UTC
3) Headers/contexto (development, Authorization si aplica) + provider_id + modelo
4) Payload completo del error

Estado: OK | NO OK
```

---

## Un bloque por proveedor (copiar debajo del título)

### OpenAI (`openai`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: OpenAI
provider_id (config): openai
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=openai
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Azure OpenAI (`azure`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Azure OpenAI
provider_id (config): azure
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=azure
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Azure AI (`azureai`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Azure AI
provider_id (config): azureai
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=azureai
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Ollama (`ollama`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Ollama
provider_id (config): ollama
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=ollama
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Ollama Cloud (`ollamacloud`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Ollama Cloud
provider_id (config): ollamacloud
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=ollamacloud
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### vLLM (`vllm`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: vLLM
provider_id (config): vllm
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=vllm
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### ComfyUI (`comfyui`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: ComfyUI
provider_id (config): comfyui
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=comfyui
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Xinference (`xinference`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Xinference
provider_id (config): xinference
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=xinference
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Anthropic (`anthropic`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Anthropic
provider_id (config): anthropic
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=anthropic
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Bedrock (`bedrock`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Bedrock
provider_id (config): bedrock
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=bedrock
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Google (`google`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Google
provider_id (config): google
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=google
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Vertex AI (`vertexai`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Vertex AI
provider_id (config): vertexai
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=vertexai
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### DeepSeek (`deepseek`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: DeepSeek
provider_id (config): deepseek
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=deepseek
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Moonshot (`moonshot`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Moonshot
provider_id (config): moonshot
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=moonshot
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### AiHubMix (`aihubmix`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: AiHubMix
provider_id (config): aihubmix
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=aihubmix
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### OpenRouter (`openrouter`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: OpenRouter
provider_id (config): openrouter
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=openrouter
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Fal (`fal`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Fal
provider_id (config): fal
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=fal
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### HuggingFace (`huggingface`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: HuggingFace
provider_id (config): huggingface
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=huggingface
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Cloudflare Workers AI (`cloudflare`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Cloudflare Workers AI
provider_id (config): cloudflare
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=cloudflare
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### GitHub (`github`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: GitHub
provider_id (config): github
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=github
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### New API (`newapi`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: New API
provider_id (config): newapi
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=newapi
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Black Forest Labs (`bfl`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Black Forest Labs
provider_id (config): bfl
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=bfl
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Novita (`novita`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Novita
provider_id (config): novita
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=novita
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### PPIO (`ppio`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: PPIO
provider_id (config): ppio
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=ppio
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### 302.AI (`ai302`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: 302.AI
provider_id (config): ai302
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=ai302
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Nvidia (`nvidia`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Nvidia
provider_id (config): nvidia
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=nvidia
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Together AI (`togetherai`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Together AI
provider_id (config): togetherai
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=togetherai
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Fireworks AI (`fireworksai`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Fireworks AI
provider_id (config): fireworksai
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=fireworksai
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Groq (`groq`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Groq
provider_id (config): groq
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=groq
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Perplexity (`perplexity`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Perplexity
provider_id (config): perplexity
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=perplexity
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Mistral (`mistral`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Mistral
provider_id (config): mistral
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=mistral
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### ModelScope (`modelscope`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: ModelScope
provider_id (config): modelscope
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=modelscope
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Ai21Labs (`ai21`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Ai21Labs
provider_id (config): ai21
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=ai21
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Upstage (`upstage`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Upstage
provider_id (config): upstage
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=upstage
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### xAI (Grok) (`xai`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: xAI (Grok)
provider_id (config): xai
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=xai
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Jina AI (`jina`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Jina AI
provider_id (config): jina
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=jina
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### SambaNova (`sambanova`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: SambaNova
provider_id (config): sambanova
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=sambanova
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Cohere (`cohere`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Cohere
provider_id (config): cohere
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=cohere
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Vercel (v0) (`v0`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Vercel (v0)
provider_id (config): v0
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=v0
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Aliyun Bailian (`qwen`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Aliyun Bailian
provider_id (config): qwen
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=qwen
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Wenxin (`wenxin`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Wenxin
provider_id (config): wenxin
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=wenxin
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### TencentCloud (`tencentcloud`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: TencentCloud
provider_id (config): tencentcloud
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=tencentcloud
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Hunyuan (`hunyuan`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Hunyuan
provider_id (config): hunyuan
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=hunyuan
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### ZhiPu (`zhipu`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: ZhiPu
provider_id (config): zhipu
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=zhipu
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### SiliconCloud (`siliconcloud`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: SiliconCloud
provider_id (config): siliconcloud
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=siliconcloud
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### 01.AI (`zeroone`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: 01.AI
provider_id (config): zeroone
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=zeroone
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Spark (`spark`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Spark
provider_id (config): spark
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=spark
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### SenseNova (`sensenova`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: SenseNova
provider_id (config): sensenova
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=sensenova
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Stepfun (`stepfun`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Stepfun
provider_id (config): stepfun
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=stepfun
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Baichuan (`baichuan`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Baichuan
provider_id (config): baichuan
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=baichuan
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Volcengine (`volcengine`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Volcengine
provider_id (config): volcengine
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=volcengine
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Minimax (`minimax`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Minimax
provider_id (config): minimax
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=minimax
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### LM Studio (`lmstudio`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: LM Studio
provider_id (config): lmstudio
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=lmstudio
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### InternLM (`internlm`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: InternLM
provider_id (config): internlm
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=internlm
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Higress (`higress`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Higress
provider_id (config): higress
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=higress
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Gitee AI (`giteeai`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Gitee AI
provider_id (config): giteeai
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=giteeai
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Taichu (`taichu`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Taichu
provider_id (config): taichu
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=taichu
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### 360 AI (`ai360`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: 360 AI
provider_id (config): ai360
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=ai360
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Search1API (`search1api`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Search1API
provider_id (config): search1api
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=search1api
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### InfiniAI (`infiniai`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: InfiniAI
provider_id (config): infiniai
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=infiniai
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### AkashChat (`akashchat`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: AkashChat
provider_id (config): akashchat
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=akashchat
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Qiniu (`qiniu`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Qiniu
provider_id (config): qiniu
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=qiniu
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Nebius (`nebius`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Nebius
provider_id (config): nebius
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=nebius
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### CometAPI (`cometapi`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: CometAPI
provider_id (config): cometapi
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=cometapi
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Vercel AI Gateway (`vercelaigateway`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Vercel AI Gateway
provider_id (config): vercelaigateway
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=vercelaigateway
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---

### Cerebras (`cerebras`)

```text
[AppBodasdehoy / Chat-IA – verificación proveedor LLM]

Proveedor: Cerebras
provider_id (config): cerebras
Entorno probado: app-test | producción | local (tachar los que no)
Modelo usado en la prueba: _________________________

Comprobaciones (marcar en el hilo al responder):
- [ ] Un mensaje de chat responde sin error
- [ ] Respuesta en streaming correcta
- [ ] Function calling / tools (si el modelo lo soporta): OK | N/A

Si NO OK, adjuntar en el MISMO mensaje (api-ia / API2 lo piden así):
1) Endpoint o acción exacta (p. ej. ruta proxy, nombre operación)
2) Timestamp UTC
3) Contexto: development/tenant + modelo + provider_id=cerebras
4) Payload / cuerpo del error completo (y trace_id si existe)

Estado final de esta prueba: OK | NO OK
Firma / fecha: _________________________
```

---
