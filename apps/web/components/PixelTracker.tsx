import { useEffect } from 'react';
import ReactPixel, { AdvancedMatching } from 'react-facebook-pixel';
import { AuthContextProvider } from '../context';

const PixelTracker = () => {
  const { config } = AuthContextProvider()

  const advancedMatching = {} as AdvancedMatching // Puedes agregar datos avanzados de coincidencia si es necesario.
  const options = {
    autoConfig: true, // Habilitar la autoconfiguración.
    debug: false, // Habilitar el modo de depuración.
  };

  useEffect(() => {
    if (config?.metaPixel_id) {
      const pixelId = config.metaPixel_id;
      ReactPixel.init(pixelId, advancedMatching, options);
      ReactPixel.pageView();
    }
  }, []);

  return null;
};

export default PixelTracker;