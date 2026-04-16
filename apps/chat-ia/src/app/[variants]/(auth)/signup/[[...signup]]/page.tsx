import { redirect } from 'next/navigation';

/**
 * /signup consolidado → redirige a /login (único punto de entrada, tiene registro integrado)
 */
export default function SignUpPage() {
  redirect('/login');
}
