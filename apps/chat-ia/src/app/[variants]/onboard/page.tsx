import { redirect } from 'next/navigation';

/**
 * Página de Onboarding - Redirige automáticamente al chat
 * El proceso de onboarding está deshabilitado, los usuarios van directamente al chat
 */
const OnboardPage = () => {
  // Redirección del servidor - más confiable que router.replace
  redirect('/chat');
};

export default OnboardPage;
