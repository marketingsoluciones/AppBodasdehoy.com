import React, { useState, useRef, useEffect } from 'react';
import { User, X, Plus, Search } from 'lucide-react';
import { AuthContextProvider, EventContextProvider } from '../../../context';
import { GruposResponsablesArry } from '../MicroComponente/ResponsableSelector';
import { ImageAvatar } from '../../Utils/ImageAvatar';

interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  onClose: () => void;
}

export const ClickUpResponsableSelector: React.FC<Props> = ({
  value,
  onChange,
  onClose
}) => {
  const { user } = AuthContextProvider();
  const { event } = EventContextProvider();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'personas' | 'grupos'>('personas');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allUsers = [user, event?.detalles_usuario_id, ...(event?.detalles_compartidos_array || [])];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    const newValue = value.includes(item)
      ? value.filter(v => v !== item)
      : [...value, item];
    onChange(newValue);
  };

  const renderPersonas = () => (
    <div className="space-y-1">
      {filteredPersonas.map((person, index) => {
        const name = person.displayName || person.email;
        const isSelected = value.includes(name);
        
        return (
          <div
            key={`person-${index}`}
            onClick={() => handleToggleSelection(name)}
            className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
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
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
        );
      })}
      {filteredPersonas.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No se encontraron personas
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
              isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
              <img src={grupo.icon} alt={grupo.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{grupo.title}</p>
            </div>
            {isSelected && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          </div>
        );
      })}
      {filteredGrupos.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No se encontraron grupos
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg"
      style={{ top: '100%', left: 0 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Asignar responsables</h3>
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
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500"
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
            Personas
          </button>
          <button
            onClick={() => setActiveTab('grupos')}
            className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
              activeTab === 'grupos'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grupos
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-64 overflow-y-auto">
        {activeTab === 'personas' ? renderPersonas() : renderGrupos()}
      </div>

      {/* Footer */}
      {value.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {value.length} seleccionado{value.length > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => onChange([])}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Limpiar todo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};