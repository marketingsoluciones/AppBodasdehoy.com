import { FC } from "react";

export const Separator: FC<any> = ({ title }) => (
  <>
    <div className="bg-white w-full shadow-lg rounded-xl ">
      <h2 className="font-display font-semibold text-gray-500 text-2xl text-left py-4">
        {title}
      </h2>
    </div>
  </>
);
