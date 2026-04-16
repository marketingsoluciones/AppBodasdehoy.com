import { redirect } from 'next/navigation';

/**
 * /next-auth/error consolidado → redirige a /login (único punto de entrada)
 */
export default function NextAuthErrorPage() {
  redirect('/login');
}
