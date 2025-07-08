import { FC, ReactNode, RefObject } from "react";
import { IoCloseOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";

interface props {
  onClose: () => void;
  children: ReactNode;
}

const ModalDefault: FC<props> = ({ onClose, children }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full h-full md:w-[768px] md:h-[660px] relative">
        <div className="w-full h-full flex justify-center items-center">
          <button
            className="w-10 h-10 rounded-full bg-white absolute top-2 right-1 md:-right-12 text-gray-500 hover:text-gray-800 text-2xl font-bold focus:outline-none flex items-center justify-center"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <IoCloseOutline className="w-6 h-6" />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ModalDefault; 