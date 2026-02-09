'use client';

import { ForwardedRef, memo, useImperativeHandle } from 'react';
import { createStoreUpdater } from 'zustand-utils';

import { AgentSettingsInstance, useAgentSettings } from './hooks/useAgentSettings';
import { State, useStoreApi } from './store';

export interface StoreUpdaterProps
  extends Partial<
    Pick<State, 'onMetaChange' | 'onConfigChange' | 'meta' | 'config' | 'id' | 'loading'>
  > {
  instanceRef?: ForwardedRef<AgentSettingsInstance> | null;
}

const StoreUpdater = memo<StoreUpdaterProps>(
  ({ onConfigChange, instanceRef, id, onMetaChange, meta, config, loading }) => {
    const storeApi = useStoreApi();
    const useStoreUpdater = createStoreUpdater(storeApi);

    const currentState = storeApi.getState();

    useStoreUpdater('meta', meta ?? currentState.meta);
    useStoreUpdater('config', config ?? currentState.config);
    useStoreUpdater('onConfigChange', onConfigChange ?? currentState.onConfigChange);
    useStoreUpdater('onMetaChange', onMetaChange ?? currentState.onMetaChange);
    useStoreUpdater('loading', loading ?? currentState.loading);
    useStoreUpdater('id', id ?? currentState.id);

    const instance = useAgentSettings();
    useImperativeHandle(instanceRef, () => instance);

    return null;
  },
);

export default StoreUpdater;
