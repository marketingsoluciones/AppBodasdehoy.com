import Breadcumbs from "../components/DefaultLayout/Breadcumb";
import { PicoIcon } from "../components/icons";
import BlockTitle from "../components/Utils/BlockTitle";

const BandejaDeMensajes = () => {
  const Lista = [
    { title: "Proveedores", route: "" },
    { title: "Mensajes Privados", route: "" },
    { title: "Notificaciones", route: "" },
    { title: "Administradora", route: "" },
  ];
  return (
    <>
      <section className="bg-base w-full h-full">
        <div className="max-w-screen-lg mx-auto inset-x-0 w-full py-2 px-2 md:px-0">
          {/* <Breadcumbs /> */}
          <BlockTitle title="Bandeja de Entrada" />
          <div className="grid grid-cols-1 w-full md:grid-cols-4 gap-6 py-6">
            <div className="col-span-1 flex items-center md:items-start justify-between md:flex-col bg-white shadow-lg rounded-xl w-full py-4 px-4 h-max">
              <h2 className="hidden md:block font-display text-lg font-light text-gray-500 w-max text-left px-2 ">
                Carpetas
              </h2>
              <div className="flex md:flex-col gap-2 md:px-2 md:py-4 justify-center w-full md:border-b border-gray-100 ">
                <ul className="font-display text-gray-500 gap-5 flex items-center justify-between px-16 md:px-0 md:items-start md:flex-col w-full">
                  <li className="flex gap-1 items-center hover:text-gray-300 text-sm cursor-pointer">
                    No leídos<span className="font-semibold">10</span>
                  </li>
                  <li className="flex gap-2 items-center hover:text-gray-300 text-sm cursor-pointer">
                    Bandeja de entrada<span className="font-semibold">7</span>
                  </li>
                </ul>
              </div>
              <div className="hidden md:block py-4 justify-center  border-b border-gray-100 px-2">
                <ul className="flex flex-col gap-2 font-display text-sm  ">
                  {Lista?.map((item, idx) => (
                    <li
                      className="hover:text-gray-300 text-gray-500 cursor-pointer"
                      key={idx}
                    >
                      {item.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="col-span-1 md:col-span-3 bg-white shadow-lg rounded-xl w-full py-3 px-4 h-max">
              <h2 className="font-display font-semibold text-2xl text-gray-300 w-full px-4 border-b border-gray-100 py-2">
                No leidos
              </h2>
              <div className="py-4 grid gap-4 md:px-4">
                <Mensaje />
                <Mensaje />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BandejaDeMensajes;

export const Mensaje = () => {
  return (
    <div className="w-full bg-base rounded-xl h-20 flex justify-start gap-4 items-center pl-5 pr-3 md:hover:scale-105 transition transform overflow-hidden">
      <div className="absolute w-10 h-full bg-tertiary left-2 -translate-x-full transform" />
      <img
        src="profile_woman.png"
        className="w-12 h-12 rounded-full object-cover object-center"
      />
      <p className="font-display text-md font-light text-gray-500">Maria</p>
      <div className="bg-white h-max w-5/6 rounded-xl relative px-4 py-2">
        <PicoIcon className="absolute inset-y-0 my-auto w-max h-max transform -translate-x-full left-px" />
        <p className="font-display font-semibold text-sm">¡Sí voy!</p>
        <p className="font-display font-light text-xs md:text-sm">
          Ha confirmado su asistencia via email
        </p>
      </div>
    </div>
  );
};
