import { redirect } from 'next/navigation';

/**
 * /next-auth/signin consolidado → redirige a /login (único punto de entrada)
 */
export default function NextAuthSignInPage() {
  redirect('/login');
}
