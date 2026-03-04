import { eq } from 'drizzle-orm';

import { clientDB } from '@/database/client/db';
import { MessageModel } from '@/database/models/message';
import { SessionModel } from '@/database/models/session';
import { UserModel } from '@/database/models/user';
import { users } from '@/database/schemas';
import { BaseClientService } from '@/services/baseClientService';
import { UserPreference } from '@/types/user';
import { AsyncLocalStorage } from '@/utils/localStorage';

import { IUserService } from './type';

export class ClientService extends BaseClientService implements IUserService {
  private preferenceStorage: AsyncLocalStorage<UserPreference>;

  private get userModel(): UserModel {
    return new UserModel(clientDB as any, this.userId);
  }
  private get messageModel(): MessageModel {
    return new MessageModel(clientDB as any, this.userId);
  }
  private get sessionModel(): SessionModel {
    return new SessionModel(clientDB as any, this.userId);
  }

  constructor(userId?: string) {
    super(userId);
    this.preferenceStorage = new AsyncLocalStorage('LOBE_PREFERENCE');
  }

  getUserRegistrationDuration: IUserService['getUserRegistrationDuration'] = async () => {
    return this.userModel.getUserRegistrationDuration();
  };

  getUserState: IUserService['getUserState'] = async () => {
    const totalStartTime = Date.now();
    console.log('🔐 [Auth] Iniciando inicialización de servicios de autenticación...');
    console.log(`  👤 UserId: ${this.userId}`);

    try {
      // ✅ OPTIMIZACIÓN ULTRA RÁPIDA: Timeouts más cortos y operaciones en paralelo
      const timeout = (ms: number) => new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout después de ${ms}ms`)), ms)
      );

      // ✅ 1. Verificar/crear usuario (debe ser rápido con findFirst optimizado)
      const step1Start = Date.now();
      console.log('  ⏱️ [1/4] Verificando/creando usuario...');
      await Promise.race([
        this.makeSureUserExist(),
        timeout(1000) // ✅ Reducido de 2s a 1s para carga más rápida
      ]).catch(() => {
        console.warn('  ⚠️ [1/4] Timeout en makeSureUserExist, continuando...');
      });
      console.log(`  ✅ [1/4] Usuario verificado (${Date.now() - step1Start}ms)`);

      // ✅ 2-4. Ejecutar operaciones en PARALELO para reducir tiempo total
      const parallelStart = Date.now();
      console.log('  ⏱️ [2-4/4] Ejecutando operaciones en paralelo...');

      const [state, messageCount, sessionCount, preference] = await Promise.allSettled([
        // Estado del usuario
        Promise.race([
          this.userModel.getUserState((encryptKeyVaultsStr) =>
            encryptKeyVaultsStr ? JSON.parse(encryptKeyVaultsStr) : {},
          ),
          timeout(1500) // ✅ Reducido de 2s a 1.5s para carga más rápida
        ]),
        // Contar mensajes
        Promise.race([
          this.messageModel.count(),
          timeout(800) // ✅ Reducido de 1s a 800ms
        ]),
        // Contar sesiones
        Promise.race([
          this.sessionModel.count(),
          timeout(800) // ✅ Reducido de 1s a 800ms
        ]),
        // Leer preferencias (rápido)
        Promise.race([
          this.preferenceStorage.getFromLocalStorage(),
          timeout(300) // ✅ Reducido de 500ms a 300ms
        ]).catch(() => ({} as any)),
      ]);

      const parallelTime = Date.now() - parallelStart;
      console.log(`  ✅ [2-4/4] Operaciones paralelas completadas en ${parallelTime}ms`);

      // Extraer resultados con fallbacks
      const userState = state.status === 'fulfilled' ? state.value : null;
      const msgCount = messageCount.status === 'fulfilled' ? messageCount.value : 0;
      const sessCount = sessionCount.status === 'fulfilled' ? sessionCount.value : 0;
      const userPreference = preference.status === 'fulfilled' ? preference.value : ({} as any);

      // Si no se pudo obtener el estado, retornar mínimo
      if (!userState) {
        console.warn('  ⚠️ No se pudo obtener estado del usuario, usando estado mínimo');
        const totalTime = Date.now() - totalStartTime;
        console.log(`🎉 [Auth] Servicios inicializados (estado mínimo) en ${totalTime}ms`);
        return {
          avatar: '',
          canEnablePWAGuide: false,
          canEnableTrace: false,
          email: '',
          firstName: '',
          fullName: '',
          hasConversation: msgCount > 0 || sessCount > 0,
          isOnboard: true,
          lastName: '',
          preference: userPreference,
          settings: {},
          subscriptionPlan: undefined,
          userId: this.userId || '',
          username: '',
        } as any;
      }

      const totalTime = Date.now() - totalStartTime;
      console.log(`🎉 [Auth] Servicios de autenticación inicializados en ${totalTime}ms`);

      return {
        ...userState,
        avatar: userState.avatar ?? '',
        canEnablePWAGuide: msgCount >= 4,
        canEnableTrace: msgCount >= 4,
        firstName: userState.firstName,
        fullName: userState.fullName,
        hasConversation: msgCount > 0 || sessCount > 0,
        isOnboard: true,
        lastName: userState.lastName,
        preference: userPreference,
        username: userState.username,
      };
    } catch (error) {
      const totalTime = Date.now() - totalStartTime;
      console.error(`❌ [Auth] Error después de ${totalTime}ms (retornando estado mínimo):`, error);
      // ✅ Retornar estado mínimo en lugar de fallar completamente
      return {
        avatar: '',
        canEnablePWAGuide: false,
        canEnableTrace: false,
        email: '',
        firstName: '',
        fullName: '',
        hasConversation: false,
        isOnboard: true,
        lastName: '',
        preference: {},
        settings: {},
        subscriptionPlan: undefined,
        userId: this.userId || '',
        username: '',
      } as any;
    }
  };

  getUserSSOProviders: IUserService['getUserSSOProviders'] = async () => {
    // Account not exist on next-auth in client mode, no need to implement this method
    return [];
  };

  unlinkSSOProvider: IUserService['unlinkSSOProvider'] = async () => {
    // Account not exist on next-auth in client mode, no need to implement this method
  };

  updateUserSettings: IUserService['updateUserSettings'] = async (value) => {
    const { keyVaults, ...res } = value;

    return this.userModel.updateSetting({ ...res, keyVaults: JSON.stringify(keyVaults) });
  };

  resetUserSettings: IUserService['resetUserSettings'] = async () => {
    return this.userModel.deleteSetting();
  };

  updateAvatar = async (avatar: string) => {
    await this.userModel.updateUser({ avatar });
  };

  updatePreference: IUserService['updatePreference'] = async (preference) => {
    await this.preferenceStorage.saveToLocalStorage(preference);
  };

  updateGuide: IUserService['updateGuide'] = async () => {
    throw new Error('Method not implemented.');
  };

  makeSureUserExist = async () => {
    const startTime = Date.now();
    console.log('🔐 [Auth] Verificando/creando usuario en base de datos...');

    try {
      // ✅ OPTIMIZACIÓN: Usar findFirst() con filtro en lugar de findMany()
      // Esto es mucho más rápido porque solo busca el usuario actual
      const queryStart = Date.now();

      // Buscar solo el usuario actual en lugar de cargar todos
      const existUser = await clientDB.query.users.findFirst({
        where: eq(users.id, this.userId || ''),
      });

      const queryTime = Date.now() - queryStart;
      console.log(`  📊 Query usuario completada en ${queryTime}ms (usuario encontrado: ${!!existUser})`);

      let user: { id: string };
      if (!existUser) {
        console.log('  ➕ No hay usuario, creando nuevo usuario...');
        const insertStart = Date.now();
        const result = await clientDB.insert(users).values({ id: this.userId }).returning();
        const insertTime = Date.now() - insertStart;
        console.log(`  ✅ Usuario creado en ${insertTime}ms`);
        user = result[0];
      } else {
        user = existUser;
        console.log(`  ✅ Usuario existente encontrado (ID: ${user.id})`);
      }

      const totalTime = Date.now() - startTime;
      console.log(`✅ [Auth] Usuario verificado/creado en ${totalTime}ms`);
      return user;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`❌ [Auth] Error después de ${totalTime}ms:`, error);
      throw error;
    }
  };
}
