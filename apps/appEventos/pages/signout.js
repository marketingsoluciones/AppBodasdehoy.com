import { useEffect } from "react";
import { useRouter } from "next/router";

/**
 * Ruta usada tras cerrar sesión (config.pathSignout → {origin}/signout?end=true).
 * En producción bodasdehoy.com puede existir otra página; en app-dev / app-test
 * antes no había página → 404. Aquí solo redirigimos a inicio (la sesión ya se limpió en Profile / Sidebar).
 */
export default function SignoutPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace("/");
  }, [router.isReady, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf2f8] gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
      <p className="text-sm text-gray-600 font-body">Cerrando sesión…</p>
    </div>
  );
}
