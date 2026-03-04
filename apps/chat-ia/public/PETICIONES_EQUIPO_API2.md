# Peticiones al Equipo de API2

**Fecha**: 16 de Noviembre, 2024  
**Sistema**: Lobe Chat + Backend Middleware (Puerto 8030)  
**Problema**: API2 retorna `400 Bad Request` en TODAS las queries GraphQL

---

## 🚨 PROBLEMA PRINCIPAL

El backend middleware está enviando peticiones GraphQL a:
```
POST https://api2.eventosorganizador.com/graphql
```

**Todas las peticiones retornan:**
```
HTTP/1.1 400 Bad Request
```

---

## 📋 HEADERS QUE SE ESTÁN ENVIANDO

```http
Content-Type: application/json
X-Development: bodasdehoy
X-Origin: https://bodasdehoy.com
X-Support-Key: SK-bodasdehoy-a71f5b3c
```

---

## 📡 QUERIES QUE FALLAN

### 1. Query `getWhitelabelBySlug`

**Query GraphQL enviada:**
```graphql
query GetWhitelabelBySlug($slug: String!) {
    getWhitelabelBySlug(slug: $slug) {
        success
        whitelabel {
            id
            slug
            development
            name
            description
            enabled
            
            branding {
                logo
                favicon
                apple_touch_icon
                background_image
                og_image
                twitter_image
                icons {
                    chat
                    settings
                    user
                    events
                    guests
                    budget
                    campaigns
                }
            }
            
            colors {
                primary
                secondary
                background
                text
                accent
            }
            
            contact {
                email
                phone
                website
            }
            
            ai_config {
                default_provider
                default_model
                auto_routing {
                    enabled
                    prefer_local
                    fallback_order
                    skip_if_no_key
                }
                api_keys
                model_preferences
            }
            
            externalServices {
                service
                provider
                displayName
                isActive
                config
            }
            
            createdAt
            updatedAt
        }
        errors {
            field
            message
            code
        }
    }
}
```

**Variables:**
```json
{
  "slug": "bodasdehoy"
}
```

**Respuesta actual:**
```
400 Bad Request
```

---

### 2. Query `getUserProfile` (Frontend)

**Query GraphQL enviada desde frontend:**
```graphql
query GetUserProfile($email: String!) {
    getUserProfile(email: $email) {
        id
        email
        name
        phone
        avatar
        role
        development
    }
}
```

**Variables:**
```json
{
  "email": "bodasdehoy.com@gmail.com"
}
```

**Headers esperados:**
```http
X-Development: bodasdehoy
X-Origin: https://bodasdehoy.com
X-Support-Key: SK-bodasdehoy-a71f5b3c
```

**Respuesta actual:**
```
400 Bad Request
```

---

### 3. Query `getUserApiConfigs` (Frontend)

**Query GraphQL enviada:**
```graphql
query GetUserApiConfigs($userId: String!) {
    getUserApiConfigs(userId: $userId) {
        userId
        development
        apiConfigs {
            provider
            apiKey
            model
            enabled
        }
    }
}
```

**Variables:**
```json
{
  "userId": "bodasdehoy.com@gmail.com"
}
```

**Respuesta actual:**
```
400 Bad Request
```

---

### 4. Query `getUserEvents` (Frontend)

**Query GraphQL enviada:**
```graphql
query GetUserEventsByEmail($email: String!, $development: String!) {
    getUserEventsByEmail(email: $email, development: $development) {
        id
        name
        date
        type
        status
    }
}
```

**Variables:**
```json
{
  "email": "bodasdehoy.com@gmail.com",
  "development": "bodasdehoy"
}
```

**Respuesta actual:**
```
400 Bad Request
```

---

### 5. Query `getUserChats` (Frontend)

**Query GraphQL enviada:**
```graphql
query GetUserChats($email: String!, $development: String!) {
    getUserChats(email: $email, development: $development) {
        id
        channel
        lastMessage
        lastMessageAt
        unreadCount
        participants {
            name
            avatar
        }
    }
}
```

**Variables:**
```json
{
  "email": "bodasdehoy.com@gmail.com",
  "development": "bodasdehoy"
}
```

**Respuesta actual:**
```
400 Bad Request
```

---

## ✅ VERIFICACIONES NECESARIAS

Por favor, verificar:

1. **¿El endpoint GraphQL está activo?**
   - URL: `https://api2.eventosorganizador.com/graphql`
   - ¿Responde a peticiones POST?

2. **¿Los headers son correctos?**
   - ¿Se requieren `X-Development`, `X-Origin`, `X-Support-Key`?
   - ¿O se debe usar otro formato? (`Development` sin X-)

3. **¿El supportKey es válido?**
   - Actualmente usando: `SK-bodasdehoy-a71f5b3c`
   - ¿Es correcto este formato?
   - ¿Existe este supportKey en la base de datos?

4. **¿Las queries GraphQL son correctas?**
   - ¿Existe `getWhitelabelBySlug`?
   - ¿Existe `getUserProfile`?
   - ¿Existe `getUserApiConfigs`?
   - ¿Existe `getUserEventsByEmail`?
   - ¿Existe `getUserChats`?

5. **¿Los nombres de campos son correctos?**
   - ¿Todos los campos solicitados existen en el schema?
   - ¿Hay algún campo que haya sido renombrado?

6. **¿Se requiere autenticación JWT?**
   - ¿Se necesita un token JWT en el header `Authorization`?
   - ¿O solo con supportKey es suficiente?

---

## 🔧 INFORMACIÓN ADICIONAL

**Versión del backend middleware:**
- Puerto: 8030
- Framework: FastAPI (Python)
- Cliente HTTP: httpx

**Usuario de prueba:**
- Email: `bodasdehoy.com@gmail.com`
- Development: `bodasdehoy`

**Comportamiento esperado:**
- Las queries deben retornar `200 OK` con datos JSON
- Si no hay datos, retornar `{ "data": { "query_name": null } }`
- Los errores GraphQL deben venir en formato:
  ```json
  {
    "data": null,
    "errors": [{
      "message": "Error description",
      "path": ["query_name"],
      "extensions": { "code": "ERROR_CODE" }
    }]
  }
  ```

---

## 📞 CONTACTO

Para dudas sobre el middleware:
- Backend Python: `/Volumes/HD MAC BASE/Projects/IA V2/backend/`
- Cliente API2: `backend/api/api2_client.py`
- Logs: `backend.log`

---

## 🎯 ACCIÓN REQUERIDA

**Por favor, proporcionar:**

1. ✅ Confirmación de que el endpoint GraphQL está funcionando
2. ✅ Schema GraphQL actualizado (tipos y queries disponibles)
3. ✅ Formato correcto de headers y supportKey
4. ✅ Ejemplo de petición exitosa con curl o Postman
5. ✅ Usuario de prueba válido con datos reales para testing

**Gracias!** 🙏

