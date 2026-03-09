/**
 * Tipos para styled-jsx usados por @bodasdehoy/wedding-creator.
 * Referencia explícita a React para que la ampliación se fusione y no reemplace el módulo.
 */
/// <reference types="react" />
declare module 'react' {
  interface StyleHTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}
