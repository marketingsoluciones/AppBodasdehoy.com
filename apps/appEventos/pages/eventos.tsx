import type { GetServerSideProps } from "next"

/**
 * /eventos (tabla legacy de eventos) YA NO es una entrada válida: el inicio es siempre
 * "Mis eventos" ("/"). Redirigimos server-side para que nadie aterrice en la tabla al
 * entrar por bookmark, historial o el botón "Cambiar a vista de tabla".
 */
export const getServerSideProps: GetServerSideProps = async () => {
  return { redirect: { destination: "/", permanent: false } }
}

const listaDeEventos = () => null
export default listaDeEventos
