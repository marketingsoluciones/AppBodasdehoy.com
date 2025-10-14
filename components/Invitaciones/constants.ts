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

export const COLUMN_SPAN_CONFIG: { [key: string]: number } = {
  selection: 1,
  nombre: 4,
  correo: 5,
  telefono: 4,
  invitacion: 4,
  acompañantes: 3,
  date: 3
}; 