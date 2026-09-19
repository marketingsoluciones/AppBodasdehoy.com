import i18n from 'i18next';
import { es, en } from '../locales/index';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      es,
    },
    //lng: 'es', // Idioma por defecto
    fallbackLng: 'en', // Idioma al que caer si no se encuentra el idioma del usuario
    interpolation: {
      escapeValue: false // Permite usar HTML en las traducciones
    }
  });

export default i18n;