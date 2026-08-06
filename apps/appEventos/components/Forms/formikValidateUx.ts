/**
 * UX de validación Formik (appEventos):
 * - No mostrar errores al montar
 * - No validar al blur (errores solo tras submit → Formik marca touched)
 * - validateOnChange queda en true (default) para limpiar errores al rellenar
 */
export const formikValidateUx = {
  validateOnMount: false,
  validateOnBlur: false,
} as const;
