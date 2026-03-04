/**
 * Polyfill para hacer que next/navigation funcione en Pages Router
 * Este archivo debe importarse ANTES de cualquier uso de next/navigation en _app.tsx
 */

// TEMPORALMENTE DESACTIVADO - Necesitamos ver los errores reales
// if (typeof window !== 'undefined') {
//   const originalError = console.error;
//   const originalWarn = console.warn;

//   console.error = (...args: any[]) => {
//     // Suprimir errores conocidos de next/navigation en Pages Router
//     const msg = String(args[0] || '');
//     if (
//       msg.includes('useRouter') ||
//       msg.includes('RouterContext') ||
//       msg.includes('useSearchParams') ||
//       msg.includes('usePathname') ||
//       msg.includes('next/navigation') ||
//       msg.includes('NotFoundBoundary')
//     ) {
//       return; // Ignorar estos errores
//     }
//     originalError.apply(console, args);
//   };

//   console.warn = (...args: any[]) => {
//     // Suprimir warnings relacionados
//     const msg = String(args[0] || '');
//     if (
//       msg.includes('useRouter') ||
//       msg.includes('next/navigation')
//     ) {
//       return;
//     }
//     originalWarn.apply(console, args);
//   };
// }

// Log para confirmar que el polyfill se cargó
if (typeof window !== 'undefined') {
  console.log('[Polyfill] next-navigation-polyfill cargado - errores NO suprimidos para debug');
}

export {};
