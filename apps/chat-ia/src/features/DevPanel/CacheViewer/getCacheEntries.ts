'use server';

import { existsSync, promises } from 'node:fs';
import pMap from 'p-map';
import { ZodError } from 'zod';

import { type NextCacheFileData, nextCacheFileSchema } from './schema';

const cachePath = '.next/cache/fetch-cache';

export const getCacheFiles = async (): Promise<NextCacheFileData[]> => {
  if (!existsSync(cachePath)) {
    return [];
  }
  const files = await promises.readdir(cachePath);
  let result: NextCacheFileData[] = (await pMap(files, async (file) => {
    // ignore tags-manifest file
    if (/manifest/.test(file)) return false;
    try {
      const fileContent = await promises.readFile(`${cachePath}/${file}`).catch((err) => {
        throw new Error(`Error reading file ${file}`, {
          cause: err,
        });
      });

      const fileStats = await promises.stat(`${cachePath}/${file}`).catch((err) => {
        throw new Error(`Error reading file ${file}`, {
          cause: err,
        });
      });

      const jsonData = JSON.parse(fileContent.toString());

      return nextCacheFileSchema.parse({
        ...jsonData,
        id: file,
        timestamp: new Date(fileStats.birthtime),
      });
    } catch (error) {
      // Solo loguear errores en desarrollo, no en producción
      // Estos errores son de archivos de caché corruptos y no deberían bloquear la aplicación
      if (process.env.NODE_ENV === 'development') {
        if (error instanceof ZodError) {
          const issues = error.issues;
          console.warn(`[Dev] File ${file} do not match the schema`, issues);
        } else {
          console.warn(`[Dev] Error parsing cache file ${file}:`, error instanceof Error ? error.message : error);
        }
      }
      // Silenciosamente ignorar archivos de caché corruptos
      return false;
    }
  })) as NextCacheFileData[];

  result = result.filter(Boolean) as NextCacheFileData[];

  return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};
