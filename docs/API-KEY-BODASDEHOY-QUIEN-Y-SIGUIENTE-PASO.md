# API key bodasdehoy: quién la tiene y siguiente paso

## ¿Recuperar la API key en este repo?

**No.** La API key que usa api-ia para el developer `bodasdehoy` **no está en este repositorio**. Nosotros **no hablamos con API2** para el chat: hablamos solo con **api-ia.bodasdehoy.com**. Quién resuelve la key (api-ia desde su lado, o api-ia llamando a API2 internamente) es cosa del backend. Nosotros solo enviamos `X-Development: bodasdehoy` a api-ia.

- **Quién la tiene:** Backend api-ia (y/o API2/whitelabel en su lado; nosotros no llamamos a api2.eventosorganizador.com para chat). Ver **docs/QUIEN-HABLA-CON-QUE-API.md**.
- **Qué tenemos en el repo:** En `apps/web` hay lógica para obtener config whitelabel (API_IA_WHITELABEL_URL, getWhiteLabelConfig) y un **fallback** con `OPENAI_API_KEY` en `.env.local` para desarrollo; ese valor es local y no es la key whitelabel de bodasdehoy.
- **Conclusión:** Para "recuperar" o corregir la key de bodasdehoy hay que actuar en **API2/api-ia** (ya lo hemos pedido por Slack). Nosotros no podemos recuperarla desde código.

## Siguiente paso (único hasta que contesten)

1. **Esperar** a que api-ia/API2 avisen por #copilot-api-ia que las credenciales whitelabel de bodasdehoy están corregidas.
2. **En cuanto avisen:** ejecutar:
   ```bash
   bash scripts/test-api-ia-y-enviar-slack.sh
   node scripts/run-20-preguntas-api-ia.mjs --json --output docs/resultados-20-preguntas-api-ia.json
   ```
3. Si todo 200 y respuestas coherentes → cerrar tema. Si sigue 503 → devolver a api-ia con el resultado del script.

No hay más iteración nuestra hasta que ellos corrijan la key; repetir pruebas sin ese aviso no cambia el resultado.
