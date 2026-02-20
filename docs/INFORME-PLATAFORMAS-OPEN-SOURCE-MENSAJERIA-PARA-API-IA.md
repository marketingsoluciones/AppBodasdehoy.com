# Análisis de plataformas open source para mensajería unificada

**Para:** Equipo api-ia  
**De:** Front (AppBodasdehoy / Copilot)  
**Objetivo:** Este informe analiza repositorios y proyectos open source que unifican WhatsApp, Telegram, Instagram, Facebook Messenger y otros canales, para que api-ia pueda completarlo con lo que ya tenéis en backend y decidir con qué repositorios/tecnologías integrarse. Nosotros (front) de esos repos buscamos **funcionalidad y formas de trabajar del front** (UX, patrones, componentes); la parte de **datos, diseño de APIs y backend** la dirigís vosotros (api-ia).

---

## Reparto de responsabilidades

| Rol | Responsable | Descripción |
|-----|-------------|-------------|
| **Dirección / diseño de datos** | api-ia | Definís contratos, modelos y APIs (GraphQL/REST). |
| **Backend e integración con canales** | api-ia | Conectar con WhatsApp, Telegram, etc. usando vuestra stack o repos que elijáis. |
| **Front** | Nosotros | Implementamos la UI según lo que api-ia nos propone; consumimos vuestras APIs. |
| **Este informe** | Front | Análisis de plataformas open source para que api-ia lo complete con vuestra parte y use estos repos en backend donde encajen. Nosotros extraemos de esos repos **funcionalidad y ventajas de front** (inbox, patrones de UI, flujos). |

---

## Objetivo estratégico

Evaluar los mejores repositorios y proyectos open source que permitan unificar WhatsApp, Telegram, Instagram, Facebook Messenger y otros canales en una sola plataforma, con el fin de construir un sistema propio de **asistencia y mercadeo** integrado. api-ia puede usar este análisis para elegir con qué backends/repos integrarse; nosotros para inspirar y mejorar el front (inbox, filtros, estados, etc.).

---

## 1. Plataformas omnicanal completas (inbox unificado)

Soluciones maduras con dashboard centralizado donde llegan todos los mensajes de todos los canales.

### 1.1 Chatwoot — Recomendación principal

| Dato | Detalle |
|------|---------|
| **Repositorio** | [github.com/chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) |
| **Stars GitHub** | ~27.300 |
| **Licencia** | MIT |
| **Stack** | Ruby on Rails + React + PostgreSQL + Redis |
| **Última actividad** | Activo (releases semanales, v4.9+ con TikTok y Voice) |

**Canales soportados nativamente:** WhatsApp (Cloud API Meta), Telegram, Instagram DMs, Facebook Messenger, Email, SMS (Twilio), Line, TikTok (alpha), Live Chat (widget web), Canal API (custom).

**Características clave:** Captain (IA integrada), base de conocimiento, automatizaciones y macros, CRM básico, reportes (CSAT, métricas por canal), API REST completa, multi-tenant, self-hosted (Docker/K8s).

**Para api-ia (backend):** Arquitectura de canales API permite conectar cualquier canal; webhooks para sincronizar con vuestra API.  
**Para front:** Patrones de inbox unificado, filtros por canal, estados de conversación, asignación de agentes; UI React de referencia.

**Limitaciones:** Stack Ruby on Rails; WhatsApp oficial con coste (Evolution API + Baileys permite alternativa gratuita).

---

### 1.2 Rocket.Chat

| Dato | Detalle |
|------|---------|
| **Repositorio** | [github.com/RocketChat/Rocket.Chat](https://github.com/RocketChat/Rocket.Chat) |
| **Stars GitHub** | ~42.500 |
| **Licencia** | MIT (Community) / Enterprise |
| **Stack** | TypeScript + Node.js + MongoDB |
| **Última actividad** | Muy activo |

**Canales:** WhatsApp Business, Facebook Messenger, Instagram Direct, Telegram, Email, SMS, VoIP, LiveChat.

**Características:** Microservicios, marketplace de apps, AI integrada, federation vía Matrix, permisos de rol, HIPAA/GDPR.  
**Para api-ia:** Stack TypeScript/Node + MongoDB más cercano a muchos backends; APIs y webhooks para integrar.  
**Para front:** Patrones de chat en tiempo real, listas de conversaciones, notificaciones; componentes y flujos reutilizables.

**Limitaciones:** Funciones omnichannel avanzadas pueden requerir Enterprise; más orientado a colaboración interna que a CRM/marketing.

---

### 1.3 Chaskiq

| Dato | Detalle |
|------|---------|
| **Repositorio** | [github.com/chaskiq/chaskiq](https://github.com/chaskiq/chaskiq) |
| **Stars GitHub** | ~3.200 |
| **Licencia** | AGPL-3.0 + Commercial |
| **Stack** | Ruby on Rails + React + PostgreSQL + Redis (GraphQL API) |
| **Última actividad** | Moderado |

**Canales:** WhatsApp, Twitter/X DMs, Facebook Messenger, Telegram, Slack, Email, Web Chat con videollamadas.

**Diferenciadores:** Enfoque marketing conversacional (campañas, newsletters, tours, banners), routing bots, editor WYSIWYG (Dante2), videollamadas WebRTC, 30+ plugins, **API GraphQL** (alineada con vuestro stack), segmentación con atributos.

**Para api-ia:** GraphQL como API principal; ideal si vuestra API ya es GraphQL.  
**Para front:** Flujos de marketing conversacional, editor rico, segmentación; referencias de UX para bodas/eventos.

**Limitaciones:** Comunidad más pequeña; menor frecuencia de actualizaciones.

---

## 2. APIs de conexión a WhatsApp (capa de conectividad)

### 2.1 Evolution API — Muy relevante

| Dato | Detalle |
|------|---------|
| **Repositorio** | [github.com/EvolutionAPI/evolution-api](https://github.com/EvolutionAPI/evolution-api) |
| **Stars GitHub** | ~5.200 |
| **Licencia** | Apache 2.0 |
| **Stack** | TypeScript + PostgreSQL + Redis + Docker |
| **Última actividad** | Muy activo (comunidad LATAM fuerte) |

**Arquitectura:** Baileys (WhatsApp Web, gratis) + Cloud API (Meta oficial, con coste). Integraciones nativas: Chatwoot, Typebot, Dify, OpenAI, RabbitMQ/Kafka/SQS, S3/Minio. Instagram y Messenger en desarrollo.

**Para api-ia:** Gateway WhatsApp listo; integrar con vuestro backend o con un inbox tipo Chatwoot. Stack TypeScript + PostgreSQL compatible.  
**Para front:** Nosotros solo consumimos vuestra API; Evolution sería capa de api-ia, no nuestra.

**Limitaciones:** Baileys no es oficial (riesgo ToS); producción seria suele requerir Cloud API.

---

### 2.2 Baileys (WhiskeySockets)

| Dato | Detalle |
|------|---------|
| **Repositorio** | [github.com/WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) |
| **Stars GitHub** | ~12.000+ |
| **Licencia** | MIT |
| **Stack** | TypeScript/JavaScript |

Librería base del protocolo multi-device WhatsApp Web. Evolution API la usa; si api-ia necesita control total, podría usarla directamente.

---

## 3. Builders de chatbots multicanal (automatización)

### 3.1 Typebot

| Dato | Detalle |
|------|---------|
| **Repositorio** | [github.com/baptisteArno/typebot.io](https://github.com/baptisteArno/typebot.io) |
| **Stars GitHub** | ~8.000+ |
| **Licencia** | AGPL-3.0 |
| **Stack** | TypeScript + Next.js + Prisma + PostgreSQL |

Builder visual drag-and-drop, multicanal (web, WhatsApp vía Evolution, Telegram). Integraciones: OpenAI, Google Sheets, Zapier, webhooks. Self-hosted con Docker.

**Para api-ia:** Flujos de bot; integración con Evolution API.  
**Para front:** Stack Next.js + TypeScript muy alineado; patrones de flujos conversacionales, formularios embebidos, lead capture.

---

### 3.2 Botpress

| Dato | Detalle |
|------|---------|
| **Repositorio** | [github.com/botpress/botpress](https://github.com/botpress/botpress) |
| **Stars GitHub** | ~13.000+ |
| **Licencia** | MIT |
| **Stack** | TypeScript |

Canales: Web, Facebook, Instagram, WhatsApp, Slack, Shopify, Salesforce. Visual Flow Builder, NLP, Knowledge Agents. Más orientado a chatbots con IA que a inbox unificado.

**Para api-ia:** Motor de conversación y canales.  
**Para front:** Referencias de flujos y respuestas automáticas.

---

## 4. Bridges y puentes entre protocolos

### 4.1 Matterbridge

Conecta 20+ protocolos (WhatsApp, Telegram, Discord, Slack, Matrix, etc.). Útil para sincronizar grupos entre plataformas; menos para atención al cliente individual. Stack: Go.

### 4.2 Matrix + Bridges (mautrix)

Bridges por plataforma (mautrix-whatsapp, mautrix-telegram, mautrix-instagram, mautrix-facebook). Element como cliente. Arquitectura federada; mayor complejidad de operación.

**Para api-ia:** Opción si apostáis por protocolo abierto y federado.

---

## 5. Herramientas de automatización (orquestación)

### 5.1 n8n

| Dato | Detalle |
|------|---------|
| **Repositorio** | [github.com/n8n-io/n8n](https://github.com/n8n-io/n8n) |
| **Stars GitHub** | ~50.000+ |
| **Licencia** | Sustainable Use License |
| **Stack** | TypeScript + Node.js |

Automatización visual (estilo Zapier/Make). 400+ nodos: WhatsApp Business, Telegram, Facebook, OpenAI, etc.

**Para api-ia:** Orquestar eventos (mensaje entrante → CRM, IA, notificaciones).  
**Para front:** Nosotros no orquestamos; solo consumimos vuestras APIs.

---

## 6. Qué aporta el front vs qué corresponde a api-ia

**Nosotros (front) de estos repositorios buscamos:**
- **Funcionalidad de UI:** Inbox unificado, filtros por canal, estados (leído/no leído), lista de conversaciones, hilo de mensajes, envío de texto/archivos.
- **Ventajas y formas de trabajar del front:** Patrones de carga, manejo de errores, reintentos, indicadores de escritura, agrupación por contacto/canal, accesibilidad.
- **Referencias de UX:** Cómo muestran Chatwoot, Rocket.Chat, Chaskiq las conversaciones multicanal para mejorar nuestro Copilot / página de mensajes.

**api-ia (backend) con este informe puede:**
- Completar el análisis con lo que ya tenéis implementado (getSessions, sendMessage, REST /api/messages/*).
- Decidir con qué repositorios integrarse (Evolution API, Chatwoot, Typebot, etc.) para la capa de conectividad y de negocio.
- Diseñar o ajustar contratos (GraphQL/REST) y nosotros implementaremos el front de acuerdo a lo que nos propongáis.

---

## 7. Tabla comparativa resumen

| Criterio | Chatwoot | Rocket.Chat | Chaskiq | Evolution API | Typebot |
|----------|----------|-------------|---------|---------------|---------|
| **WhatsApp** | ✅ Cloud API | ✅ Business | ⚠️ Via API | ✅ Baileys + Cloud | ✅ Via Evolution |
| **Telegram** | ✅ Nativo | ✅ Nativo | ✅ Nativo | ❌ | ❌ |
| **Instagram** | ✅ Nativo | ✅ Nativo | ❌ | 🔜 | ❌ |
| **Facebook** | ✅ Nativo | ✅ Nativo | ✅ Nativo | 🔜 | ❌ |
| **IA integrada** | ✅ Captain | ✅ AI | ❌ | ✅ OpenAI/Dify | ✅ OpenAI |
| **CRM** | ⚠️ Básico | ⚠️ Básico | ⚠️ Básico | ❌ | ❌ |
| **Marketing** | ⚠️ Limitado | ❌ | ✅ Fuerte | ❌ | ✅ Lead gen |
| **Self-hosted** | ✅ Docker/K8s | ✅ Docker/K8s | ✅ Docker | ✅ Docker | ✅ Docker |
| **API** | ✅ REST | ✅ REST | ✅ GraphQL | ✅ REST | ✅ REST |
| **Stack afín** | ⚠️ Ruby | ✅ TS/Node/Mongo | ⚠️ Ruby/GraphQL | ✅ TS/Postgres | ✅ Next.js/TS |
| **Comunidad** | 🟢 Grande | 🟢 Muy grande | 🟡 Pequeña | 🟢 Activa (LATAM) | 🟢 Creciente |
| **Licencia** | MIT | MIT/Enterprise | AGPL | Apache 2.0 | AGPL |

---

## 8. Recomendación para api-ia (stack backend / integraciones)

Combinación que suele citarse para inbox + conectividad + automatización:

- **Chatwoot** o **Rocket.Chat** como base de inbox unificado (todos los canales en un sitio).
- **Evolution API** como gateway de WhatsApp (Baileys para desarrollo, Cloud API para producción).
- **Typebot** para flujos conversacionales (leads, presupuestos, FAQ).
- **n8n** como orquestador de automatizaciones entre sistemas.

api-ia puede adoptar partes de estos proyectos, integrarlos con vuestra API actual (getSessions, sendMessage, /api/messages/*) y exponer un contrato único para el front. Nosotros seguimos siendo solo front e implementamos según lo que nos propongáis.

---

## 9. Siguiente paso

- **Front:** Seguiremos con el checklist de auditoría y las pruebas cuando api-ia confirme contratos y entornos.
- **api-ia:** Completar este informe con vuestra arquitectura actual y decisiones (qué repos usar, qué exponer al front); cuando esté listo, compartid el documento actualizado o un resumen para alinear UI y APIs.

---

*Documento generado para coordinación con api-ia. Front: AppBodasdehoy / Copilot. Backend y diseño de datos: api-ia.*
