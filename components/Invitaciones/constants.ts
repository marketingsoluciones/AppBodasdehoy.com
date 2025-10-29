import { ProfileImages } from './types';

export const PROFILE_IMAGES: ProfileImages = {
  hombre: {
    image: "/profile_men.png",
    alt: "Hombre",
  },
  mujer: {
    image: "profile_woman.png",
    alt: "Mujer",
  },
};

export const DEFAULT_PROFILE_IMAGE = "/placeholder/user.png";

// Configuración de anchos fijos para cada columna
export const COLUMN_WIDTH_CONFIG: { [key: string]: string } = {
  selection: '60px',
  nombre: '190px',
  correo: '230px',
  telefono: '140px',
  invitacion: '130px',
  acompañantes: '120px',
  date: '130px'
}; 