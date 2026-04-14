/**
 * e2e-app/lib/memories-api.ts
 *
 * Cliente HTTP directo para la API de Memories (api-ia.bodasdehoy.com).
 * Usa el APIRequestContext de Playwright — llamadas server-side, sin CORS, sin browser.
 *
 * La API usa `user_id` como parámetro de autenticación (email del usuario).
 *
 * Uso:
 *   import { buildMemoriesApi } from './lib/memories-api';
 *   const api = buildMemoriesApi(request, 'bodasdehoy.com@gmail.com');
 *   const { albums } = await api.listAlbums();      // { success, albums }
 *   const { album }  = await api.createAlbum(...);  // { success, album: { _id, name, ... } }
 */

import type { APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ─── Constantes ───────────────────────────────────────────────────────────────

export const MEMORIES_DIRECT_URL =
  process.env.MEMORIES_API_URL || 'https://api-ia.bodasdehoy.com';

export const MEMORIES_DEVELOPMENT = 'bodasdehoy';

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDVMoVLWWvolofYOcTYA0JZ0QHyng72LAM';

// Cache de tokens para no re-autenticar en cada test
const _tokenCache = new Map<string, { idToken: string; expiresAt: number }>();

/**
 * Obtiene un Firebase ID token para el usuario dado vía la REST API de Firebase.
 * Cachea el token ~50 min (caduca a los 60).
 */
export async function getFirebaseIdToken(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string | null> {
  const cached = _tokenCache.get(email);
  if (cached && Date.now() < cached.expiresAt) return cached.idToken;

  const res = await request.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      data: { email, password, returnSecureToken: true },
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!res.ok()) return null;
  const { idToken } = await res.json();
  if (!idToken) return null;

  _tokenCache.set(email, { idToken, expiresAt: Date.now() + 50 * 60_000 });
  return idToken;
}

// ─── Tipos de respuesta ───────────────────────────────────────────────────────

export interface Album {
  _id: string;
  /** Slug-style ID usado por write ops (delete, share-link). Ej: "alb_abc123" */
  album_id?: string;
  name: string;
  description?: string;
  mediaCount: number;
  memberCount: number;
  ownerId: string;
  createdAt: string;
  [key: string]: any;
}

export interface AlbumMedia {
  _id: string;
  albumId: string;
  mediaType: 'photo' | 'video';
  originalUrl: string;
  thumbnailUrl: string;
  createdAt: string;
  [key: string]: any;
}

export interface Member {
  userId: string;
  email: string;
  role: string;
  [key: string]: any;
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildMemoriesApi(
  request: APIRequestContext,
  userId: string,
  development = MEMORIES_DEVELOPMENT,
  idToken?: string,
) {
  const base = `${MEMORIES_DIRECT_URL}/api/memories`;
  const authParams = `user_id=${encodeURIComponent(userId)}&development=${development}`;
  const devParam = `development=${development}`;

  // Adds Bearer token to headers when idToken is available (required for write operations)
  const withAuth = (headers: Record<string, string> = {}): Record<string, string> =>
    idToken ? { ...headers, Authorization: `Bearer ${idToken}` } : headers;

  return {
    /** Lista todos los álbumes del usuario. */
    async listAlbums(): Promise<{ success: boolean; albums: Album[] }> {
      const res = await request.get(`${base}/albums?${authParams}`);
      return res.json();
    },

    /** Obtiene un álbum por su ID. Devuelve success:false si no existe. */
    async getAlbum(albumId: string): Promise<{ success: boolean; album: Album | null }> {
      const res = await request.get(`${base}/albums/${albumId}?${authParams}`);
      if (res.status() === 404) return { success: false, album: null };
      return res.json();
    },

    /** Crea un álbum nuevo. Devuelve el álbum creado con su _id real. */
    async createAlbum(
      data: { name: string; description?: string; albumType?: string },
    ): Promise<{ success: boolean; album: Album | null }> {
      const res = await request.post(`${base}/albums?${authParams}`, {
        data: { albumType: 'general', ...data },
        headers: withAuth({ 'Content-Type': 'application/json' }),
      });
      return res.json();
    },

    /** Elimina un álbum. */
    async deleteAlbum(albumId: string): Promise<{ success: boolean }> {
      const res = await request.delete(`${base}/albums/${albumId}?${authParams}`, {
        headers: withAuth(),
      });
      if (res.status() === 404) return { success: true }; // ya no existe — OK para cleanup
      return res.json();
    },

    /** Lista los medios de un álbum. */
    async listMedia(albumId: string): Promise<{ success: boolean; media: AlbumMedia[] }> {
      const res = await request.get(`${base}/albums/${albumId}/media?${authParams}`);
      return res.json();
    },

    /**
     * Sube una foto al álbum usando multipart/form-data.
     * `imagePath` debe ser una ruta absoluta a un fichero de imagen válido.
     */
    async uploadMedia(
      albumId: string,
      imagePath: string,
    ): Promise<{ success: boolean; media: AlbumMedia | null }> {
      const fileContent = fs.readFileSync(imagePath);
      const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
      const fileName = path.basename(imagePath);

      const res = await request.post(`${base}/albums/${albumId}/upload?${authParams}`, {
        multipart: {
          file: {
            buffer: fileContent,
            mimeType,
            name: fileName,
          },
        },
        headers: withAuth(),
      });
      return res.json();
    },

    /** Lista los miembros de un álbum. */
    async listMembers(albumId: string): Promise<{ success: boolean; members: Member[] }> {
      const res = await request.get(`${base}/albums/${albumId}/members?${devParam}`);
      return res.json();
    },

    /**
     * Invita a un usuario al álbum.
     * Devuelve el token de invitación si tiene éxito.
     */
    async inviteMember(
      albumId: string,
      email: string,
      role = 'viewer',
    ): Promise<{ success: boolean; token: string | null }> {
      const res = await request.post(`${base}/albums/${albumId}/invite?${authParams}`, {
        data: { email, role },
        headers: withAuth({ 'Content-Type': 'application/json' }),
      });
      const result = await res.json();
      return { success: result.success, token: result.invitation?.token ?? null };
    },

    /** Genera un link de compartir y devuelve shareToken + shareUrl. */
    async generateShareLink(
      albumId: string,
      expiresInDays = 7,
    ): Promise<{ success: boolean; shareToken: string | null; shareUrl: string | null }> {
      const res = await request.post(`${base}/albums/${albumId}/share-link?${authParams}`, {
        data: { expires_in_days: expiresInDays, permissions: 'view' },
        headers: withAuth({ 'Content-Type': 'application/json' }),
      });
      const result = await res.json();
      return {
        success: result.success,
        shareToken: result.share_token ?? null,
        shareUrl: result.share_url ?? null,
      };
    },

    /** Accede al álbum público por shareToken (sin autenticación). */
    async getPublicAlbum(
      shareToken: string,
    ): Promise<{ success: boolean; album: Album | null; media: AlbumMedia[] }> {
      const res = await request.get(`${base}/public/${shareToken}?${devParam}`);
      if (!res.ok()) return { success: false, album: null, media: [] };
      return res.json();
    },
  };
}

// ─── Imagen de prueba ─────────────────────────────────────────────────────────

/**
 * Devuelve la ruta a una imagen de prueba válida (PNG 1×1 real).
 * La crea en /tmp si no existe.
 */
export function getTestImagePath(): string {
  // Usar JPEG real si está disponible
  const realJpeg = path.join(os.homedir(), 'Downloads', 'descarga.jpeg');
  if (fs.existsSync(realJpeg)) {
    const tmp = path.join(os.tmpdir(), 'e2e-memories-test.jpeg');
    fs.copyFileSync(realJpeg, tmp);
    return tmp;
  }

  // PNG 1×1 real (no placeholder)
  const tmpPng = path.join(os.tmpdir(), 'e2e-memories-test.png');
  const pngBytes = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a' +
    '49444154789c6260000000000200012dd41de00000000049454e44ae426082',
    'hex',
  );
  fs.writeFileSync(tmpPng, pngBytes);
  return tmpPng;
}
