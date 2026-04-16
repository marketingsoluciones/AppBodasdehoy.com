/**
 * Re-exports all action slices as a single combined slice.
 * Individual slices live in ./slices/ for better code organization.
 */
import { StateCreator } from 'zustand/vanilla';
import type { MemoriesState } from './initialState';

import { uiSlice, type UIAction } from './slices/uiSlice';
import { albumsSlice, type AlbumsAction } from './slices/albumsSlice';
import { mediaSlice, type MediaAction } from './slices/mediaSlice';
import { membersSlice, type MembersAction } from './slices/membersSlice';

export type MemoriesAction = UIAction & AlbumsAction & MediaAction & MembersAction;

export const memoriesActionSlice: StateCreator<
  MemoriesState,
  [],
  [],
  MemoriesAction
> = (set, get, api) => ({
  ...uiSlice(set, get, api),
  ...albumsSlice(set, get, api),
  ...mediaSlice(set, get, api),
  ...membersSlice(set, get, api),
});
