import { ImportPgDataStructure } from '@/types/export';
import { ImporterEntryData, OnImportCallbacks } from '@/types/importer';
import { UserSettings } from '@/types/user/settings';

import { ImportResults } from './_deprecated';

export interface IImportService {
  // ClientService (_deprecated) devuelve ImportResults; ServerService devuelve void.
  // La interfaz acepta ambos para no romper ninguna implementación.
  importData(data: ImporterEntryData, callbacks?: OnImportCallbacks): Promise<ImportResults | void>;

  importPgData(
    data: ImportPgDataStructure,
    options?: {
      callbacks?: OnImportCallbacks;
      overwriteExisting?: boolean;
    },
  ): Promise<void>;

  importSettings(settings: UserSettings): Promise<void>;
}
