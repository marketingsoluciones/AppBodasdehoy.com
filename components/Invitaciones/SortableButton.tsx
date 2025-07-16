import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MdDragIndicator } from "react-icons/md";
import InputField from '../Forms/InputField';

interface Button {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'WHATSAPP';
  text: string;
  url?: string;
  phoneNumber?: string;
  example?: string;
}

interface SortableButtonProps {
  button: Button;
  index: number;
  setFieldValue: (field: string, value: any) => void;
  removeButton: (index: number, setFieldValue: any) => void;
  t: (key: string) => string;
}

export const SortableButton: React.FC<SortableButtonProps> = ({
  button,
  index,
  setFieldValue,
  removeButton,
  t
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-2 p-4 border border-gray-300 rounded-md bg-blue-50 relative cursor-move"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 text-gray-400 hover:text-gray-600 cursor-move p-1"
      >
        <MdDragIndicator className="h-5 w-5" />
      </div>
      <button
        type="button"
        onClick={() => removeButton(index, setFieldValue)}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        title={t("Remove button")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 3a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      </button>
      <h3 className="text-lg font-medium text-gray-800 mb-2 ml-6">{t("Button")} {index + 1} ({button.type.replace('_', ' ')})</h3>

      <div className="mb-2">
        <InputField
          name={`buttons.${index}.text`}
          label={t("Button Text")}
          type="text"
          maxLength={25}
        />
      </div>

      {button.type === 'URL' && (
        <div className="mb-2">
          <InputField
            name={`buttons.${index}.url`}
            label={t("URL")}
            type="text"
            placeholder={t("e.g. https://yourdomain.com/order/{{params.nameEvent}}")}
            maxLength={2000}
          />
          <p className="text-gray-500 text-xs mt-1">{t("You can use variables like {{params.nameEvent}} for dynamic URLs.")}</p>

          {button.url?.includes('{{params.') && (
            <div className="mt-2">
              <InputField
                name={`buttons.${index}.example`}
                label={t("Dynamic URL Example")}
                type="text"
                placeholder={t("e.g. https://yourdomain.com/order/12345")}
                maxLength={2000}
              />
            </div>
          )}
        </div>
      )}

      {button.type === 'PHONE_NUMBER' && (
        <div className="mb-2">
          <InputField
            name={`buttons.${index}.phoneNumber`}
            label={t("Phone Number")}
            type="telefono"
            placeholder={t("e.g. +1234567890")}
            maxLength={20}
          />
        </div>
      )}

      {button.type === 'WHATSAPP' && (
        <div className="mb-2">
          <InputField
            name={`buttons.${index}.phoneNumber`}
            label={t("WhatsApp Number")}
            type="text"
            placeholder={t("e.g. +1234567890")}
            maxLength={20}
          />
          <p className="text-gray-500 text-xs mt-1">{t("This will open WhatsApp with the specified number.")}</p>
        </div>
      )}
    </div>
  );
}; 