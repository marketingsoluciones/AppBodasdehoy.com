import { useEffect } from "react";
import { useRouter } from "next/router";
import { getAuth, signOut } from "firebase/auth";
import { authBridge } from "@bodasdehoy/shared/auth";

export default function SignoutPage() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const cleanup = async () => {
      await authBridge.signOutEverywhere({
        firebaseSignOut: async () => {
          await signOut(getAuth());
        },
        afterCleanup: () => {
          if (typeof window !== "undefined") {
            localStorage.removeItem("appEventos_activeEventId");
            localStorage.removeItem("dev_bypass");
            localStorage.removeItem("dev_bypass_email");
            localStorage.removeItem("dev_bypass_uid");
          }
        },
      });
      router.replace("/?signedOut=true");
    };

    cleanup();
  }, [router.isReady, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      <p className="text-sm text-gray-600 font-body">Cerrando sesión…</p>
    </div>
  );
}
