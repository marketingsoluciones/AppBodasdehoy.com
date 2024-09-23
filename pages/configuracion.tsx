import { MiPerfil } from "../components/perfil/CuadroDeAccion/MiPerfil";
import { PerfilFoto } from "../components/perfil/PerfilFoto";
import { PerfilOpciones } from "../components/perfil/PerfilOpciones";
import { FC, useState } from "react";
import PagesWithAuth from "../HOC/PagesWithAuth";
import { AuthContextProvider, LoadingContextProvider } from '../context'
import { deleteCookie } from "../utils/Cookies";
import { useRouter } from "next/router";
import { useToast } from '../hooks/useToast';
import Cookies from "js-cookie";
import { useAuthentication } from '../utils/Authentication';
import { ExitIcon, HeartIconOutline, SettingsIconOutline, StartIconOutline } from "../components/icons";
import { useTranslation } from 'react-i18next';

// import { AlertDesarrollo } from "../components/modals/AlertDesarrollo";

export type optionComponent = {
  title: string;
  icon?: any;
  component: any;
  state: boolean;
};

const Configuration = () => {
  const { t } = useTranslation();
  const [isActive, setActive] = useState(0);
  const [modal, setModal] = useState(false)
  const { setLoading } = LoadingContextProvider()
  const { _signOut } = useAuthentication()
  const router = useRouter()
  const toast = useToast()

  const components: optionComponent[] = [
    {
      title: "Mi perfil",
      icon: <HeartIconOutline />,
      component: <MiPerfil />,
      state: false,
    },
    {
      title: "Notificaciones",
      icon: <HeartIconOutline />,
      component: null /* <Notificaciones /> */,
      state: true,
    },
    {
      title: "Favoritos",
      icon: <StartIconOutline />,
      component: null /* <Favoritos /> */,
      state: true
    },
    {
      title: "Configuración",
      icon: <SettingsIconOutline />,
      component: null /* <Configuraciones /> */,
      state: true
    },
  ];

  const handleClickOption = (idx: number) => {
    setActive(idx);
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      _signOut()
    } catch (error) {
      toast("error", t("Ups.. Hubo un error"))
      console.log(error)
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* {modal ? (
        <AlertDesarrollo alertDev={modal} setAlertDev={setModal} />
      ) : null} */}

      <section className="max-w-screen-lg mx-auto inset-x-0 grid grid-cols-1 md:grid-cols-4* md:pt-10 -mt-4 md:mt-0 md:gap-10">
        <div className="flex flex-col items-center justify-start w-full text-sm gap-6">
          <PerfilFoto />
          <button onClick={handleSignOut} className="bg-red-500 px-3 py-1 rounded text-white text-sm sm:hidden top-2 left-2 flex items-center gap-2">
            <ExitIcon /> {t("logoff")}
          </button>
          {/* <PerfilOpciones
            components={components}
            actived={isActive}
            onClick={handleClickOption}
            setAlertDev={setModal}
            alertDev={modal}
          /> */}
        </div>
        <div className="col-span-3 p-5 md:p-0">{components[isActive].component}</div>
      </section>
    </>
  );
};
export default Configuration;
//export default PagesWithAuth(Configuration);

export const BlockConfiguration: FC<{ title: string; subtitle?: string, children?: any }> = ({ title, subtitle, children, }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow flex flex-col gap-2">
      <div>
        <h2 className="text-primary font-bold text-xl">{title}</h2>
        {subtitle && <small className="text-gray-600">{subtitle}</small>}
      </div>
      <div>{children}</div>
    </div>
  );
};
