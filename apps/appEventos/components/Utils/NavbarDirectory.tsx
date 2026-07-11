import { FC } from "react";
import Link from "next/link";
import { AuthContextProvider } from "../../context";
import { useTranslation } from "react-i18next";

const NavbarDirectory: FC = () => {
    const { t } = useTranslation()
    const { config } = AuthContextProvider()
    // Estos enlaces (Novia/Novio/Proveedores/Lugares) apuntan al SITIO DE MARKETING, no a la app.
    // Garantizar SIEMPRE una URL absoluta: si config.pathDirectory no está cargado, el href
    // quedaba relativo (/categoria/novias) y navegaba dentro de app-dev → 404 (BUG QA #5 10-jul).
    const dirBase = (config?.pathDirectory || config?.pathDomain || 'https://bodasdehoy.com').replace(/\/$/, '');
    const marketingBase = (typeof window !== 'undefined' && window.origin.includes('://test.'))
        ? dirBase.replace('//', '//test')
        : dirBase;
    return (
        <>
            <nav className="hidden lg:block">
                <ul className="flex md:gap-3 lg:gap-4 xl:gap-4 text-sm text-gray-700">
                    {config?.navbarDirectory?.map((item: any, idx: number) => (
                        <Link key={idx} href={`${marketingBase}/${String(item?.path).replace(/^\//, '')}`}>
                            < li className="font-medium uppercase flex items-center justify-center cursor-pointer relative transition text-gray-700 hover:text-primary" >
                                {t(item.title)}
                            </li >
                        </Link >
                    )
                    )}
                </ul >
            </nav >
        </>
    )
};

export default NavbarDirectory