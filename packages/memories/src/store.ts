import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { memoriesActionSlice, type MemoriesAction } from './action';
import { initialMemoriesState, type MemoriesState } from './initialState';

export type MemoriesStore = MemoriesState & MemoriesAction;

const createStore = (set: any, get: any, api: any) => ({
  ...initialMemoriesState,
  ...memoriesActionSlice(set, get, api),
});

export const useMemoriesStore = createWithEqualityFn<MemoriesStore>()(
  subscribeWithSelector(createStore),
  shallow,
);
