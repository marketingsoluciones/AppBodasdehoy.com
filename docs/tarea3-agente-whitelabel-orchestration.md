# Tarea 3: api2 — Pipeline completo de creación automática de whitelabels

> **Para el agente que implemente esto.**
> El objetivo es que api2 sea el único orquestador. El admin llama a UN endpoint,
> proporciona los datos mínimos, y api2 hace todo lo demás automáticamente:
> crea el proyecto Firebase, habilita Auth, obtiene las credenciales, añade el dominio
> en Vercel, crea el usuario de test, y guarda todo en MongoDB.

---

## Arquitectura del pipeline

```
Admin llama POST /api/admin/tenant/provision
          │
          ├─► Google Cloud Resource Manager API → crear proyecto GCP
          │
          ├─► Firebase Management API → añadir Firebase al proyecto
          │
          ├─► Identity Toolkit API → habilitar Email/Password + Google Auth
          │
          ├─► IAM API → crear service account + descargar credenciales
          │              (guardadas en MongoDB, no en disco)
          │
          ├─► Vercel API → añadir custom domain al proyecto existente
          │
          ├─► Firebase Admin SDK → crear usuario de test con custom token
          │
          └─► MongoDB whitelabels → guardar toda la config
```

**El admin solo necesita proporcionar:**
- `development` — slug único (ej: `miweboda`)
- `name` — nombre visible (ej: `Mi WebBoda`)
- `domain` — dominio raíz (ej: `miweboda.com`)
- `ownerEmail` — email del propietario del tenant
- `colors` — colores del tema (opcional)

---

## Infraestructura de api2

| Dato | Valor |
|---|---|
| Servidor | `143.198.62.113` |
| SSH | `ssh -i ~/.ssh/shared_key root@143.198.62.113` |
| Código | `/var/www/api-production/src/` |
| Compilar | `cd /var/www/api-production && npm run build` |
| Reiniciar | `sudo pm2 restart api-production` |
| `.env` | `/var/www/api-production/.env` |

> Los errores TS de Multer son pre-existentes y no bloquean la compilación. Ignorarlos.

---

## PARTE A — Prerequisitos en Google Cloud

### A1. Crear una cuenta de servicio "maestra" en Google Cloud

Esta cuenta de servicio es la que api2 usa para crear nuevos proyectos Firebase.
Es diferente de las service accounts de cada tenant individual.

**Pasos en Google Cloud Console:**

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Seleccionar cualquier proyecto existente (ej: el de bodasdehoy)
3. IAM & Admin → Service Accounts → **Create Service Account**
   - Name: `api2-whitelabel-provisioner`
   - Description: `Crea proyectos Firebase para nuevos tenants`
4. En los roles, añadir:
   - `roles/resourcemanager.projectCreator` — crear proyectos GCP
   - `roles/firebase.admin` — añadir Firebase a proyectos
   - `roles/iam.serviceAccountAdmin` — crear service accounts en nuevos proyectos
   - `roles/iam.serviceAccountKeyAdmin` — generar keys de service accounts
5. Generar key JSON → descargar → llamarlo `gcloud-provisioner.json`

**Subir al servidor:**
```bash
scp -i ~/.ssh/shared_key gcloud-provisioner.json root@143.198.62.113:/var/www/api-production/private/
chmod 600 /var/www/api-production/private/gcloud-provisioner.json
```

### A2. Habilitar APIs en Google Cloud

Estas APIs deben estar habilitadas en el proyecto "maestro" (el de bodasdehoy o uno dedicado a billing):

```bash
# Desde el Mac, con gcloud CLI instalado:
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable firebase.googleapis.com
gcloud services enable identitytoolkit.googleapis.com
gcloud services enable iam.googleapis.com
gcloud services enable serviceusage.googleapis.com

# O desde la consola web: APIs & Services → Enable APIs
# Buscar y habilitar: Cloud Resource Manager, Firebase Management,
# Identity Toolkit, IAM, Service Usage
```

### A3. Vincular cuenta de facturación

Los nuevos proyectos Firebase necesitan una billing account vinculada para el plan Blaze
(necesario para Firebase Auth con dominios custom).

```bash
# Obtener ID de la billing account existente:
gcloud billing accounts list

# Guarda el BILLING_ACCOUNT_ID para usarlo en las variables de entorno de api2
```

---

## PARTE B — Instalar dependencias en api2

```bash
ssh -i ~/.ssh/shared_key root@143.198.62.113
cd /var/www/api-production

# Firebase Admin SDK (para gestionar usuarios y crear custom tokens)
npm install firebase-admin

# Google APIs client (para crear proyectos GCP, habilitar Firebase, gestionar IAM)
npm install googleapis

# Verificar instalación
node -e "require('firebase-admin'); require('googleapis'); console.log('OK')"
```

---

## PARTE C — Servicio de provisioning en api2

Crear `/var/www/api-production/src/services/whitelabel-provisioner.service.ts`:

```typescript
/**
 * WhitelabelProvisionerService
 *
 * Orquesta la creación completa de un nuevo whitelabel:
 *   1. Crea proyecto GCP
 *   2. Añade Firebase al proyecto
 *   3. Habilita Email/Password Auth
 *   4. Crea service account del tenant + descarga key
 *   5. Obtiene la Firebase Web App config (apiKey, appId, etc.)
 *   6. Crea usuario de test
 *   7. Añade dominio en Vercel
 */

import { google } from 'googleapis';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const PROVISIONER_SA_PATH = path.join(__dirname, '../../../private/gcloud-provisioner.json');

function getGoogleAuth(scopes: string[]) {
  return new google.auth.GoogleAuth({
    keyFile: PROVISIONER_SA_PATH,
    scopes,
  });
}

// ── Paso 1: Crear proyecto GCP ────────────────────────────────────────────────

export async function createGCPProject(params: {
  projectId: string;       // ej: "miweboda-app" (único globalmente en GCP)
  displayName: string;     // ej: "Mi WebBoda"
  billingAccountId: string; // ej: "012345-ABCDEF-123456"
}): Promise<{ projectId: string; projectNumber: string }> {
  const auth = getGoogleAuth(['https://www.googleapis.com/auth/cloud-platform']);
  const resourceManager = google.cloudresourcemanager({ version: 'v3', auth });

  // Crear proyecto
  const createOp = await resourceManager.projects.create({
    requestBody: {
      projectId: params.projectId,
      displayName: params.displayName,
    },
  });

  // Esperar a que la operación termine (puede tardar 10-30s)
  let operation = createOp.data;
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 3000));
    const opRes = await google.cloudresourcemanager('v3').operations.get({
      name: operation.name!,
      auth,
    });
    operation = opRes.data;
  }

  if (operation.error) {
    throw new Error(`Error creando proyecto GCP: ${JSON.stringify(operation.error)}`);
  }

  const project = operation.response as any;
  const projectNumber = project.name.split('/')[1]; // "projects/123456789"

  // Vincular billing account (necesario para plan Blaze)
  const billing = google.cloudbilling({ version: 'v1', auth });
  await billing.projects.updateBillingInfo({
    name: `projects/${params.projectId}`,
    requestBody: {
      billingAccountName: `billingAccounts/${params.billingAccountId}`,
    },
  });

  console.log(`[Provisioner] Proyecto GCP creado: ${params.projectId} (#${projectNumber})`);
  return { projectId: params.projectId, projectNumber };
}

// ── Paso 2: Añadir Firebase al proyecto GCP ───────────────────────────────────

export async function addFirebaseToProject(projectId: string): Promise<void> {
  const auth = getGoogleAuth(['https://www.googleapis.com/auth/cloud-platform']);

  // Primero habilitar las APIs necesarias en el nuevo proyecto
  const serviceUsage = google.serviceusage({ version: 'v1', auth });
  await serviceUsage.services.batchEnable({
    parent: `projects/${projectId}`,
    requestBody: {
      serviceIds: [
        'firebase.googleapis.com',
        'identitytoolkit.googleapis.com',
        'firebaseauth.googleapis.com',
      ],
    },
  });

  // Añadir Firebase al proyecto
  const firebase = google.firebase({ version: 'v1beta1', auth });
  const addOp = await firebase.projects.addFirebase({
    project: `projects/${projectId}`,
    requestBody: {},
  });

  let operation = addOp.data;
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 3000));
    const opRes = await firebase.operations.get({ name: operation.name! });
    operation = opRes.data;
  }

  if (operation.error) {
    throw new Error(`Error añadiendo Firebase: ${JSON.stringify(operation.error)}`);
  }

  console.log(`[Provisioner] Firebase añadido al proyecto: ${projectId}`);
}

// ── Paso 3: Habilitar Email/Password Auth ─────────────────────────────────────

export async function enableEmailPasswordAuth(projectId: string): Promise<void> {
  const auth = getGoogleAuth(['https://www.googleapis.com/auth/cloud-platform']);

  // Usar Identity Toolkit API para habilitar Email/Password
  const identityToolkit = google.identitytoolkit({ version: 'v2', auth });

  await identityToolkit.projects.updateConfig({
    name: `projects/${projectId}/config`,
    updateMask: 'signIn',
    requestBody: {
      signIn: {
        email: {
          enabled: true,
          passwordRequired: true,
        },
      },
    },
  });

  console.log(`[Provisioner] Email/Password Auth habilitado: ${projectId}`);
}

// ── Paso 4: Crear Web App en Firebase y obtener config ────────────────────────

export async function createFirebaseWebApp(params: {
  projectId: string;
  displayName: string;
  domain: string;
}): Promise<{
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}> {
  const auth = getGoogleAuth(['https://www.googleapis.com/auth/cloud-platform']);
  const firebase = google.firebase({ version: 'v1beta1', auth });

  // Crear Web App
  const createOp = await firebase.projects.webApps.create({
    parent: `projects/${params.projectId}`,
    requestBody: { displayName: params.displayName },
  });

  let operation = createOp.data;
  while (!operation.done) {
    await new Promise(r => setTimeout(r, 2000));
    const opRes = await firebase.operations.get({ name: operation.name! });
    operation = opRes.data;
  }

  const webApp = operation.response as any;
  const appId = webApp.appId;

  // Obtener config de la Web App
  const configRes = await firebase.projects.webApps.getConfig({
    name: `projects/${params.projectId}/webApps/${appId}/config`,
  });

  const config = configRes.data;

  // Añadir dominio autorizado a Firebase Auth
  await addAuthorizedDomain(params.projectId, params.domain, auth);

  console.log(`[Provisioner] Web App Firebase creada: ${params.projectId}/${appId}`);

  return {
    apiKey: config.apiKey!,
    authDomain: config.authDomain!,
    projectId: config.projectId!,
    storageBucket: config.storageBucket!,
    messagingSenderId: config.messagingSenderId!,
    appId: config.appId!,
  };
}

async function addAuthorizedDomain(projectId: string, domain: string, auth: any): Promise<void> {
  // Añadir el dominio del tenant a los dominios autorizados de Firebase Auth
  // para que el login funcione desde ese dominio
  const identityToolkit = google.identitytoolkit({ version: 'v2', auth });
  try {
    const current = await identityToolkit.projects.getConfig({
      name: `projects/${projectId}/config`,
    });
    const existingDomains = (current.data as any).authorizedDomains || [];
    const newDomains = [...new Set([...existingDomains, domain, `www.${domain}`])];

    await identityToolkit.projects.updateConfig({
      name: `projects/${projectId}/config`,
      updateMask: 'authorizedDomains',
      requestBody: { authorizedDomains: newDomains } as any,
    });
    console.log(`[Provisioner] Dominios autorizados en Firebase Auth: ${newDomains.join(', ')}`);
  } catch (e: any) {
    console.warn(`[Provisioner] No se pudieron añadir dominios autorizados: ${e.message}`);
  }
}

// ── Paso 5: Crear service account del tenant + descargar key ──────────────────

export async function createTenantServiceAccount(params: {
  projectId: string;
  development: string;
}): Promise<string> {  // Retorna el JSON de la service account como string
  const auth = getGoogleAuth(['https://www.googleapis.com/auth/cloud-platform']);
  const iam = google.iam({ version: 'v1', auth });

  const accountId = `firebase-admin-${params.development}`;
  const saName = `projects/${params.projectId}/serviceAccounts/${accountId}@${params.projectId}.iam.gserviceaccount.com`;

  // Crear service account
  await iam.projects.serviceAccounts.create({
    name: `projects/${params.projectId}`,
    requestBody: {
      accountId,
      serviceAccount: {
        displayName: `Firebase Admin - ${params.development}`,
      },
    },
  });

  // Dar rol Firebase Admin a la service account
  const resourceManager = google.cloudresourcemanager({ version: 'v3', auth });
  const policy = await resourceManager.projects.getIamPolicy({
    resource: `projects/${params.projectId}`,
    requestBody: {},
  });

  const bindings = policy.data.bindings || [];
  bindings.push({
    role: 'roles/firebase.admin',
    members: [`serviceAccount:${accountId}@${params.projectId}.iam.gserviceaccount.com`],
  });

  await resourceManager.projects.setIamPolicy({
    resource: `projects/${params.projectId}`,
    requestBody: {
      policy: { ...policy.data, bindings },
    },
  });

  // Descargar key JSON
  const keyRes = await iam.projects.serviceAccounts.keys.create({
    name: saName,
    requestBody: { privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE' },
  });

  // La key viene en base64
  const keyJson = Buffer.from(keyRes.data.privateKeyData!, 'base64').toString('utf8');

  console.log(`[Provisioner] Service account creada: ${accountId}@${params.projectId}.iam.gserviceaccount.com`);
  return keyJson;
}

// ── Paso 6: Inicializar Firebase Admin con la nueva service account ───────────

const initializedApps = new Map<string, admin.app.App>();

export function initFirebaseAdminFromJson(development: string, serviceAccountJson: string): admin.app.App {
  if (initializedApps.has(development)) {
    return initializedApps.get(development)!;
  }
  const serviceAccount = JSON.parse(serviceAccountJson);
  const app = admin.initializeApp(
    { credential: admin.credential.cert(serviceAccount) },
    development
  );
  initializedApps.set(development, app);
  return app;
}

export function getFirebaseAdminApp(development: string, serviceAccountJson?: string): admin.app.App | null {
  if (initializedApps.has(development)) return initializedApps.get(development)!;
  if (serviceAccountJson) return initFirebaseAdminFromJson(development, serviceAccountJson);
  return null;
}

// ── Paso 7: Crear usuario de test ─────────────────────────────────────────────

export async function createTestUser(params: {
  development: string;
  serviceAccountJson: string;
  ownerEmail?: string;
}): Promise<{ uid: string; email: string; customToken: string }> {
  const app = initFirebaseAdminFromJson(params.development, params.serviceAccountJson);
  const auth = admin.auth(app);

  const testEmail = `dev-test@${params.development}.internal`;
  const testPassword = `DevTest_${params.development}_${new Date().getFullYear()}!`;

  let uid: string;
  try {
    const existing = await auth.getUserByEmail(testEmail);
    uid = existing.uid;
    console.log(`[Provisioner] Usuario de test ya existía: ${testEmail}`);
  } catch {
    const newUser = await auth.createUser({
      email: testEmail,
      password: testPassword,
      displayName: `Dev Test (${params.development})`,
      emailVerified: true,
    });
    uid = newUser.uid;
    console.log(`[Provisioner] Usuario de test creado: ${testEmail}`);
  }

  const customToken = await auth.createCustomToken(uid, {
    development: params.development,
    role: 'dev_tester',
  });

  return { uid, email: testEmail, customToken };
}

// ── Paso 8: Añadir dominio en Vercel ─────────────────────────────────────────

export async function addDomainToVercel(domain: string): Promise<any> {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return { skipped: true, reason: 'VERCEL_API_TOKEN o VERCEL_PROJECT_ID no configurados en .env' };
  }

  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json();
  console.log(`[Provisioner] Vercel domain add (${domain}):`, data);
  return data;
}
```

---

## PARTE D — Endpoint de provisioning completo

Crear `/var/www/api-production/src/routes/admin-tenant.ts`:

```typescript
import { Router, Request, Response } from 'express';
import { Whitelabel } from '../db/models/whitelabel';
import crypto from 'crypto';

const router = Router();

const requireAdmin = (req: Request, res: Response, next: any) => {
  const key = req.headers['x-master-key'];
  if (!key || key !== process.env.ADMIN_MASTER_KEY) {
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  }
  next();
};

/**
 * POST /api/admin/tenant/provision
 *
 * Provisiona un nuevo whitelabel de principio a fin.
 * El admin solo proporciona los datos mínimos; api2 hace el resto.
 *
 * Body (mínimo):
 * {
 *   development: "miweboda",         // slug único, solo letras minúsculas, números y guiones
 *   name: "Mi WebBoda",              // nombre visible
 *   domain: "miweboda.com",          // dominio raíz del tenant
 *   ownerEmail: "owner@email.com",   // email del propietario (para registros)
 *   userUid: "uid_del_owner_en_api2",
 *   authorUsername: "username",
 * }
 *
 * Body (opcional, con defaults):
 * {
 *   colors: { primary: "#FF6B6B", secondary: "#4ECDC4" },
 *   branding: { logo: "https://...", favicon: "https://..." },
 *   info: { timezone: "Europe/Madrid" },
 *   gcpProjectId: "miweboda-app",    // default: "${development}-app"
 *   skipFirebase: false,             // true = no crear Firebase (usar uno existente)
 *   skipVercel: false,               // true = no añadir dominio en Vercel
 *   firebaseConfig: { ... },         // si skipFirebase=true, proporcionar config manual
 * }
 */
router.post('/tenant/provision', requireAdmin, async (req: Request, res: Response) => {
  const {
    development,
    name,
    domain,
    ownerEmail,
    userUid,
    authorUsername,
    colors = {},
    branding = {},
    info = {},
    gcpProjectId,
    skipFirebase = false,
    skipVercel = false,
    firebaseConfig: manualFirebaseConfig = null,
  } = req.body;

  // ── Validaciones ────────────────────────────────────────────────────────────
  if (!development || !name || !domain || !userUid) {
    return res.status(400).json({
      success: false,
      error: 'Campos requeridos: development, name, domain, userUid'
    });
  }
  if (!/^[a-z0-9-]+$/.test(development)) {
    return res.status(400).json({
      success: false,
      error: 'development solo puede contener letras minúsculas, números y guiones'
    });
  }

  const existing = await Whitelabel.findOne({ $or: [{ development }, { slug: development }] });
  if (existing) {
    return res.status(409).json({ success: false, error: `Tenant '${development}' ya existe` });
  }

  const projectId = gcpProjectId || `${development}-app`;
  const billingAccountId = process.env.GOOGLE_BILLING_ACCOUNT_ID;
  const log: string[] = [];

  try {
    const {
      createGCPProject,
      addFirebaseToProject,
      enableEmailPasswordAuth,
      createFirebaseWebApp,
      createTenantServiceAccount,
      createTestUser,
      addDomainToVercel,
    } = await import('../services/whitelabel-provisioner.service');

    let firebaseConfig: any = manualFirebaseConfig;
    let serviceAccountJson: string | null = null;
    let testUser: any = null;

    // ── 1-4. Crear proyecto Firebase ──────────────────────────────────────────
    if (!skipFirebase && !manualFirebaseConfig) {
      if (!billingAccountId) {
        return res.status(500).json({
          success: false,
          error: 'GOOGLE_BILLING_ACCOUNT_ID no configurado en .env de api2'
        });
      }

      log.push(`Creando proyecto GCP: ${projectId}...`);
      await createGCPProject({ projectId, displayName: name, billingAccountId });
      log.push('✓ Proyecto GCP creado');

      log.push('Añadiendo Firebase al proyecto...');
      await addFirebaseToProject(projectId);
      log.push('✓ Firebase añadido');

      log.push('Habilitando Email/Password Auth...');
      await enableEmailPasswordAuth(projectId);
      log.push('✓ Auth habilitado');

      log.push('Creando Web App Firebase...');
      firebaseConfig = await createFirebaseWebApp({ projectId, displayName: name, domain });
      log.push('✓ Web App Firebase creada');

      log.push('Creando service account del tenant...');
      serviceAccountJson = await createTenantServiceAccount({ projectId, development });
      log.push('✓ Service account creada');

    } else if (skipFirebase && manualFirebaseConfig) {
      log.push('Firebase: usando config manual proporcionada');
    }

    // ── 5. Crear usuario de test ───────────────────────────────────────────────
    if (serviceAccountJson) {
      log.push('Creando usuario de test...');
      testUser = await createTestUser({ development, serviceAccountJson });
      log.push(`✓ Usuario de test: ${testUser.email}`);
    }

    // ── 6. Añadir dominio en Vercel ───────────────────────────────────────────
    let vercelResult: any = null;
    if (!skipVercel) {
      log.push(`Añadiendo ${domain} en Vercel...`);
      vercelResult = await addDomainToVercel(domain);
      log.push(vercelResult.skipped ? '⚠ Vercel: skipped (faltan env vars)' : '✓ Dominio Vercel añadido');
    }

    // ── 7. Guardar en MongoDB ─────────────────────────────────────────────────
    log.push('Guardando en MongoDB...');
    const doc = await Whitelabel.create({
      name,
      slug: development,
      domain,
      development,
      userUid,
      authorUsername,
      status: true,
      isActive: true,
      firebase: firebaseConfig || {},
      colors,
      branding,
      info: { timezone: 'Europe/Madrid', active: true, ...info },
      // Service account guardada en MongoDB (cifrada en producción ideal)
      // Si quieres cifrado: usar KMS de Google o AWS Secrets Manager
      developer: {
        id: userUid,
        name: authorUsername,
        email: ownerEmail,
        permissions: ['read', 'write'],
        isEnabled: true,
      },
      features: {
        events: true, users: true, business: true, posts: true,
        categories: true, filters: true, groups: true, viewConfig: true
      },
      settings: {
        jwtSecret: crypto.randomBytes(32).toString('hex'),
        corsOrigin: [`https://${domain}`, `https://www.${domain}`],
        userSharing: true
      },
      limits: { maxUsers: 1000, maxEvents: 500 },
    });

    // Guardar service account en campo separado (no expuesto en GraphQL)
    if (serviceAccountJson) {
      await Whitelabel.updateOne(
        { _id: doc._id },
        { $set: { 'auth.metadata.firebase_service_account': serviceAccountJson } }
      );
    }

    log.push('✓ Guardado en MongoDB');

    // ── Respuesta ─────────────────────────────────────────────────────────────
    return res.status(201).json({
      success: true,
      development,
      tenantId: doc._id,
      gcpProjectId: skipFirebase ? null : projectId,
      firebase: firebaseConfig ? {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        // No devolver apiKey en la respuesta (aunque es pública, es mejor no)
      } : null,
      vercel: vercelResult,
      testUser: testUser ? {
        email: testUser.email,
        uid: testUser.uid,
        // customToken solo se genera aquí al crear, luego usar /api/dev/auth-token/:development
        customToken: testUser.customToken,
      } : null,
      log,
      nextSteps: [
        `DNS: Apunta ${domain} → CNAME → cname.vercel-dns.com`,
        `Copilot SK: Añade la service key del copilot para este tenant vía GraphQL`,
        `Dev login: GET /api/dev/auth-token/${development} con x-dev-secret`,
        `Test: curl https://apiapp.bodasdehoy.com/api/public/tenant/${development}`,
      ],
    });

  } catch (error: any) {
    console.error('[admin-tenant/provision] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      log,
      hint: 'Revisa los logs del servidor para más detalles.'
    });
  }
});

/**
 * GET /api/dev/auth-token/:development
 *
 * Genera un custom token de Firebase para el usuario de test.
 * Solo activo en entornos no-producción (o si ALLOW_DEV_AUTH=true).
 *
 * Headers: x-dev-secret: <DEV_AUTH_SECRET del .env>
 */
router.get('/dev/auth-token/:development', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_AUTH) {
    return res.status(404).json({ success: false });
  }

  const secret = req.headers['x-dev-secret'];
  if (!secret || secret !== process.env.DEV_AUTH_SECRET) {
    return res.status(403).json({ success: false, error: 'Acceso denegado' });
  }

  const { development } = req.params;

  // Obtener service account de MongoDB
  const doc = await Whitelabel.findOne({
    $or: [{ development }, { slug: development }]
  }).lean();

  if (!doc) {
    return res.status(404).json({ success: false, error: `Tenant no encontrado: ${development}` });
  }

  const serviceAccountJson = (doc as any).auth?.metadata?.firebase_service_account;
  if (!serviceAccountJson) {
    return res.status(503).json({
      success: false,
      error: `No hay service account para ${development}. Ejecuta el provisioning primero.`
    });
  }

  const { createTestUser } = await import('../services/whitelabel-provisioner.service');
  const testUser = await createTestUser({ development, serviceAccountJson });

  return res.json({
    success: true,
    development,
    token: testUser.customToken,
    uid: testUser.uid,
    email: testUser.email,
    expiresIn: '3600s',
    usage: `signInWithCustomToken(firebaseAuth, token)`,
  });
});

export default router;
```

Registrar en `/var/www/api-production/src/index.ts`:
```typescript
import adminTenantRouter from './routes/admin-tenant';
// En la sección de rutas:
this.app.use('/api/admin', adminTenantRouter);
this.app.use('/api', adminTenantRouter); // para /api/dev/auth-token/:development
```

---

## PARTE E — Variables de entorno requeridas en api2

Añadir a `/var/www/api-production/.env`:

```bash
# ── Google Cloud ────────────────────────────────────────────────────────────
# ID de la billing account (gcloud billing accounts list)
GOOGLE_BILLING_ACCOUNT_ID=012345-ABCDEF-123456

# ── Vercel ──────────────────────────────────────────────────────────────────
# vercel.com/account/tokens → crear token con scope "Full Account"
VERCEL_API_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Vercel dashboard → Project Settings → General → Project ID
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── Dev Auth ────────────────────────────────────────────────────────────────
# openssl rand -hex 32
DEV_AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Poner en true si NODE_ENV=production pero se necesita dev auth (pre-prod)
# ALLOW_DEV_AUTH=true
```

Añadir también a `apps/web/.env.development.local.example` (en el monorepo):
```bash
# Secret para el botón "Dev Login" en apps/web (mismo valor que DEV_AUTH_SECRET en api2)
NEXT_PUBLIC_DEV_AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# URL de api2 (en local apunta al tunnel o al servidor directo)
NEXT_PUBLIC_API2_URL=https://apiapp.bodasdehoy.com
```

---

## PARTE F — Poblar Firebase configs de los 11 tenants existentes en MongoDB

Los tenants actuales se crearon antes de este sistema. Hay que poblar su `firebase` config.

Ejecutar en mongosh (`mongosh "$(grep MONGODB_URI /var/www/api-production/.env | cut -d= -f2-)"`):

```javascript
const configs = [
  { d: 'bodasdehoy',          apiKey: 'AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM', projectId: 'bodasdehoy-1063',                      authDomain: 'bodasdehoy-1063.firebaseapp.com',                      storageBucket: 'bodasdehoy-1063.appspot.com',                      mid: '593952495916', appId: '1:593952495916:web:c63cf15fd16a6796f6f489' },
  { d: 'eventosplanificador',  apiKey: 'AIzaSyA_BIthVz_uwQR7gObnKPjI2KincIvP5lo', projectId: 'eventosplanificador-74e59',              authDomain: 'eventosplanificador-74e59.firebaseapp.com',              storageBucket: 'eventosplanificador-74e59.appspot.com',              mid: '1087923505585', appId: '1:1087923505585:web:7573effc0a8663d5429590' },
  { d: 'eventosorganizador',   apiKey: 'AIzaSyD3O0Nb4du1DPZod-6ZGpzw4jLGjXXKKUI', projectId: 'eventosorganizador-2ed10',               authDomain: 'eventosorganizador-2ed10.firebaseapp.com',               storageBucket: null,                                                  mid: '492151341830',  appId: '1:492151341830:web:35178ccf72d2dbcf6d1487' },
  { d: 'vivetuboda',           apiKey: 'AIzaSyCkj2D1mO-jdMUDwAQVL7tXCGuNusT5ubc', projectId: 'vivetuboda-l',                           authDomain: 'vivetuboda-l.firebaseapp.com',                           storageBucket: 'vivetuboda-l.appspot.com',                            mid: '209046290590',  appId: '1:209046290590:web:db0fbe47c3963ddd143b8f' },
  { d: 'champagne-events',     apiKey: 'AIzaSyAhDpYfpElzfl-RNP9Tyz7GTaF5N_hHKlA', projectId: 'champagne-events-mx',                   authDomain: 'champagne-events-mx.firebaseapp.com',                   storageBucket: 'champagne-events-mx.appspot.com',                    mid: '70019683977',   appId: '1:70019683977:web:10648516be16afd5879858' },
  { d: 'annloevents',          apiKey: 'AIzaSyC9mUmQ_wiIu-itBfgSlVNLdzRcZbjI3MM', projectId: 'annloevents-app',                        authDomain: 'annloevents-app.firebaseapp.com',                        storageBucket: 'annloevents-app.firebasestorage.app',                 mid: '204540888172',  appId: '1:204540888172:web:2f174c646cb822116f0449' },
  { d: 'miamorcitocorazon',    apiKey: 'AIzaSyABo01h3OYGUa-edeknZ2-F1b3ltGudbYo', projectId: 'miamorcitocorazon-planificador',          authDomain: 'miamorcitocorazon-planificador.firebaseapp.com',          storageBucket: 'miamorcitocorazon-planificador.firebasestorage.app', mid: '621496856930',  appId: '1:621496856930:web:87aa45e6977b3ea2813c3b' },
  { d: 'eventosintegrados',    apiKey: 'AIzaSyD2oie-ze53bnkwGs84O07dg-vooDnLY-g', projectId: 'eventosintegrados-app',                  authDomain: 'eventosintegrados-app.firebaseapp.com',                  storageBucket: 'eventosintegrados-app.firebasestorage.app',          mid: '251095054818',  appId: '1:251095054818:web:ad74627e3112f20504a1bb' },
  { d: 'ohmaratilano',         apiKey: 'AIzaSyDgog0QuV2ZAduEGYroBUoDp_COwgh-ePc', projectId: 'ohmaratilano-app',                       authDomain: 'ohmaratilano-app.firebaseapp.com',                       storageBucket: 'ohmaratilano-app.firebasestorage.app',               mid: '834371259019',  appId: '1:834371259019:web:dd8d6a7bf21a4e4e56228e' },
  { d: 'corporativozr',        apiKey: 'AIzaSyCyNPFSVkh7u7JkiYYI2oHzSSnIKok5JpE', projectId: 'corporativozr-app',                      authDomain: 'corporativozr-app.firebaseapp.com',                      storageBucket: 'corporativozr-app.firebasestorage.app',              mid: '798723721379',  appId: '1:798723721379:web:3c13e3999ab357f1fad716' },
  { d: 'theweddingplanner',    apiKey: 'AIzaSyDaJcojMTSdMkjxCLY3rEtL0Htf51sFUik', projectId: 'theweddingplanner-app',                  authDomain: 'theweddingplanner-app.firebaseapp.com',                  storageBucket: 'theweddingplanner-app.firebasestorage.app',          mid: '557540930291',  appId: '1:557540930291:web:518494e9c89789ffbcfd86' },
];

for (const c of configs) {
  const r = db.whitelabels.updateOne(
    { $or: [{ development: c.d }, { slug: c.d }] },
    { $set: { firebase: { apiKey: c.apiKey, authDomain: c.authDomain, projectId: c.projectId, storageBucket: c.storageBucket, messagingSenderId: c.mid, appId: c.appId } } }
  );
  print(`${c.d}: matched=${r.matchedCount} modified=${r.modifiedCount}`);
}
```

---

## PARTE G — Verificación

```bash
# 1. Firebase configs poblados
curl -s https://apiapp.bodasdehoy.com/api/public/tenant/vivetuboda | python3 -m json.tool
# → firebase.projectId: "vivetuboda-l"

# 2. Provisionar tenant nuevo (con Firebase automático)
curl -s -X POST https://apiapp.bodasdehoy.com/api/admin/tenant/provision \
  -H "x-master-key: TU_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "development": "miweboda",
    "name": "Mi WebBoda",
    "domain": "miweboda.com",
    "ownerEmail": "owner@miweboda.com",
    "userUid": "uid_del_owner",
    "authorUsername": "owner",
    "colors": { "primary": "#FF6B6B", "secondary": "#4ECDC4" }
  }'
# → { success: true, gcpProjectId: "miweboda-app", testUser: { email: "dev-test@miweboda.internal", ... } }

# 3. Dev login (para desarrolladores)
curl -s https://apiapp.bodasdehoy.com/api/dev/auth-token/miweboda \
  -H "x-dev-secret: TU_DEV_SECRET"
# → { success: true, token: "eyJ...", email: "dev-test@miweboda.internal" }

# 4. Provisionar con Firebase existente (si el tenant ya tiene Firebase)
curl -s -X POST https://apiapp.bodasdehoy.com/api/admin/tenant/provision \
  -H "x-master-key: TU_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "development": "otrotenant",
    "name": "Otro Tenant",
    "domain": "otrotenant.com",
    "userUid": "uid",
    "authorUsername": "admin",
    "skipFirebase": true,
    "firebaseConfig": {
      "apiKey": "AIza...",
      "authDomain": "otrotenant.firebaseapp.com",
      "projectId": "otrotenant",
      "storageBucket": "otrotenant.appspot.com",
      "messagingSenderId": "123456",
      "appId": "1:123456:web:abc"
    }
  }'
```

---

## Resumen de prioridades para el agente

| # | Parte | Prioridad | Tiempo estimado |
|---|---|---|---|
| F | Script mongosh — poblar firebase configs 11 tenants | 🔴 15 min | Hacer primero |
| E | Variables de entorno en api2 | 🔴 15 min | Prerequisito para todo |
| A | Service account maestra en Google Cloud | 🔴 30 min | Prerequisito para Firebase automático |
| B | `npm install firebase-admin googleapis` | 🔴 5 min | — |
| C | Crear `whitelabel-provisioner.service.ts` | 🟡 2-3h | Núcleo del sistema |
| D | Crear `admin-tenant.ts` y registrar rutas | 🟡 1h | El endpoint final |
