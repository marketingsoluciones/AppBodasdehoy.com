import { useEffect } from "react";
import { useRouter } from "next/router";
import { getAuth, signOut } from "firebase/auth";

export default function SignoutPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const cleanup = async () => {
      try {
        await signOut(getAuth());
      } catch (e) {
        console.warn("[signout] Firebase signOut:", e);
      }
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("appEventos_activeEventId");
          localStorage.removeItem("dev_bypass");
          localStorage.removeItem("dev_bypass_email");
          localStorage.removeItem("dev_bypass_uid");
        }
      } catch (e) {
        console.warn("[signout] localStorage cleanup:", e);
      }
      router.replace("/?signedOut=true");
    };

    cleanup();
  }, [router.isReady, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdf2f8] gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-200 border-t-pink-600" />
      <p className="text-sm text-gray-600 font-body">Cerrando sesión…</p>
    </div>
  );
}
