import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Función auxiliar para formatear un número añadiendo un cero inicial si es menor que 10.
const padZero = (num) => {
  return num < 10 ? '0' + num : String(num);
};

// Función auxiliar para obtener la fecha y hora actual en el formato YYYY-MM-DD HH:mm.
const getCurrentFormattedDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = padZero(now.getMonth() + 1);
  const day = padZero(now.getDate());
  const hours = padZero(now.getHours());
  const minutes = padZero(now.getMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// Componente de vista previa de WhatsApp
export const WhatsappPreview = ({ headerType, headerContent, bodyContent, footerContent, buttons, variableMap }) => {
  console.log(buttons);
  const { t } = useTranslation();
  // Función para reemplazar variables con ejemplos del variableMap
  const replaceVariables = (text, currentVariableMap) => {
    // Verificar que text sea una cadena válida
    if (!text || typeof text !== 'string') {
      return '';
    }

    let processedText = text;
    // Regex para encontrar variables en formato {{params.XYZ}}
    const matches = text.match(/\{\{params\.[a-zA-Z0-9_]+\}\}/g);
    if (matches) {
      matches.forEach(match => {
        const variableInfo = currentVariableMap[match];
        if (variableInfo && variableInfo.sample !== undefined) {
          processedText = processedText.replace(match, variableInfo.sample);
        } else {
          processedText = processedText.replace(match, '[Variable Desconocida]');
        }
      });
    }
    return processedText;
  };

  const formattedBody = replaceVariables(bodyContent, variableMap);
  const formattedHeader = headerType === 'text' ? replaceVariables(headerContent, variableMap) : headerContent;

  return (
    <div className="w-full md:w-[350px] p-4 flex justify-center items-center">
      <div className="relative w-full max-w-sm h-[600px] bg-gray-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        {/* Phone Header */}
        <div className="bg-emerald-600 text-white p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h14" />
            </svg>
            <div className="rounded-full bg-white bg-opacity-20 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="font-semibold">{t("Guest")}</span>
          </div>
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 p-4 bg-gray-100 overflow-y-auto">
          {/* Message Bubble */}
          <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] ml-auto mr-0 break-words">
            {headerType === 'text' && headerContent && (
              <div className="font-semibold text-gray-800 text-[14px] mb-1 font-['Helvetica']" dangerouslySetInnerHTML={{ __html: formattedHeader }}></div>
            )}
            {headerType === 'image' && headerContent && (
              <img src={formattedHeader} alt="Header Preview" className="w-full h-auto rounded-md mb-2" />
            )}

            <p className="text-[13.5px] font-['Helvetica']" dangerouslySetInnerHTML={{ __html: formattedBody }}></p>

            {footerContent && (
              <p className="text-[13px] text-gray-500 mt-2 font-['Helvetica']">{footerContent}</p>
            )}

            {buttons.length > 0 && (
              <div className="mt-2 border-t border-gray-200 pt-2 -mx-3 px-3">
                {buttons.map((btn, idx) => {
                  const getButtonStyle = (type: string) => {
                    switch (type) {
                      case 'QUICK_REPLY':
                        return { backgroundColor: '#E0F2F1', color: '#075E54' };
                      case 'URL':
                        return { backgroundColor: '#34B7F1', color: 'white' };
                      case 'PHONE_NUMBER':
                        return { backgroundColor: '#34B7F1', color: 'white' };
                      case 'WHATSAPP':
                        return { backgroundColor: '#25D366', color: 'white' };
                      default:
                        return { backgroundColor: '#34B7F1', color: 'white' };
                    }
                  };

                  return (
                    <button
                      key={idx}
                      className="w-full text-sm py-2 px-3 rounded-md mb-1 last:mb-0 hover:opacity-80 transition-colors"
                      style={getButtonStyle(btn.type)}
                    >
                      {btn.text}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="text-right text-xs text-gray-400 mt-1">{getCurrentFormattedDateTime().split(' ')[1]}</div>
          </div>
        </div>
        {/* Phone Footer (Input Area) */}
        <div className="bg-white p-3 flex items-center border-t border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <input
            type="text"
            placeholder={t("Write a message...")}
            className="flex-1 p-2 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none"
            disabled
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13.5" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.625A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.625A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-500 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
      </div>
    </div>
  );
};