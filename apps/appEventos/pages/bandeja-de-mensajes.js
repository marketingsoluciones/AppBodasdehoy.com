import { useEffect } from "react";
import { SkeletonPage } from "../components/Utils/SkeletonPage";

/**
 * Bandeja de mensajes — redirige a /messages en la app de chat (mismo tier: NEXT_PUBLIC_CHAT o chat en prod).
 */
const BandejaDeMensajes = () => {
  useEffect(() => {
    const chatBase = (process.env.NEXT_PUBLIC_CHAT || "https://chat.bodasdehoy.com").replace(/\/$/, "");
    window.location.href = `${chatBase}/messages`;
  }, []);

  return <SkeletonPage rows={5} />;
};

export default BandejaDeMensajes;
