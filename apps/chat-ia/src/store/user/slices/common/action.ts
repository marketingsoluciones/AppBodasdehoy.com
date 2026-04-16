import { getSingletonAnalyticsOptional } from '@lobehub/analytics';
import useSWR, { SWRResponse, mutate } from 'swr';
import type { PartialDeep } from 'type-fest';
import type { StateCreator } from 'zustand/vanilla';

import { DEFAULT_PREFERENCE } from '@/const/user';
import { useOnlyFetchOnceSWR } from '@/libs/swr';
import { userService } from '@/services/user';
import type { UserStore } from '@/store/user';
import type { GlobalServerConfig } from '@/types/serverConfig';
import { LobeUser, UserInitializationState } from '@/types/user';
import type { UserSettings } from '@/types/user/settings';
import { merge } from '@/utils/merge';
import { setNamespace } from '@/utils/storeDebug';

import { preferenceSelectors } from '../preference/selectors';

const n = setNamespace('common');

const GET_USER_STATE_KEY = 'initUserState';
/**
 * 设置操作
 */
export interface CommonAction {
  refreshUserState: () => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
  useCheckTrace: (shouldFetch: boolean) => SWRResponse;
  useInitUserState: (
    isLogin: boolean | undefined,
    serverConfig: GlobalServerConfig,
    options?: {
      onSuccess: (data: UserInitializationState) => void;
    },
  ) => SWRResponse;
}

export const createCommonSlice: StateCreator<
  UserStore,
  [['zustand/devtools', never]],
  [],
  CommonAction
> = (set, get) => ({
  refreshUserState: async () => {
    await mutate(GET_USER_STATE_KEY);
  },
  updateAvatar: async (avatar) => {
    // 1. 更新服务端/数据库中的头像
    await userService.updateAvatar(avatar);

    await get().refreshUserState();
  },

  useCheckTrace: (shouldFetch) =>
    useSWR<boolean>(
      shouldFetch ? 'checkTrace' : null,
      () => {
        const userAllowTrace = preferenceSelectors.userAllowTrace(get());

        // if user have set the trace, return false
        if (typeof userAllowTrace === 'boolean') return Promise.resolve(false);

        return Promise.resolve(get().isUserCanEnableTrace);
      },
      {
        revalidateOnFocus: false,
      },
    ),

  useInitUserState: (isLogin, serverConfig, options) => {
    const swrKey = !!isLogin ? GET_USER_STATE_KEY : null;

    // ✅ CRÍTICO: Si isLogin es false/null/undefined, marcar como inicializado inmediatamente
    if (!isLogin && // Marcar como inicializado inmediatamente para no bloquear
      typeof window !== 'undefined') {
        requestAnimationFrame(() => {
          set({ isUserStateInit: true }, false, n('initUserState/noLogin'));
        });
      }

    return useOnlyFetchOnceSWR<UserInitializationState>(
      swrKey,
      async () => {
        // ✅ Timeout de 5s para queries a API2
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: getUserState tardó más de 5 segundos')), 5000);
        });

        try {
          return await Promise.race([
            userService.getUserState(),
            timeoutPromise
          ]);
        } catch (error) {
          console.warn('⚠️ Error obteniendo user state (usando valores por defecto):', error);
          // ✅ Retornar estado por defecto en lugar de fallar
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
            preference: DEFAULT_PREFERENCE,
            settings: {},
            subscriptionPlan: undefined,
            userId: get().user?.id || '',
            username: '',
          } as UserInitializationState;
        }
      },
      {
        dedupingInterval: 5000,
        onError: (error) => {
          console.warn('⚠️ Error en useInitUserState:', error);
          set({ isUserStateInit: true }, false, n('initUserState/error'));
        },
        onSuccess: (data) => {
          options?.onSuccess?.(data);

          if (data) {
            const serverSettings: PartialDeep<UserSettings> = {
              defaultAgent: serverConfig.defaultAgent,
              image: serverConfig.image,
              languageModel: serverConfig.languageModel,
              systemAgent: serverConfig.systemAgent,
            };

            const defaultSettings = merge(get().defaultSettings, serverSettings);
            const isEmpty = Object.keys(data.preference || {}).length === 0;
            const preference = isEmpty ? DEFAULT_PREFERENCE : data.preference;

            const user =
              data.avatar || data.userId
                ? merge(get().user, {
                    avatar: data.avatar,
                    email: data.email,
                    firstName: data.firstName,
                    fullName: data.fullName,
                    id: data.userId,
                    latestName: data.lastName,
                    username: data.username,
                  } as LobeUser)
                : get().user;

            set(
              {
                defaultSettings,
                isOnboard: data.isOnboard,
                isShowPWAGuide: data.canEnablePWAGuide,
                isUserCanEnableTrace: data.canEnableTrace,
                isUserHasConversation: data.hasConversation,
                isUserStateInit: true,
                preference,
                serverLanguageModel: serverConfig.languageModel,
                settings: data.settings || {},
                subscriptionPlan: data.subscriptionPlan,
                user,
              },
              false,
              n('initUserState'),
            );

            const analytics = getSingletonAnalyticsOptional();
            analytics?.identify(data.userId || '', {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              username: data.username,
            });
            get().refreshDefaultModelProviderList({ trigger: 'fetchUserState' });
          }
        },
      },
    );
  },
});
