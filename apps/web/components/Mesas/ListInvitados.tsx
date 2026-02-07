import React, { FC, useMemo } from "react";
import { guests } from "../../utils/Interfaces";
import DragInvitado from "./DragInvitado";
import { EventContextProvider } from "../../context";

interface propsListInvitados {
  setEditInv: any
  editInv: any
  setSelected: any
}

const ListInvitados: FC<propsListInvitados> = ({ editInv, setEditInv, setSelected }) => {
  const { filterGuests } = EventContextProvider()

  // Función para ordenar invitados agrupando padres e hijos
  const sortedGuests = useMemo(() => {
    if (!filterGuests?.noSentados) return [];
    
    const guests = [...filterGuests.noSentados];
    const result: any[] = [];
    const processed = new Set();
    
    // Primero agregamos todos los invitados que no tienen padre (raíces)
    guests.forEach(guest => {
      if (!guest.father && !processed.has(guest._id)) {
        result.push(guest);
        processed.add(guest._id);
        
        // Buscamos y agregamos todos los hijos de este invitado
        const addChildren = (parentId: string) => {
          guests.forEach(child => {
            if (child.father === parentId && !processed.has(child._id)) {
              // Agregamos la propiedad isChild y parentName para indicar que está después de su padre
              const childWithFlag = { 
                ...child, 
                isChild: true,
                parentName: guest.nombre || 'Sin nombre' // Usando la propiedad correcta 'nombre'
              };
              result.push(childWithFlag);
              processed.add(child._id);
              // Recursivamente agregamos los nietos
              addChildren(child._id);
            }
          });
        };
        
        addChildren(guest._id);
      }
    });
    
    // Agregamos cualquier invitado restante que no haya sido procesado
    guests.forEach(guest => {
      if (!processed.has(guest._id)) {
        result.push(guest);
        processed.add(guest._id);
      }
    });
    
    return result;
  }, [filterGuests?.noSentados]);

  return (
    <>
      <div className="w-full" >
        {sortedGuests.map((invitado, index) => (
          <div key={invitado._id} className="flex items-center">
            <DragInvitado
              key={invitado._id}
              tipo={"invitado"}
              index={index}
              invitado={invitado}
              editInv={editInv}
              setEditInv={setEditInv}
              setSelected={setSelected}
            />
          </div>
        ))}
      </div>
      <style jsx>
          {`
          ul {
            min-height: 15rem
          }
          `}
      </style>
    </>
  );
};

export default ListInvitados;
