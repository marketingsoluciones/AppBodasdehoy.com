import { Dispatch, FC, SetStateAction } from 'react';
import { IoCloseOutline } from "react-icons/io5";

interface OptionsTableModalProps {
    showOptionsModal:any;
    setShowOptionsModal: any;
}

export const OptionsTableModal: FC<OptionsTableModalProps> = ({ showOptionsModal, setShowOptionsModal }) => {

    console.log(showOptionsModal)
    return (
        <div className="absolute top-12 right-3 bg-white shadow-lg rounded border z-50 w-48 max-w-[calc(100vw-24px)]">
            <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 text-sm">Opciones disponibles</h3>
                    <button
                        onClick={() => setShowOptionsModal({ show: false })}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <IoCloseOutline className="w-3 h-3" />
                    </button>
                </div>
            </div>
            <div className="p-3 space-y-3">
                {showOptionsModal.availableOptions?.map((option, index) => (
                    <div key={index}>
                        {option.icon && typeof option.icon !== 'boolean' && !option.onClick ? (
                            <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded border">
                                <div className="text-gray-500 text-sm">
                                    {option.icon}
                                </div>
                                <span className="text-xs font-medium text-gray-700">{option.title}</span>
                            </div>
                        ) : option.onClick ? (
                            <button
                                onClick={() => {
                                    option.onClick(showOptionsModal.info);
                                    setShowOptionsModal({ show: false });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 rounded transition-colors border border-transparent hover:border-gray-200"
                            >
                                <div className="text-gray-500 text-sm">
                                    {option.icon && typeof option.icon !== 'boolean' && option.icon}
                                </div>
                                <span className="text-xs text-gray-700">{option.title}</span>
                            </button>
                        ) : (
                            <div className="text-xs text-gray-600 font-medium px-2">
                                {option.title}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};