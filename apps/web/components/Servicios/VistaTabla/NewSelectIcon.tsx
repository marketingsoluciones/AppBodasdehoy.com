import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Anillos, FuegosArtificiales, Baile, Baile2, Brindis, Carro, Cena, Cocteles, Comida, Fotografo, Iglesia, Maquillaje, Merienda, Novios, Salida, SesionFotos, Sol, Torta, Vestido, Dress } from "../../icons";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

interface IconData {
  title: string;
  icon: React.ReactElement;
  category: string;
  keywords: string[];
}

export const IconArray: IconData[] = [
  {
    title: "Anillos",
    icon: <Anillos className="w-full h-full" />,
    category: "ceremonia",
    keywords: ["anillos", "boda", "compromiso", "matrimonio"]
  },
  {
    title: "Iglesia",
    icon: <Iglesia className="w-full h-full" />,
    category: "ceremonia",
    keywords: ["iglesia", "ceremonia", "religioso", "misa"]
  },
  {
    title: "Novios",
    icon: <Novios className="w-full h-full" />,
    category: "ceremonia",
    keywords: ["novios", "pareja", "amor"]
  },
  {
    title: "Cena",
    icon: <Cena className="w-full h-full" />,
    category: "comida",
    keywords: ["cena", "comida", "banquete", "restaurante"]
  },
  {
    title: "Comida",
    icon: <Comida className="w-full h-full" />,
    category: "comida",
    keywords: ["comida", "almuerzo", "platos"]
  },
  {
    title: "Cocteles",
    icon: <Cocteles className="w-full h-full" />,
    category: "comida",
    keywords: ["cocteles", "bebidas", "bar", "tragos"]
  },
  {
    title: "Merienda",
    icon: <Merienda className="w-full h-full" />,
    category: "comida",
    keywords: ["merienda", "cafe", "té", "snack"]
  },
  {
    title: "Brindis",
    icon: <Brindis className="w-full h-full" />,
    category: "comida",
    keywords: ["brindis", "champagne", "celebración"]
  },
  {
    title: "Torta",
    icon: <Torta className="w-full h-full" />,
    category: "comida",
    keywords: ["torta", "pastel", "postre", "dulce"]
  },
  {
    title: "Baile",
    icon: <Baile className="w-full h-full" />,
    category: "entretenimiento",
    keywords: ["baile", "fiesta", "música", "diversión"]
  },
  {
    title: "Baile2",
    icon: <Baile2 className="w-full h-full" />,
    category: "entretenimiento",
    keywords: ["baile", "vals", "primera", "danza"]
  },
  {
    title: "FuegosArtificiales",
    icon: <FuegosArtificiales className="w-full h-full" />,
    category: "entretenimiento",
    keywords: ["fuegos", "artificiales", "pirotecnia", "espectáculo"]
  },
  {
    title: "Fotografo",
    icon: <Fotografo className="w-full h-full" />,
    category: "servicios",
    keywords: ["fotografo", "fotos", "cámara", "sesión"]
  },
  {
    title: "SesionFotos",
    icon: <SesionFotos className="w-full h-full" />,
    category: "servicios",
    keywords: ["sesion", "fotos", "book", "retrato"]
  },
  {
    title: "Maquillaje",
    icon: <Maquillaje className="w-full h-full" />,
    category: "servicios",
    keywords: ["maquillaje", "makeup", "belleza", "estética"]
  },
  {
    title: "Vestido",
    icon: <Vestido className="w-full h-full" />,
    category: "vestuario",
    keywords: ["vestido", "novia", "traje", "ropa"]
  },
  {
    title: "Dress",
    icon: <Dress className="w-full h-full" />,
    category: "vestuario",
    keywords: ["vestido", "elegante", "gala", "outfit"]
  },
  {
    title: "Carro",
    icon: <Carro className="w-full h-full" />,
    category: "transporte",
    keywords: ["carro", "auto", "transporte", "vehículo"]
  },
  {
    title: "Salida",
    icon: <Salida className="w-full h-full" />,
    category: "transporte",
    keywords: ["salida", "despedida", "viaje", "luna de miel"]
  },
  {
    title: "Sol",
    icon: <Sol className="w-full h-full" />,
    category: "otros",
    keywords: ["sol", "día", "clima", "exterior"]
  }
];

const categories = [
  { id: 'todos', name: 'Todos' },
  { id: 'ceremonia', name: 'Ceremonia' },
  { id: 'comida', name: 'Comida y Bebida' },
  { id: 'entretenimiento', name: 'Entretenimiento' },
  { id: 'servicios', name: 'Servicios' },
  { id: 'vestuario', name: 'Vestuario' },
  { id: 'transporte', name: 'Transporte' },
  { id: 'otros', name: 'Otros' }
];

export const NewSelectIcon: React.FC<Props> = ({ value, onChange, onClose }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus search input when modal opens
    searchInputRef.current?.focus();

    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Filter icons based on search and category
  const filteredIcons = IconArray.filter(icon => {
    const matchesSearch = searchTerm === '' ||
      icon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'todos' || icon.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onKeyDown={handleKeyDown}>
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl w-[600px] max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('Seleccionar icono')}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('Buscar iconos...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${selectedCategory === category.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredIcons.length > 0 ? (
            <div className="grid grid-cols-6 gap-3">
              {filteredIcons.map((iconData) => (
                <button
                  key={iconData.title}
                  onClick={() => onChange(iconData.title)}
                  onMouseEnter={() => setHoveredIcon(iconData.title)}
                  onMouseLeave={() => setHoveredIcon(null)}
                  className={`relative group aspect-square p-3 rounded-lg transition-all duration-200 ${value === iconData.title
                    ? 'bg-primary text-white shadow-lg scale-105'
                    : 'bg-gray-50 hover:bg-primary hover:scale-105 text-white'
                    }`}
                >
                  <div className={`w-full h-full transition-colors ${value === iconData.title ? 'text-white' : 'text-primary'
                    }`}>
                    {iconData.icon}
                  </div>

                  {/* Tooltip */}
                  {hoveredIcon === iconData.title && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                      {iconData.title}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}

                  {/* Selected indicator */}
                  {value === iconData.title && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500">{t('No se encontraron iconos')}</p>
              <p className="text-sm text-gray-400 mt-1">{t('Intenta con otros términos de búsqueda')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {value && (
                <span className="flex items-center gap-2">
                  <span>{t('Seleccionado:')}</span>
                  <span className="font-medium text-gray-700">{value}</span>
                </span>
              )}
            </div>
            {/*             <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t('Cancelar')}
              </button>
              <button
                onClick={() => {
                  if (value) onClose();
                }}
                disabled={!value}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('Confirmar')}
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};