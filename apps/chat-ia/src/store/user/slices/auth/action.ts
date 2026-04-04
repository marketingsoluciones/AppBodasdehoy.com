import { StateCreator } from 'zustand/vanilla';

import { enableAuth, enableClerk, enableNextAuth } from '@/const/auth';

import type { UserStore } from '../../store';

export interface UserAuthAction {
  enableAuth: () => boolean;
  /**
   * universal logout method
   */
  logout: () => Promise<void>;
  /**
   * universal login method
   */
  openLogin: () => Promise<void>;
}

export const createAuthSlice: StateCreator<
  UserStore,
  [['zustand/devtools', never]],
  [],
  UserAuthAction
> = (set, get) => ({
  enableAuth: () => {
    return enableAuth;
  },
  logout: async () => {
    if (enableClerk) {
      get().clerkSignOut?.({ redirectUrl: location.toString() });

      return;
    }

    if (enableNextAuth) {
      const { signOut } = await import('next-auth/react');
      signOut();
      return;
    }

    // ✅ CUSTOM LOGOUT: Limpiar TODOS los datos del usuario y redirigir
    console.log('🚪 Cerrando sesión personalizada - limpieza completa...');

    // 0. Cerrar sesión de Firebase (crítico — si no, onAuthStateChanged sigue activo
    //    y useTokenRefresh restaura dev-user-config desde la sesión Firebase activa)
    try {
      const { getAuth, signOut: firebaseSignOut } = await import('firebase/auth');
      const auth = getAuth();
      await firebaseSignOut(auth);
      console.log('✅ Firebase signOut completado');
    } catch (error) {
      console.warn('⚠️ Error cerrando sesión Firebase:', error);
    }

    // 1. Limpiar todas las sesiones/conversaciones del usuario anterior
    try {
      const { useSessionStore } = await import('@/store/session');
      const sessionStore = useSessionStore.getState();
      await sessionStore.clearSessions();
      console.log('✅ Sesiones/conversaciones limpiadas');
    } catch (error) {
      console.warn('⚠️ Error limpiando sesiones:', error);
    }

    // 2. Limpiar todos los topics (panel derecho)
    try {
      const { useChatStore } = await import('@/store/chat');
      const chatStore = useChatStore.getState();
      await chatStore.removeAllTopics();
      console.log('✅ Topics limpiados');
    } catch (error) {
      console.warn('⚠️ Error limpiando topics:', error);
    }

    // 3. Limpiar IndexedDB (LOBE_CHAT_DB y otras bases de datos)
    try {
      const dbNames = ['LOBE_CHAT_DB', 'LOBE_CHAT_CHAT_GROUP_STORE', 'keyval-store'];
      for (const dbName of dbNames) {
        try {
          // Intentar borrar cada base de datos
          const deleteRequest = indexedDB.deleteDatabase(dbName);
          deleteRequest.onsuccess = () => console.log(`✅ IndexedDB ${dbName} eliminada`);
          deleteRequest.onerror = () => console.warn(`⚠️ Error eliminando IndexedDB ${dbName}`);
        } catch {
          // Silently ignore if database doesn't exist
        }
      }
      console.log('✅ IndexedDB limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando IndexedDB:', error);
    }

    // 4. Limpiar TODAS las keys de localStorage que empiezan con LOBE_
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('LOBE_') || key.startsWith('lobe-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      console.log(`✅ ${keysToRemove.length} keys LOBE_* eliminadas de localStorage`);
    } catch (error) {
      console.warn('⚠️ Error limpiando localStorage LOBE_*:', error);
    }

    // 5. Limpiar keys específicas de autenticación
    try {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('dev-user-config');
      localStorage.removeItem('invite-token');
      localStorage.removeItem('whitelabel_logo');
      localStorage.removeItem('LOBE_SETTINGS');
      localStorage.removeItem('LOBE_SYSTEM_STATUS');
      console.log('✅ Keys de autenticación limpiadas');
    } catch (error) {
      console.warn('⚠️ Error limpiando keys de auth:', error);
    }

    // 6. Limpiar sessionStorage completo
    try {
      sessionStorage.clear();
      console.log('✅ SessionStorage limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando sessionStorage:', error);
    }

    // 7. Limpiar estado del usuario en zustand
    try {
      set({
        isLoaded: false,
        isSignedIn: false,
        user: undefined,
      });
      console.log('✅ Estado de usuario limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando estado:', error);
    }

    // 8. Limpiar estado de chat en memoria (conversaciones externas, etc.)
    // No llamar a setExternalChatConfig aquí — escribe dev-user-config en localStorage
    // y lo haríamos al revés de la limpieza del paso 5. La página redirige a /login inmediatamente.
    try {
      set({
        currentUserId: undefined,
        externalChats: [],
        externalChatsInit: false,
        userApiConfigs: undefined,
        userEvents: undefined,
        userProfile: undefined,
      } as any);

      console.log('✅ Estado de chat externo limpiado');
    } catch (error) {
      console.warn('⚠️ Error limpiando estado de chat:', error);
    }

    // 9. Limpiar cookies relacionadas (si existen)
    try {
      document.cookie.split(';').forEach((c) => {
        const cookieName = c.trim().split('=')[0];
        if (cookieName.startsWith('LOBE') || cookieName === 'auth') {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      console.log('✅ Cookies limpiadas');
    } catch (error) {
      console.warn('⚠️ Error limpiando cookies:', error);
    }

    // 10. Limpiar dev-user-config DESPUÉS de setExternalChatConfig (paso 8 lo re-escribe)
    try {
      localStorage.removeItem('dev-user-config');
      localStorage.removeItem('api2_jwt_token');
      localStorage.removeItem('api2_jwt_expires_at');
      localStorage.removeItem('user_uid');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_display_name');
      localStorage.removeItem('user_photo_url');
      document.cookie = 'dev-user-config=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
      document.cookie = 'idTokenV0.1.0=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.bodasdehoy.com; SameSite=Lax';
      console.log('✅ dev-user-config y tokens de usuario eliminados');
    } catch (error) {
      console.warn('⚠️ Error en limpieza final:', error);
    }

    console.log('🔄 Logout completo. Redirigiendo a /login...');

    // Pequeño delay para asegurar que IndexedDB termine de limpiarse
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Redirigir a página de login (window.location.href fuerza recarga completa)
    window.location.href = '/login';
  },
  openLogin: async () => {
    if (enableClerk) {
      const redirectUrl = location.toString();
      get().clerkSignIn?.({
        fallbackRedirectUrl: redirectUrl,
        signUpForceRedirectUrl: redirectUrl,
        signUpUrl: '/signup',
      });

      return;
    }

    if (enableNextAuth) {
      const { signIn } = await import('next-auth/react');
      // Check if only one provider is available
      const providers = get()?.oAuthSSOProviders;
      if (providers && providers.length === 1) {
        signIn(providers[0]);
        return;
      }
      signIn();
      return;
    }

    // ✅ FALLBACK: Redirigir a página de login personalizada cuando no hay Clerk/NextAuth
    console.log('🔑 Abriendo página de login personalizada...');
    window.location.href = '/login';
  },
});
