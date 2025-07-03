import React from 'react';
import { IoSettingsOutline } from "react-icons/io5";

interface AccionesCellProps {
  onOptionsClick: (e: React.MouseEvent) => void;
}

export const AccionesCell: React.FC<AccionesCellProps> = ({ onOptionsClick }) => {
  return (
   <button 
  className="text-gray-400 hover:text-gray-600 p-0.5"
  onClick={onOptionsClick}
  data-options-trigger="true"
>
  <IoSettingsOutline size={12} />
</button>
  );
};