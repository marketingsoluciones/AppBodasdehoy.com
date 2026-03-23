'use client';

import { StoreApi } from 'zustand';
import { createContext } from 'zustand-utils';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { Store, store } from './action';
import { State } from './initialState';

export type { PublicState, State } from './initialState';

export const createStore = (initState?: Partial<State>) =>
  createWithEqualityFn(subscribeWithSelector(store(initState)), shallow) as unknown as StoreApi<Store>;

export const {
  useStore: useChatInputStore,
  useStoreApi,
  Provider,
} = createContext<StoreApi<Store>>();

export { selectors } from './selectors';
