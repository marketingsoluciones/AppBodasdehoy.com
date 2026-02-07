/**
 * Ruta /app: redirige al home (/) para que la URL app-test.bodasdehoy.com/app
 * muestre la app correctamente en lugar de 404.
 */
import { GetServerSideProps } from 'next';

export default function AppPage() {
  return null; // La redirección se hace en getServerSideProps
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
};
