import React, { useState, useRef, useEffect } from 'react';
import { User, X, Plus, Search } from 'lucide-react';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { GruposResponsablesArry } from '../MicroComponente/ResponsableSelector';
import { ImageAvatar } from '../../Utils/ImageAvatar';
import { useAllowed } from '../../../hooks/useAllowed';
import { useTranslation } from 'react-i18next';
import ClickAwayListener from 'react-click-away-listener';

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  onClose: () => void;
}

export const ClickUpResponsableSelector: React.FC<Props> = ({
  value = [], // Valor por defecto para evitar problemas
  onChange,
  onClose
}) => {
  const { t } = useTranslation();
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();
  const [isAllowed, ht] = useAllowed();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'personas' | 'grupos'>('personas');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Validar permisos al montar el componente
  useEffect(() => {
    if (!isAllowed()) {
      ht();
      onClose();
      return;
    }
  }, [isAllowed, ht, onClose]);

  const allUsers = [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])].filter(Boolean);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  const filteredPersonas = allUsers.filter(person => {
    if (!person) return false;
    const name = person.displayName || person.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredGrupos = GruposResponsablesArry.filter(grupo =>
    grupo.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleSelection = (item: string) => {
    if (!isAllowed()) {
      ht();
      return;
    }
    const newValue = value.includes(item)
      ? value.filter(v => v !== item)
      : [...value, item];
    onChange(newValue);
  };

  const handleClearAll = () => {
    if (!isAllowed()) {
      ht();
      return;
    }
    onChange([]);
  };

  const renderPersonas = () => (
    <div className="space-y-1">
      {filteredPersonas.map((person, index) => {
        const name = person.displayName || person.email || 'Usuario sin nombre';
        const isSelected = value.includes(name);
        return (
          <div
            key={`person-${index}`}
            onClick={() => handleToggleSelection(name)}
            className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
              isSelected ? 'bg-pink-50 border border-pink-200' : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              <ImageAvatar user={person} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {person.displayName || 'Sin nombre'}
              </p>
              {person.email && (
                <p className="text-xs text-gray-500 truncate">{person.email}</p>
              )}
            </div>
            {isSelected && (
              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
        );
      })}
      {filteredPersonas.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          {searchTerm ? t('No se encontraron personas con ese nombre') : t('No hay personas disponibles')}
        </div>
      )}
    </div>
  );

  const renderGrupos = () => (
    <div className="space-y-1">
      {filteredGrupos.map((grupo, index) => {
        const isSelected = value.includes(grupo.title);
        return (
          <div
            key={`grupo-${index}`}
            onClick={() => handleToggleSelection(grupo.title)}
            className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
              isSelected ? 'bg-pink-50 border border-pink-200' : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              <img src={grupo.icon} alt={grupo.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{grupo.title}</p>
            </div>
            {isSelected && (
              <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
        );
      })}
      {filteredGrupos.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          {searchTerm ? t('No se encontraron grupos con ese nombre') : t('No hay grupos disponibles')}
        </div>
      )}
    </div>
  );

  // Si no tiene permisos, no renderizar nada
  if (!isAllowed()) {
    return null;
  }

  return (
    <ClickAwayListener onClickAway={onClose}>
      <div
        ref={dropdownRef}
        className="absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg"
        style={{ top: '100%', left: 0 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">{t('Asignar responsables')}</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('Buscar...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary"
              autoFocus
            />
          </div>
          {/* Tabs */}
          <div className="flex mt-3 bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setActiveTab('personas')}
              className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                activeTab === 'personas'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Personas')}
            </button>
            <button
              onClick={() => setActiveTab('grupos')}
              className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                activeTab === 'grupos'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Grupos')}
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {activeTab === 'personas' ? renderPersonas() : renderGrupos()}
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {value.length} {t('seleccionado')}{value.length !== 1 ? 's' : ''}
            </span>
            {value.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-[#ff2525] hover:text-red-700 transition-colors"
              >
                {t('Limpiar todo')}
              </button>
            )}
          </div>
          {/* Mostrar seleccionados */}
          {value.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {value.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
                >
                  {item}
                  <button
                    onClick={() => handleToggleSelection(item)}
                    className="ml-1 hover:text-[#ff2525]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </ClickAwayListener>
  );
};