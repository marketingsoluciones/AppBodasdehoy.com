import { FC, useState } from "react";
import Link from "next/link";

const Navbar2: FC = () => {

    type Item = {
        title: string;
        titleInside?: string;
        route: string;
    };

    const List: Item[] = [
        {
            title: "Mi evento",
            route: "/",
            titleInside: "Mi organizador de bodas",
            //component: <OrganizadorBoda />,
        },
        {
            title: "Novia",
            route: process.env.NEXT_PUBLIC_DIRECTORY_NOVIAS,

        },
        {
            title: "Novio",
            route: process.env.NEXT_PUBLIC_DIRECTORY_NOVIOS,

        },
        {
            title: "Proveedores",
            route: process.env.NEXT_PUBLIC_DIRECTORY_PROVEEDORES,

        },
        {
            title: "Lugares para bodas",
            route: process.env.NEXT_PUBLIC_DIRECTORY_LUGARES_PARA_BODAS,

        },
    ];

    return (
        <>
            <nav className="hidden lg:block">
                <ul className="flex md:gap-3 lg:gap-4 xl:gap-4 text-sm  text-gray-200">
                    {List.map((item, idx) => (
                        <Link key={idx} href={item.route ?? ""} passHref>

                            <li className="font-title uppercase flex items-center justify-center cursor-pointer relative  transition text-gray-500 hover:text-primary ">
                                {item.title}
                            </li>
                        </Link>
                    ))}
                </ul>
            </nav>
        </>
    )
};

export default Navbar2