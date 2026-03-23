import { redirect } from 'next/navigation';

/**
 * /dev-login consolidado → redirige a /login (único punto de entrada)
 */
export default function DevLoginPage() {
  redirect('/login');
}
