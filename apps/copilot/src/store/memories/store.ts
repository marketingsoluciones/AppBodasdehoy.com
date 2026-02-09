import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { StateCreator } from 'zustand/vanilla';

import { createDevtools } from '../middleware/createDevtools';
import { MemoriesAction, memoriesActionSlice } from './action';
import { MemoriesState, initialMemoriesState } from './initialState';

export interface MemoriesStore extends MemoriesState, MemoriesAction {}

const createStore: StateCreator<MemoriesStore, [['zustand/devtools', never]]> = (
  ...parameters
) => ({
  ...initialMemoriesState,
  ...memoriesActionSlice(...parameters),
});

const devtools = createDevtools('memories');

export const useMemoriesStore = createWithEqualityFn<MemoriesStore>()(
  subscribeWithSelector(devtools(createStore)),
  shallow,
);
