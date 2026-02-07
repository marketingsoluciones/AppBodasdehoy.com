import React from 'react';
import { Bell } from 'lucide-react';

const WeddingHeader = ({ 
  clientName, 
  weddingDate, 
  type,
  plannerName,
  notifications = 0,
  onNotificationClick 
}) => {
  return (
    <div className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-screen-xl mx-auto px-3">
        <div className="flex flex-col md:flex-row items-center justify-between py-2">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Wedding Finance Manager</h1>
              <p className="text-xs text-gray-600">Sistema de Gestión Financiera para Bodas</p>
            </div>
            <div className="border-l pl-4 ml-4">
              <p className="text-xs text-gray-500">Evento</p>
              <p className="font-semibold capitalize">{clientName}</p>
              <p className="text-xs text-gray-600 capitalize">{type}: {new Date(parseInt(weddingDate)).toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}</p>
            </div>
          </div>
          {/* <div className="flex items-center space-x-3">
            <button 
              onClick={onNotificationClick}
              className="relative p-1 text-gray-600 hover:text-gray-800"
            >
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              )}
            </button>
             <div className="text-right">
              <p className="text-xs text-gray-500">Wedding Planner</p>
              <p className="font-semibold text-sm">{plannerName}</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default WeddingHeader;