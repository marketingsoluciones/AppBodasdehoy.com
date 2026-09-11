import { useGlobalStore } from '@/store/global';

export const useNewVersion = () => {
  const [hasNewVersion, useCheckLatestVersion] = useGlobalStore((s) => [
    s.hasNewVersion,
    s.useCheckLatestVersion,
  ]);

  // Fork bodasdehoy (QA #20, 5-ago): el check compara CURRENT_VERSION (fork, p.ej. v1.0.1)
  // contra el ÚLTIMO release de LobeChat upstream (p.ej. v1.143.3) → falsa alarma permanente
  // "Nueva versión disponible". La comparación con upstream no tiene sentido en el fork.
  // Desactivado hasta que exista una fuente de versión propia del fork.
  useCheckLatestVersion(false);

  return hasNewVersion;
};
