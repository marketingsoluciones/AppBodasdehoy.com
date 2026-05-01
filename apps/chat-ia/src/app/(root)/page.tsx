import { redirect } from 'next/navigation';

/**
 * Página raíz "/": redirige a /chat para que el middleware aplique el rewrite a /{variants}/chat.
 */
export default function RootPage() {
  redirect('/chat');
}
