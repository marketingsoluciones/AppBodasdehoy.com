// Importa los módulos necesarios
import React, { useState } from 'react';

// Componente funcional para el menú
const Menu = () => {
  // Estado para controlar la visibilidad del menú en dispositivos móviles
  const [showMenu, setShowMenu] = useState(false);

  // Función para alternar la visibilidad del menú
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  return (
    <header className="w-full h-16 bg-indigo-600 shadow-lg">
      <div className="container px-4 md:px-0 h-full mx-auto flex justify-between items-center">
        {/* Logo */}
        <a
          className="text-yellow-400 text-xl font-bold italic"
          href="#"
        >
          <img src="ModuloEvento/logo.png" alt="" />
        </a>

        {/* Botón de menú en dispositivos móviles */}
        <div className="md:hidden">
          <button
            className="text-white text-4xl font-bold opacity-70 hover:opacity-100 duration-300"
            onClick={toggleMenu}
          >
            <img src="ModuloEvento/mingcute_menu-fill.svg" alt="" />
          </button>
        </div>

        {/* Menú de navegación */}
        <ul
          id="menu"
          className={`${
            showMenu ? 'block' : 'hidden'
          } md:block md:relative md:flex md:p-0 md:bg-transparent md:flex-row md:space-x-6`}
        >
          <li className="md:hidden z-90 fixed top-4 right-6">
            <a
              href="javascript:void(0)"
              className="text-right text-white text-4xl"
              onClick={toggleMenu}
            >
              ×
            </a>
          </li>
          <li>
            <a
              className="text-white opacity-70 hover:opacity-100 duration-300"
              href="#"
            >
              Inicio
            </a>
          </li>
          <li>
            <a
              className="text-white opacity-70 hover:opacity-100 duration-300"
              href="#"
            >
              Sesión
            </a>
          </li>
          <li>
            <a
              className="text-white opacity-70 hover:opacity-100 duration-300"
              href="#"
            >
              Registrarse
            </a>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Menu;
