import { FC } from "react";

interface propsModal {
    children?: React.ReactNode;
    set?: (state: boolean) => void;
    state?: boolean;
    classe?: any;
    loading?: boolean;
    style?: React.CSSProperties; // Agregar estilos personalizados
}

export const Modal: FC<propsModal> = ({ children, state, set, classe, loading, style }) => {
  if (!state) return null; // No renderizar si el modal está cerrado

  return (
    <div className="relative z-50">
      {/* Fondo oscuro */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={() => set && set(false)} // Cerrar modal al hacer clic fuera
      />
      {/* Contenedor del modal */}
      <div
        className={`absolute bg-white shadow-lg rounded-xl border-[1px] border-gray-200 ${classe}`}
        style={style} // Aplicar estilos personalizados
      >
        {loading && <div className="absolute inset-0 flex items-center justify-center">Cargando...</div>}
        {children}
      </div>
    </div>
  );
};