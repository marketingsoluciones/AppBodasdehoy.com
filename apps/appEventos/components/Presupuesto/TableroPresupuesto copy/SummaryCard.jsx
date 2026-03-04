import { useRouter } from "next/navigation";
import React from "react";

const SummaryCard = ({
  title,
  amount,
  subtitle,
  icon: Icon,
  iconColor,
  bgColor,
  textColor,
  percentage,
  description,
}) => {
  const router = useRouter();

  const Redirection = () => {
    if (subtitle === 'Total'){
      router.push('/presupuesto')
    }else{
      null
    }

  }


  return (
    <div
      className="bg-white rounded-xl shadow-sm p-3 hover:shadow-lg transition-shadow"
      onClick={() => Redirection()}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-7 h-7 ${iconColor}`} />
        <span
          className={`text-xs ${bgColor} ${textColor} px-1.5 py-0.5 rounded-full`}
        >
          {subtitle}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{title}</p>
      <p className={`text-xl font-bold ${textColor || "text-gray-800"}`}>
        ${amount?.toLocaleString()}
      </p>
      {(percentage || description) && (
        <p className="text-xs text-gray-500 mt-1">
          {percentage ? `${percentage}%` : ""} {description}
        </p>
      )}
    </div>
  );
};

export default SummaryCard;
