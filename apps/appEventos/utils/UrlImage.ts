import { resolveApiAppBaseUrl } from '@bodasdehoy/shared/utils';

export const createURL = (slug: string | undefined | null) => {
  if (!slug) return;
  const base = resolveApiAppBaseUrl();
  if (slug.startsWith('/')) return `${base}${slug}`;
  return `${base}/${slug}`;
};
