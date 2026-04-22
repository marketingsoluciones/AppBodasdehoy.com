import { useEffect } from "react";
import { resolveChatOrigin } from "@bodasdehoy/shared/utils";
import { SkeletonPage } from "../components/Utils/SkeletonPage";

/**
 * Bandeja de mensajes — redirige a /messages en la app de chat (detecta tenant por hostname).
 */
const BandejaDeMensajes = () => {
  useEffect(() => {
    const chatBase = typeof window !== "undefined"
      ? resolveChatOrigin(window.location.hostname)
      : (process.env.NEXT_PUBLIC_CHAT || "https://chat.bodasdehoy.com");
    window.location.href = `${chatBase.replace(/\/$/, "")}/messages`;
  }, []);

  return <SkeletonPage rows={5} />;
};

export default BandejaDeMensajes;
