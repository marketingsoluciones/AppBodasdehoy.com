import React, { useState, useEffect, ComponentType, FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Interweave } from "interweave"
import { HashtagMatcher, Link, UrlMatcher, UrlProps } from "interweave-autolink"
import { IoMdCall } from 'react-icons/io';
import { BiLinkExternal } from 'react-icons/bi';
import { PiClipboardTextBold } from 'react-icons/pi';
import { TemplateWathsappBusinessValues } from './WhatsappBusinessEditorComponent';
import { BsReply } from 'react-icons/bs';
import { EventContextProvider } from '../../context/EventContext';

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

interface Props {
  values: TemplateWathsappBusinessValues;
  variableMap: any[];
}
// Componente de vista previa de WhatsApp
export const WhatsappBusinessPreview: FC<Props> = ({ values, variableMap }) => {

  const headerType = values?.headerType ?? { _id: "none", title: "NONE" }
  const headerContent = values?.headerContent ?? ""
  const bodyContent = values?.bodyContent ?? ""
  const footerContent = values?.footerContent ?? ""
  const buttons = values?.buttons ?? []
  const { event } = EventContextProvider();
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
  const formattedHeaderEvent = headerType._id === 'image_event' ? `${process.env.NEXT_PUBLIC_BASE_URL}${event?.imgEvento?.i1024}` : '';
  // Manejar headerContent según su tipo
  let formattedHeader: string = '';
  if (headerType._id === 'text') {
    formattedHeader = replaceVariables(headerContent as string, variableMap);
  } else if (headerType._id === 'image' || headerType._id === 'video') {
    formattedHeader = headerContent as string;
  }

  return (
    <div className="md:w-[332px] h-max flex items-start justify-center pt-4 pb-16">
      <div className="w-full max-w-sm h-[600px] bg-gray-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
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
          <div className="bg-white rounded-r-lg rounded-b-lg shadow-sm max-w-[85%] mr-auto ml-0 break-words">
            <div className="p-2 pb-0">
              {headerType._id === 'text' && headerContent && (
                <div className="font-semibold text-gray-800 text-[16px] font-optimistic mb-2" >{formattedHeader}</div>
              )}
              {headerType._id === 'image' && headerContent && (
                <img src={formattedHeader} alt="Header Preview" className="w-full h-auto rounded-md mb-2" />
              )}
              {headerType._id === 'image_event' && headerContent && (
                <img src={formattedHeaderEvent} alt="Header Preview" className="w-full h-auto rounded-md mb-2" />
              )}
              {headerType._id === 'video' && headerContent && (
                <div className="w-full rounded-md mb-2 bg-white  overflow-hidden">
                  <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                    <video
                      src={formattedHeader}
                      controls
                      className="absolute top-0 left-0 w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="text-[13.6px] font-segoe-historic leading-[1rem]">
                <Interweave
                  className="transition-all"
                  content={formattedBody}
                />
              </div>


              {footerContent && (
                <p className="text-[13px] text-gray-500 mt-2 font-light font-segoe-historic">{footerContent}</p>
              )}
              <div className="text-right text-[11px] font-light font-segoe-historic text-gray-400 mt-1">{getCurrentFormattedDateTime().split(' ')[1]}</div>
            </div>

            {buttons.length > 0 && (
              <div className="">
                {buttons.slice(0, buttons.length > 3 ? 2 : buttons.length).map((btn, idx) => {
                  const getButtonStyle = (type: string) => {
                    switch (type) {
                      case 'QUICK_REPLY':
                        return { color: '#34B7F1', borderTop: '1px solid #e5e7eb' };
                      case 'URL':
                        return { color: '#34B7F1', borderTop: '1px solid #e5e7eb' };
                      case 'PHONE_NUMBER':
                        return { color: '#34B7F1', borderTop: '1px solid #e5e7eb' };
                      case 'WHATSAPP':
                        return { color: '#25D366', borderTop: '1px solid #e5e7eb' };
                    }
                  };

                  return (
                    <div
                      key={idx}
                      className="w-full text-[14px] font-segoe-historic py-2 text-center flex items-center justify-center gap-1"
                      style={getButtonStyle(btn.type)}
                    >
                      {["WHATSAPP", "PHONE_NUMBER"].includes(btn.type) && <IoMdCall className="h-4 w-4" />}
                      {btn.type === "URL" && <BiLinkExternal className="h-4 w-4" />}
                      {btn.type === "QUICK_REPLY" && < BsReply className="h-4 w-4" />}

                      {btn.text}
                    </div>

                  );
                })}
                {buttons.length > 3 && <div
                  style={{ color: '#34B7F1', borderTop: '1px solid #e5e7eb' }}
                  className="w-full text-[14px] font-segoe-historic py-2 text-center flex items-center justify-center gap-1"
                >
                  < PiClipboardTextBold className="h-4 w-4" />
                  {t("Ver todas las opciones")}
                </div>}
              </div>
            )}
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