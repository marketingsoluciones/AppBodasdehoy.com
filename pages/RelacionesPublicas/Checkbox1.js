import React, { useState } from 'react';

const Checkbox = () => {
  const [isChecked, setIsChecked] = useState(false);

  const handleOnChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div className="inline-flex items-center">
      <label className="flex items-center p-3 rounded-full cursor-pointer" htmlFor="checkbox">
        <input
          type="checkbox"
          className="form-checkbox h-4 w-4  text-indigo-600 accent-rosa"
          id="checkbox"
          checked={isChecked}
          onChange={handleOnChange}
        />
        <span className="absolute text-white rounded-full transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
          </svg>
        </span>
      </label>
    </div>
  );
};

export default Checkbox;