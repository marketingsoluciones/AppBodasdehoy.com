import React, { useState } from 'react';

interface SwitchProps {
  isOn: boolean;
  onToggle: (newValue: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ isOn, onToggle }) => {
  const [internalIsOn, setInternalIsOn] = useState(isOn);

  const handleToggle = () => {
    const newValue = !internalIsOn;
    setInternalIsOn(newValue);
    onToggle(newValue);
  };

  return (
    <div className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors duration-200 focus:outline-none ${internalIsOn ? 'bg-primary' : 'bg-gray-200'}`}
      onClick={handleToggle} >
      <span className={`inline-block h-5 w-5 rounded-full bg-white transform transition-transform duration-200 ${internalIsOn ? 'translate-x-6' : 'translate-x-1'}`} />
    </div>
  );
};