/**
 * AuthBridge - Puente de autenticacion entre AppBodasdeHoy y Lobe-Chat
 *
 * Sincroniza el estado de autenticacion de AppBodasdeHoy (Firebase + JWT + Session Cookies)
 * con el formato que Lobe-Chat espera (dev-user-config en localStorage)
 */

import Cookies from 'js-cookie';
import { developments, DevelopmentConfig } from '../types/developments';

export interface SharedAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role?: string[];
}

export interface SharedAuthState {
  user: SharedAuthUser | null;
  development: string;
  config: DevelopmentConfig | null;
  sessionCookie: string | null;
  idToken: string | null;
  isAuthenticated: boolean;
}

export interface AuthBridgeConfig {
  onAuthStateChanged?: (state: SharedAuthState) => void;
  development?: string;
}

/**
 * Parsea un JWT sin validar la firma
 * Usado para extraer informacion del token de Firebase/Session
 */
export const parseJwt = (token: string): any => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

class AuthBridge {
  private static instance: AuthBridge;
  private listeners: Set<(state: SharedAuthState) => void> = new Set();
  private currentState: SharedAuthState | null = null;

  private constructor() {}

  static getInstance(): AuthBridge {
    if (!AuthBridge.instance) {
      AuthBridge.instance = new AuthBridge();
    }
    return AuthBridge.instance;
  }

  /**
   * Detecta el development (tenant) basado en el hostname
   */
  private detectDevelopment(hostname: string): string {
    // Buscar en la lista de developments
    for (const dev of developments) {
      if (hostname.includes(dev.development)) {
        return dev.development;
      }
    }

    // Extraer del dominio
    const parts = hostname.split('.');
    const idx = parts.findIndex(p => p === 'com' || p === 'mx');
    if (idx > 0) {
      return parts[idx - 1];
    }

    return 'bodasdehoy'; // Default
  }

  /**
   * Obtiene la configuracion de desarrollo desde localStorage (guardada por Lobe-Chat)
   */
  private getDevUserConfig(): any {
    if (typeof window === 'undefined') return null;
    try {
      const config = localStorage.getItem('dev-user-config');
      return config ? JSON.parse(config) : null;
    } catch {
      return null;
    }
  }

  /**
   * Retorna un estado vacio cuando no hay autenticacion
   */
  private getEmptyState(): SharedAuthState {
    return {
      user: null,
      development: 'bodasdehoy',
      config: null,
      sessionCookie: null,
      idToken: null,
      isAuthenticated: false,
    };
  }

  /**
   * Obtener el estado de autenticacion actual de AppBodasdeHoy
   * Lee cookies y localStorage para determinar el estado
   */
  getSharedAuthState(): SharedAuthState {
    if (typeof window === 'undefined') {
      return this.getEmptyState();
    }

    // Detectar development desde el dominio
    const hostname = window.location.hostname;
    const development = this.detectDevelopment(hostname);
    const config = developments.find(d => d.development === development) || null;

    // Obtener session cookie
    const sessionCookie = config ? Cookies.get(config.cookie) : null;
    const idToken = Cookies.get('idTokenV0.1.0');

    // Parsear el JWT para obtener informacion del usuario
    const sessionPayload = parseJwt(sessionCookie || '');

    // Obtener datos adicionales de localStorage (guardados por Lobe-Chat)
    const devUserConfig = this.getDevUserConfig();

    const isAuthenticated = !!(sessionPayload?.user_id || devUserConfig?.userId);

    return {
      user: isAuthenticated ? {
        uid: sessionPayload?.user_id || devUserConfig?.userId || '',
        email: devUserConfig?.user_data?.email || localStorage.getItem('user_email'),
        displayName: devUserConfig?.user_data?.displayName || localStorage.getItem('user_display_name'),
        photoURL: localStorage.getItem('user_photo_url'),
        phoneNumber: devUserConfig?.user_data?.phoneNumber || null,
        role: devUserConfig?.user_data?.role,
      } : null,
      development: devUserConfig?.development || development,
      config,
      sessionCookie,
      idToken,
      isAuthenticated,
    };
  }

  /**
   * Sincronizar estado de auth de AppBodasdeHoy a Lobe-Chat
   * Guarda en formato que setExternalChatConfig espera
   */
  async syncAuthToLobechat(state: SharedAuthState): Promise<void> {
    if (typeof window === 'undefined') return;

    if (!state.isAuthenticated || !state.user) {
      console.log('[AuthBridge] Usuario no autenticado, no sincronizando');
      return;
    }

    // Guardar configuracion en formato que Lobe-Chat espera
    const configToSave = {
      developer: state.development,
      development: state.development,
      timestamp: Date.now(),
      token: state.idToken,
      userId: state.user.email || state.user.uid,
      user_data: {
        displayName: state.user.displayName,
        email: state.user.email,
        phoneNumber: state.user.phoneNumber,
        photoURL: state.user.photoURL,
        role: state.user.role,
      },
      user_type: 'registered' as const,
    };

    localStorage.setItem('dev-user-config', JSON.stringify(configToSave));

    // Guardar tokens individuales para compatibilidad
    if (state.idToken) {
      localStorage.setItem('jwt_token', state.idToken);
      localStorage.setItem('api2_jwt_token', state.idToken);
    }

    if (state.user.email) {
      localStorage.setItem('user_email', state.user.email);
    }
    if (state.user.uid) {
      localStorage.setItem('user_uid', state.user.uid);
    }
    if (state.user.displayName) {
      localStorage.setItem('user_display_name', state.user.displayName);
    }

    console.log('[AuthBridge] Auth sincronizado a Lobe-Chat format');
  }

  /**
   * Suscribirse a cambios de autenticacion
   */
  subscribe(callback: (state: SharedAuthState) => void): () => void {
    this.listeners.add(callback);

    // Emitir estado actual inmediatamente
    const currentState = this.getSharedAuthState();
    callback(currentState);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notificar a todos los listeners de un cambio de estado
   */
  notifyStateChange(state: SharedAuthState): void {
    this.currentState = state;
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Sincronizar desde Firebase Auth cuando cambia el estado
   * Este metodo debe ser llamado desde AuthContext de AppBodasdeHoy
   */
  async syncFromFirebaseUser(
    user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null; phoneNumber: string | null; getIdToken: () => Promise<string> } | null,
    config: DevelopmentConfig
  ): Promise<void> {
    if (!user) {
      this.notifyStateChange(this.getEmptyState());
      return;
    }

    const idToken = await user.getIdToken();
    const sessionCookie = Cookies.get(config.cookie);

    const state: SharedAuthState = {
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
      },
      development: config.development,
      config,
      sessionCookie: sessionCookie || null,
      idToken,
      isAuthenticated: true,
    };

    await this.syncAuthToLobechat(state);
    this.notifyStateChange(state);
  }

  /**
   * Limpiar estado de autenticacion (logout)
   */
  clearAuth(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('dev-user-config');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('api2_jwt_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_uid');
    localStorage.removeItem('user_display_name');

    this.notifyStateChange(this.getEmptyState());
  }
}

export const authBridge = AuthBridge.getInstance();
export default authBridge;
