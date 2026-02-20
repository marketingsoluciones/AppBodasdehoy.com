'use client';

/**
 * Re-export del hook useWeddingWeb desde @bodasdehoy/wedding-creator.
 * Persistencia por defecto vía /api/wedding (Next.js).
 */

export {
  useWeddingWeb,
  type UseWeddingWebOptions,
  type UseWeddingWebReturn,
  type WeddingWebAPI,
} from '@bodasdehoy/wedding-creator';
import { useWeddingWeb } from '@bodasdehoy/wedding-creator';
export default useWeddingWeb;
