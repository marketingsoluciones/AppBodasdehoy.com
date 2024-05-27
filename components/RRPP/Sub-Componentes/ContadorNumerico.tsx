// NumericCounter.tsx

import React, { useState, FC } from 'react';

interface propsNumericCounter {
  setCount: any
  count: any
}

const NumericCounter: FC<propsNumericCounter> = ({ setCount, count }) => {
 /*  const [count, setCount] = useState<number>(1); */ // Inicializamos el contador en 15

  const decreaseCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const increaseCount = () => {
    if (count < 30) {
      setCount(count + 1);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        className=" bg-gray-500 hover:bg-[#4189b9] text-white font-bold py-4 px-6 rounded-full"
        onClick={decreaseCount}
      >
        -
      </button>
      <span className="mx-4 text-xl">{count}</span>
      <button
        className="bg-[#6096B9] hover:bg-[#4189b9] text-white font-bold py-4 px-6 rounded-full"
        onClick={increaseCount}
      >
        +
      </button>
    </div>
  );
};

export default NumericCounter;