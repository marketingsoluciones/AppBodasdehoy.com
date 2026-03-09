import { useEffect } from "react";
import { SkeletonPage } from "../components/Utils/SkeletonPage";

/**
 * Bandeja de mensajes — redirige a chat-ia /messages (inbox unificado).
 * La funcionalidad completa vive en chat.bodasdehoy.com/messages.
 */
const BandejaDeMensajes = () => {
  useEffect(() => {
    const chatBase = (process.env.NEXT_PUBLIC_CHAT || "https://chat.bodasdehoy.com").replace(/\/$/, "");
    window.location.href = `${chatBase}/messages`;
  }, []);

  return <SkeletonPage rows={5} />;
};

export default BandejaDeMensajes;
