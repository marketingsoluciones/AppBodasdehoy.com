import { FC, useState } from "react";
import Link from "next/link";
import { AuthContextProvider } from "../../context";

const NavbarDirectory: FC = () => {
    const { config } = AuthContextProvider()
    return (
        <>
            <nav className="hidden lg:block">
                <ul className="flex md:gap-3 lg:gap-4 xl:gap-4 text-sm  text-gray-200">
                    {config?.navbarDirectory?.map((item: any, idx: number) => (
                        <Link key={idx} href={config?.pathDirectory && `${window.origin.includes("://test.") ? config?.pathDirectory.replace("//", "//test") : config?.pathDirectory}/${item?.path}`} passHref>
                            < li className="font-title uppercase flex items-center justify-center cursor-pointer relative  transition text-gray-500 hover:text-primary " >
                                {item.title}
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