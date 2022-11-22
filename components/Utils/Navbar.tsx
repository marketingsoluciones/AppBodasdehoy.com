import { FC, useState } from "react";
import Link from "next/link";

const Navbar2: FC = () => {
    //const [selected, setSelect] = useState<number | null>(null);
  
    type Item = {
      title: string;
      titleInside?: string;
      route: string;
      //component?: ReactNode;
    };
  
    const List: Item[] = [
     /*  {
        title: "Mi boda",
        route: process.env.NEXT_PUBLIC_EVENTSAPP ?? "",
        titleInside: "Mi organizador de bodas",
        //component: <OrganizadorBoda />,
      }, */
      { 
        title: "Novia", 
        route: process.env.NEXT_PUBLIC_DIRECTORY_NOVIAS , 
        //component: <NoviaMenu /> },
      },
      { 
        title: "Novio",
        route: process.env.NEXT_PUBLIC_DIRECTORY_NOVIOS , 
        //component: <NovioMenu /> },
      },
      {
        title: "Proveedores",
        route: process.env.NEXT_PUBLIC_DIRECTORY_PROVEEDORES ,
        //component: <Proveedores />,
      },
      {
        title: "Lugares para bodas",
        route: process.env.NEXT_PUBLIC_DIRECTORY_LUGARES_PARA_BODAS ,
        //component: <LugaresParaBodas />,
      },
    ];
  
    /* const ItemList: FC<Item> = ({ title, route }) => {
      const [isHovered, setHovered] = useState<boolean>(false);
      return (
        <>
          <Link href={route} passHref>
            <a>
              <li className="uppercase h-10 flex items-center justify-center cursor-pointer relative  hover:text-tertiary transition text-gray-500  ">
                {title}
                <svg
                  className={`h-0.5 w-full bg-primary transform transition absolute ${isHovered ? "scale-100" : "scale-0"
                    } `}
                />
              </li>
            </a>
          </Link>
        </>
      );
    }; */
  
    /* return (
      <>
        <nav className="hidden lg:block">
          <ul className="flex md:gap-3 lg:gap-4 xl:gap-4 text-sm font-medium text-gray-200">
            {List.map((item, idx) => (
              <div
                key={idx}
                onMouseOver={() => setSelect(idx)}
                onMouseLeave={() => setSelect(null)}
              >
                 <ItemList {...item} /> 
                 {(() => {
                  if (idx === selected) {
                    return (
                      <MultiMenu
                        title={List[selected].titleInside ?? List[selected].title}
                      >
                        {List[selected]?.component}
                      </MultiMenu>
                    );
                  }
                })()} 
              </div>
            ))}
          </ul>
        </nav>
      </>
    ); */

    return(
        <>
        <nav className="hidden lg:block">
            <ul className="flex md:gap-3 lg:gap-4 xl:gap-4 text-sm  text-gray-200">
                {List.map((item, idx)=>(
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