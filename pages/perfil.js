import { useContext } from "react";
import { PencilEdit } from "../components/icons";
import { AuthContextProvider } from '../context'
import { ImageProfile } from "../utils/Funciones";
import { Mensaje } from "./bandeja-de-mensajes";
import PagesWithAuth from '../HOC/PagesWithAuth'

const Perfil = () => {
    const {user} = AuthContextProvider()

    const ListaTabs = [
        {title: "muro"},
        {title: "amigos"},
        {title: "visitas"},
        {title: "favoritos"}
    ]

    const MensajesMuro = [
        {usuario: "Maria", mensaje: "Me encanta tu boda!!"}
    ]

    const handleClick = () => {
      console.log("hola mundo")
    }
  return (
    <>
      <section className="w-full bg-base">
       
        <div className="max-w-screen-lg mx-auto inset-x-0 py-10 grid gap-10 font-display">
          <div className="bg-white rounded-xl h-96 w-full shadow overflow-hidden relative">
            <img className="h-2/5 object-cover object-top bg-black w-full" src="/boda_card.jpg"/>
            <img className="rounded-full p-1 bg-white h-40 w-40 object-cover absolute top-12 left-10" src="profile_men.png" />
            <div className="font-display py-14 px-10 leading-5">
              <h2 className="font-semibold text-xl text-gray-300">Francisco Montilla</h2>
              <p className="font-regular text-md text-gray-300">Desarrollador Frontend MERN Stack | Diseño grafico</p>
              <p className="font-regular text-xs text-gray-300 flex gap-4 pt-2">Venezuela <span className="font-semibold text-primary">Informacion de contacto</span></p>
              <div className="flex gap-6 pt-4">
                <Button text="Seguir" primary={true} onClick={handleClick} />
                <Button text="Compartir perfil" primary={false} onClick={handleClick} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl h-max py-6 w-full shadow-lg overflow-hidden relative">
            <svg className="absolute w-full h-1 top-0 bg-primary"/>
            <PencilEdit className="cursor-pointer transition hover:rotate-12 transform absolute top-4 right-4 text-primary w-6 h-6" />
            <h2 className="text-xl text-gray-300 px-10 py-2">Acerca de</h2>
            <p className="text-sm text-gray-500 px-10">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tempore quod quia sequi, assumenda sunt eius dicta eveniet eum. Soluta rem aliquid minima delectus nisi blanditiis impedit, deserunt voluptatibus incidunt quos.</p>

          </div>
        </div>
            
      </section>
      
    </>
  );
};

export default PagesWithAuth(Perfil);


const Button = ({onClick, text, primary = false}) => {
  
  return (
    <button
    onClick={onClick}
    className={`focus:outline-none rounded-xl px-4 py-2 text-${primary ? "white" : "primary"} bg-${primary ? "primary" : "white"} ${primary ? "" : "border-primary border"} text-md font-light transition hover:text-${primary ? "primary" : "white"} hover:bg-${primary ? "base" : "primary"}`}>
      {text}
    </button>
  )
}