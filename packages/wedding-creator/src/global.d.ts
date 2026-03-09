/**
 * Tipos para styled-jsx (estilo con <style jsx> y <style jsx global>).
 * export {} convierte este archivo en módulo → declare module es augmentation, no reemplazo.
 */
export {};

declare module 'react' {
  interface StyleHTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}
