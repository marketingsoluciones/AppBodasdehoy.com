'use client';

import {
  AlertCircle,
  Check,
  CheckCircle,
  Copy,
  Image as ImageIcon,
  Info,
  Palette,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import { Modal, Input, Button, Radio, message } from 'antd';

import { EVENTOS_API_CONFIG } from '@/config/eventos-api';
import { useChatStore } from '@/store/chat';
import { buildAuthHeaders } from '@/utils/authToken';

interface BrandingAsset {
  description: string;
  format: string;
  location: string;
  name: string;
  recommended_size: { height: number; width: number };
  type: string;
  url?: string;
}

interface BrandingConfig {
  background_image?: string;
  desktop_icons: Record<string, string | null>;
  development: string;
  favicons: Record<string, string | null>;
  logos: Record<string, string | null>;
  pwa_icons: Record<string, string | null>;
  social_images: Record<string, string | null>;
  ui_icons: Record<string, string | null>;
}

// Especificaciones con info de USO para el diseñador
const ASSET_USAGE_INFO: Record<string, { formats: string[]; panels: string[]; tips: string }> = {
  'apple-touch-icon': {
    formats: ['PNG'],
    panels: ['iOS Home Screen', 'Safari bookmarks', 'Apple devices'],
    tips: 'Sin transparencia. Fondo sólido recomendado.',
  },
  'background-image': {
    formats: ['JPG', 'PNG'],
    panels: ['Fondo de pantalla de login', 'Hero section'],
    tips: 'Usar imagen de alta calidad, optimizada para web.',
  },
  favicon: {
    formats: ['ICO', 'PNG'],
    panels: ['Pestaña del navegador', 'Bookmarks', 'Historial'],
    tips: 'Debe verse bien en tamaño muy pequeño. Usar colores contrastantes.',
  },
  'favicon-16': {
    formats: ['ICO', 'PNG'],
    panels: ['Pestaña del navegador (versión pequeña)'],
    tips: 'Versión ultra pequeña para navegadores legacy.',
  },
  'icon-budget': {
    formats: ['SVG'],
    panels: ['Menú lateral', 'Sección de presupuesto', 'Dashboard'],
    tips: 'Vector monocromático. El color se aplica via CSS.',
  },
  'icon-campaigns': {
    formats: ['SVG'],
    panels: ['Menú lateral', 'Sección de campañas', 'Notificaciones'],
    tips: 'Vector monocromático. El color se aplica via CSS.',
  },
  'icon-chat': {
    formats: ['SVG'],
    panels: ['Menú lateral', 'Botón de chat', 'Notificaciones'],
    tips: 'Vector monocromático. El color se aplica via CSS.',
  },
  'icon-events': {
    formats: ['SVG'],
    panels: ['Menú lateral', 'Selector de eventos', 'Dashboard'],
    tips: 'Vector monocromático. El color se aplica via CSS.',
  },
  'icon-guests': {
    formats: ['SVG'],
    panels: ['Menú lateral', 'Lista de invitados', 'Dashboard'],
    tips: 'Vector monocromático. El color se aplica via CSS.',
  },
  'icon-settings': {
    formats: ['SVG'],
    panels: ['Menú lateral', 'Botón de configuración', 'Panel de usuario'],
    tips: 'Vector monocromático. El color se aplica via CSS.',
  },
  'icon-user': {
    formats: ['SVG'],
    panels: ['Avatar placeholder', 'Menú de usuario', 'Perfil'],
    tips: 'Vector monocromático. El color se aplica via CSS.',
  },
  logo: {
    formats: ['PNG', 'SVG'],
    panels: ['Header', 'Splash screen', 'Emails', 'Sidebar colapsado'],
    tips: 'Versión principal del logo. Preferir SVG para mejor calidad.',
  },
  'logo-dark': {
    formats: ['PNG', 'SVG'],
    panels: ['Header (tema oscuro)', 'Emails con fondo oscuro'],
    tips: 'Versión para fondos oscuros. Si el logo es claro, puede ser el mismo.',
  },
  'og-image': {
    formats: ['PNG', 'JPG'],
    panels: ['Preview en Facebook', 'LinkedIn', 'WhatsApp', 'Slack'],
    tips: 'Incluir logo + texto descriptivo. El texto debe leerse bien a 600x315px.',
  },
  'pwa-icon-192': {
    formats: ['PNG'],
    panels: ['Android home screen', 'App drawer'],
    tips: 'Ícono cuadrado sin máscara. Fondo sólido recomendado.',
  },
  'pwa-icon-192-maskable': {
    formats: ['PNG'],
    panels: ['Android (iconos adaptables)', 'Diferentes formas de íconos'],
    tips: 'Safe zone: contenido importante en el 80% central.',
  },
  'pwa-icon-512': {
    formats: ['PNG'],
    panels: ['Splash screen de PWA', 'Store listing'],
    tips: 'Alta resolución. Se usará como base para otras versiones.',
  },
  'pwa-icon-512-maskable': {
    formats: ['PNG'],
    panels: ['Splash screen adaptable', 'Android 12+'],
    tips: 'Safe zone: contenido importante en el 80% central.',
  },
  'twitter-image': {
    formats: ['PNG', 'JPG'],
    panels: ['Preview en Twitter/X', 'Cards de Twitter'],
    tips: 'Ratio 2:1. Twitter puede recortar esquinas.',
  },
};

// Categorías para agrupar assets
const ASSET_CATEGORIES = [
  { key: 'logos', label: 'Logos', types: ['logo', 'logo-dark'] },
  { key: 'favicons', label: 'Favicons', types: ['favicon', 'favicon-16', 'apple-touch-icon'] },
  { key: 'pwa', label: 'PWA Icons', types: ['pwa-icon-192', 'pwa-icon-192-maskable', 'pwa-icon-512', 'pwa-icon-512-maskable'] },
  { key: 'social', label: 'Social Images', types: ['og-image', 'twitter-image'] },
  { key: 'ui', label: 'UI Icons', types: ['icon-chat', 'icon-settings', 'icon-user', 'icon-events', 'icon-guests', 'icon-budget', 'icon-campaigns'] },
  { key: 'misc', label: 'Otros', types: ['background-image'] },
];

const BrandingAdmin = () => {
  // Auto-detectar development del usuario
  const { userDevelopment, userProfile } = useChatStore((s) => ({
    userDevelopment: s.development,
    userProfile: s.userProfile,
  }));

  const isAdmin = userProfile?.roles?.includes('admin') ||
                  userProfile?.roles?.includes('superadmin') ||
                  userProfile?.permissions?.manageWhitelabels === true;

  const [development, setDevelopment] = useState(userDevelopment || 'bodasdehoy');
  const [assets, setAssets] = useState<BrandingAsset[]>([]);
  const [config, setConfig] = useState<BrandingConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<BrandingAsset | null>(null);
  const [activeCategory, setActiveCategory] = useState('logos');

  // Estados para el generador de prompts con IA
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [promptAsset, setPromptAsset] = useState<BrandingAsset | null>(null);
  const [promptSource, setPromptSource] = useState<'new' | 'existing' | 'standard'>('new');
  const [promptDescription, setPromptDescription] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [numAlternatives, setNumAlternatives] = useState(2);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  // Sincronizar development
  useEffect(() => {
    if (userDevelopment && userDevelopment !== development) {
      setDevelopment(userDevelopment);
    }
  }, [userDevelopment]);

  // Helper para construir URLs
  const buildUrl = useCallback((path: string) => {
    const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';
    const fullPath = `/api/admin/branding${path.startsWith('/') ? path : `/${path}`}`;

    if (backendURL.startsWith('/')) {
      return new URL(`${backendURL}${fullPath}`, window.location.origin).toString();
    }
    return new URL(fullPath, backendURL).toString();
  }, []);

  // Cargar assets y config
  const loadBranding = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${buildUrl('/all')}?development=${development}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      setAssets(data.assets || []);
      setConfig(data.config || null);
    } catch (err) {
      console.error('Error loading branding:', err);
      setError('Error cargando branding');
    } finally {
      setLoading(false);
    }
  }, [development, buildUrl]);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  // Subir asset
  const handleUpload = useCallback(async (assetType: string, file: File) => {
    setUploading(assetType);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${buildUrl('/upload')}?asset_type=${assetType}&development=${development}`,
        {
          body: formData,
          method: 'POST',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Error subiendo archivo');
      }

      setSuccess(`${assetType} subido correctamente`);
      await loadBranding();
    } catch (err: any) {
      setError(err.message || 'Error subiendo archivo');
    } finally {
      setUploading(null);
    }
  }, [development, buildUrl, loadBranding]);

  // Abrir modal de generación de prompts
  const openPromptModal = useCallback((asset: BrandingAsset) => {
    setPromptAsset(asset);
    setPromptSource(asset.url ? 'existing' : 'new');
    setPromptDescription('');
    setGeneratedPrompt('');
    setGeneratedImages([]);
    setSelectedImageIndex(null);
    setNumAlternatives(2);
    setPromptModalOpen(true);
  }, []);

  // Generar prompt con Gemini
  const generatePrompt = useCallback(async () => {
    if (!promptAsset) return;

    setGeneratingPrompt(true);
    try {
      const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';
      const usageInfo = ASSET_USAGE_INFO[promptAsset.type] || { formats: [], panels: [], tips: '' };

      const response = await fetch(`${backendURL}/api/chat`, {
        body: JSON.stringify({
          development: development,
          message: `Genera un prompt detallado para crear una imagen de branding con las siguientes especificaciones:

TIPO DE ASSET: ${promptAsset.name}
DIMENSIONES: ${promptAsset.recommended_size.width}x${promptAsset.recommended_size.height} píxeles
FORMATO: ${promptAsset.format.toUpperCase()}
USO: ${usageInfo.panels.join(', ')}
TIPS: ${usageInfo.tips}

DESCRIPCIÓN DEL USUARIO: ${promptDescription || 'Logo profesional y moderno para una marca de eventos'}

${promptSource === 'existing' && promptAsset.url ? `IMAGEN ACTUAL: Basarse en el estilo de la imagen existente en ${promptAsset.url}` : ''}
${promptSource === 'standard' ? 'ESTILO: Minimalista, profesional, colores sólidos, fácil de reconocer en tamaño pequeño' : ''}

Por favor genera un prompt en INGLÉS optimizado para herramientas de IA como DALL-E, Midjourney o Leonardo AI. El prompt debe:
1. Describir el diseño de forma clara y específica
2. Incluir el estilo visual (minimalista, moderno, etc.)
3. Especificar colores sugeridos
4. Mencionar que debe funcionar bien en las dimensiones indicadas
5. Incluir "white background" o "transparent background" según corresponda

RESPONDE SOLO CON EL PROMPT EN INGLÉS, SIN EXPLICACIONES ADICIONALES.`,
          model: 'auto'
        }),
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        method: 'POST'
      });

      const data = await response.json();
      setGeneratedPrompt(data.response || 'Error generando prompt');
    } catch (err) {
      console.error('Error generating prompt:', err);
      setGeneratedPrompt('Error al generar el prompt. Intenta de nuevo.');
    } finally {
      setGeneratingPrompt(false);
    }
  }, [promptAsset, promptDescription, promptSource, development]);

  // Generar múltiples alternativas de imagen
  const generateImages = useCallback(async () => {
    if (!promptAsset || !generatedPrompt) return;

    setGeneratingPrompt(true);
    setGeneratedImages([]);
    setSelectedImageIndex(null);

    try {
      const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';

      const response = await fetch(`${backendURL}/api/admin/branding/generate-image`, {
        body: JSON.stringify({
          asset_type: promptAsset.type,
          development: development,
          height: promptAsset.recommended_size.height,
          num_images: numAlternatives,
          prompt: generatedPrompt,
          width: promptAsset.recommended_size.width
        }),
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        // Puede ser una imagen o varias
        const images = data.images || (data.url ? [data.url] : []);
        setGeneratedImages(images);
        if (images.length > 0) {
          setSelectedImageIndex(0);
          messageApi.success(`¡${images.length} alternativa(s) generada(s)!`);
        }
      } else {
        messageApi.error(data.detail || data.error || 'Error generando imagen');
      }
    } catch (err: any) {
      console.error('Error generating images:', err);
      messageApi.error('Error al generar las imágenes');
    } finally {
      setGeneratingPrompt(false);
    }
  }, [promptAsset, generatedPrompt, development, numAlternatives, messageApi]);

  // Guardar la imagen seleccionada
  const saveSelectedImage = useCallback(async () => {
    if (selectedImageIndex === null || !generatedImages[selectedImageIndex] || !promptAsset) return;

    setGeneratingPrompt(true);
    try {
      const backendURL = EVENTOS_API_CONFIG.BACKEND_URL || 'http://localhost:8030';
      const imageUrl = generatedImages[selectedImageIndex];

      const response = await fetch(`${backendURL}/api/admin/branding/save-generated`, {
        body: JSON.stringify({
          asset_type: promptAsset.type,
          development: development,
          image_url: imageUrl
        }),
        headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        messageApi.success('¡Imagen guardada correctamente!');
        setPromptModalOpen(false);
        await loadBranding();
      } else {
        messageApi.error(data.error || 'Error guardando imagen');
      }
    } catch (err: any) {
      console.error('Error saving image:', err);
      messageApi.error('Error al guardar la imagen');
    } finally {
      setGeneratingPrompt(false);
    }
  }, [selectedImageIndex, generatedImages, promptAsset, development, messageApi, loadBranding]);

  // Copiar prompt al portapapeles
  const copyPrompt = useCallback(() => {
    navigator.clipboard.writeText(generatedPrompt);
    messageApi.success('Prompt copiado al portapapeles');
  }, [generatedPrompt, messageApi]);

  // Filtrar assets por categoría
  const filteredAssets = assets.filter(asset => {
    const category = ASSET_CATEGORIES.find(c => c.key === activeCategory);
    return category?.types.includes(asset.type);
  });

  return (
    <Flexbox gap={16} padding={16} style={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <Flexbox align="center" gap={8} horizontal>
          <Palette size={20} />
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Branding Admin</h2>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              Gestiona logos, iconos e imágenes de marca
            </span>
          </div>
        </Flexbox>
        <Flexbox gap={8} horizontal>
          {/* Development badge */}
          <span
            style={{
              background: '#dbeafe',
              borderRadius: '6px',
              color: '#1d4ed8',
              fontSize: '12px',
              fontWeight: 600,
              padding: '6px 12px',
            }}
          >
            {development}
          </span>
          <button
            disabled={loading}
            onClick={loadBranding}
            style={{
              alignItems: 'center',
              background: '#fff',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              fontSize: '12px',
              gap: '4px',
              padding: '6px 12px',
            }}
            type="button"
          >
            <RefreshCw className={loading ? 'animate-spin' : ''} size={14} />
            Actualizar
          </button>
        </Flexbox>
      </Flexbox>

      {/* Alerts */}
      {error && (
        <Flexbox
          align="center"
          gap={8}
          horizontal
          style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', padding: '10px 14px' }}
        >
          <AlertCircle size={16} />
          <span style={{ flex: 1, fontSize: '13px' }}>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} type="button">
            <X size={14} />
          </button>
        </Flexbox>
      )}

      {success && (
        <Flexbox
          align="center"
          gap={8}
          horizontal
          style={{ background: '#ecfdf5', border: '1px solid #d1fae5', borderRadius: '6px', color: '#059669', padding: '10px 14px' }}
        >
          <CheckCircle size={16} />
          <span style={{ flex: 1, fontSize: '13px' }}>{success}</span>
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} type="button">
            <X size={14} />
          </button>
        </Flexbox>
      )}

      {/* Category Tabs */}
      <Flexbox gap={8} horizontal style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        {ASSET_CATEGORIES.map((cat) => {
          const categoryAssets = assets.filter(a => cat.types.includes(a.type));
          const configuredCount = categoryAssets.filter(a => a.url).length;

          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                background: activeCategory === cat.key ? '#667eea' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: activeCategory === cat.key ? '#fff' : '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeCategory === cat.key ? 600 : 400,
                padding: '8px 14px',
              }}
              type="button"
            >
              {cat.label}
              <span
                style={{
                  background: activeCategory === cat.key ? 'rgba(255,255,255,0.3)' : '#e5e7eb',
                  borderRadius: '10px',
                  fontSize: '11px',
                  marginLeft: '6px',
                  padding: '2px 6px',
                }}
              >
                {configuredCount}/{cat.types.length}
              </span>
            </button>
          );
        })}
      </Flexbox>

      {/* Assets Grid */}
      <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {loading ? (
          <div style={{ color: '#9ca3af', padding: '40px', textAlign: 'center' }}>Cargando...</div>
        ) : filteredAssets.length === 0 ? (
          <div style={{ color: '#9ca3af', padding: '40px', textAlign: 'center' }}>No hay assets en esta categoría</div>
        ) : (
          filteredAssets.map((asset) => {
            const usageInfo = ASSET_USAGE_INFO[asset.type] || { formats: [], panels: [], tips: '' };
            const isUploading = uploading === asset.type;
            const isConfigured = !!asset.url;

            return (
              <div
                key={asset.type}
                onClick={() => setSelectedAsset(selectedAsset?.type === asset.type ? null : asset)}
                style={{
                  background: isConfigured ? '#f0fdf4' : '#fff',
                  border: `1px solid ${selectedAsset?.type === asset.type ? '#667eea' : isConfigured ? '#d1fae5' : '#e5e7eb'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  padding: '14px',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Asset Header */}
                <Flexbox align="center" horizontal justify="space-between" style={{ marginBottom: '10px' }}>
                  <Flexbox align="center" gap={8} horizontal>
                    {isConfigured ? (
                      <Check size={16} style={{ color: '#10b981' }} />
                    ) : (
                      <ImageIcon size={16} style={{ color: '#9ca3af' }} />
                    )}
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{asset.name}</span>
                  </Flexbox>
                  <span
                    style={{
                      background: '#f3f4f6',
                      borderRadius: '4px',
                      color: '#6b7280',
                      fontSize: '10px',
                      padding: '2px 6px',
                    }}
                  >
                    {asset.recommended_size.width}x{asset.recommended_size.height}
                  </span>
                </Flexbox>

                {/* Preview */}
                {asset.url ? (
                  <div
                    style={{
                      alignItems: 'center',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      display: 'flex',
                      height: '80px',
                      justifyContent: 'center',
                      marginBottom: '10px',
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      alt={asset.name}
                      src={asset.url}
                      style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      alignItems: 'center',
                      background: '#f9fafb',
                      borderRadius: '6px',
                      color: '#9ca3af',
                      display: 'flex',
                      fontSize: '12px',
                      height: '80px',
                      justifyContent: 'center',
                      marginBottom: '10px',
                    }}
                  >
                    Sin configurar
                  </div>
                )}

                {/* Action Buttons */}
                <Flexbox gap={8} horizontal style={{ marginBottom: '8px' }}>
                  {/* Upload Button */}
                  <label
                    style={{
                      alignItems: 'center',
                      background: isUploading ? '#9ca3af' : '#667eea',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: isUploading ? 'wait' : 'pointer',
                      display: 'flex',
                      flex: 1,
                      fontSize: '12px',
                      fontWeight: 500,
                      gap: '6px',
                      justifyContent: 'center',
                      padding: '8px',
                    }}
                  >
                    <Upload size={14} />
                    {isUploading ? 'Subiendo...' : 'Subir'}
                    <input
                      accept={usageInfo.formats.map(f => `.${f.toLowerCase()}`).join(',')}
                      disabled={isUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(asset.type, file);
                        e.target.value = '';
                      }}
                      style={{ display: 'none' }}
                      type="file"
                    />
                  </label>

                  {/* Generate with AI Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openPromptModal(asset);
                    }}
                    style={{
                      alignItems: 'center',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      fontSize: '12px',
                      fontWeight: 500,
                      gap: '6px',
                      justifyContent: 'center',
                      padding: '8px 12px',
                    }}
                    type="button"
                  >
                    <Sparkles size={14} />
                    IA
                  </button>
                </Flexbox>

                {/* Expanded Info */}
                {selectedAsset?.type === asset.type && (
                  <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '12px', paddingTop: '12px' }}>
                    {/* Formats */}
                    <Flexbox gap={4} horizontal style={{ flexWrap: 'wrap', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: 500 }}>Formatos:</span>
                      {usageInfo.formats.map((format) => (
                        <span
                          key={format}
                          style={{ background: '#e5e7eb', borderRadius: '4px', fontSize: '10px', padding: '2px 6px' }}
                        >
                          {format}
                        </span>
                      ))}
                    </Flexbox>

                    {/* Usage Panels */}
                    <div style={{ marginBottom: '8px' }}>
                      <Flexbox align="center" gap={4} horizontal style={{ marginBottom: '4px' }}>
                        <Info size={12} style={{ color: '#3b82f6' }} />
                        <span style={{ color: '#3b82f6', fontSize: '11px', fontWeight: 600 }}>Dónde se usa:</span>
                      </Flexbox>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {usageInfo.panels.map((panel, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#dbeafe',
                              borderRadius: '4px',
                              color: '#1d4ed8',
                              fontSize: '10px',
                              padding: '3px 8px',
                            }}
                          >
                            {panel}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Tips */}
                    {usageInfo.tips && (
                      <div
                        style={{
                          background: '#fef3c7',
                          borderRadius: '4px',
                          color: '#92400e',
                          fontSize: '11px',
                          padding: '8px',
                        }}
                      >
                        {usageInfo.tips}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Info Panel */}
      <div
        style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px',
          marginTop: '16px',
          padding: '14px',
        }}
      >
        <Flexbox align="center" gap={8} horizontal style={{ marginBottom: '8px' }}>
          <Info size={16} style={{ color: '#0284c7' }} />
          <span style={{ color: '#0284c7', fontSize: '14px', fontWeight: 600 }}>Guía para diseñadores</span>
        </Flexbox>
        <div style={{ color: '#0369a1', fontSize: '12px', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Logos:</strong> Preferir SVG para calidad óptima. PNG con fondo transparente como alternativa.
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Íconos UI:</strong> Siempre en SVG monocromático. El color se aplica via CSS según el tema.
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>PWA Maskable:</strong> Dejar 20% de margen (safe zone) alrededor del contenido principal.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Social Images:</strong> Texto mínimo 48px. Comprobar legibilidad en preview pequeño.
          </p>
        </div>
      </div>

      {/* Modal de Generación con IA */}
      <Modal
        footer={null}
        getContainer={() => document.body}
        onCancel={() => setPromptModalOpen(false)}
        open={promptModalOpen}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
        title={
          <Flexbox align="center" gap={8} horizontal>
            <Sparkles size={20} style={{ color: '#f59e0b' }} />
            <span>Generar con IA - {promptAsset?.name}</span>
          </Flexbox>
        }
        width={650}
        zIndex={10_100}
      >
        {contextHolder}
        <div style={{ padding: '16px 0' }}>
          {/* Imagen actual (si existe) */}
          {promptAsset?.url && (
            <div style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              marginBottom: '16px',
              padding: '16px'
            }}>
              <div style={{
                alignItems: 'center',
                display: 'flex',
                fontSize: '14px',
                fontWeight: 600,
                gap: '8px',
                marginBottom: '12px'
              }}>
                <ImageIcon size={16} style={{ color: '#667eea' }} />
                Imagen actual
              </div>
              <div style={{
                alignItems: 'center',
                background: 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 16px 16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                minHeight: '120px',
                padding: '12px'
              }}>
                <img
                  alt={promptAsset.name}
                  src={promptAsset.url}
                  style={{
                    borderRadius: '6px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    maxHeight: '150px',
                    maxWidth: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
              <div style={{
                color: '#64748b',
                fontSize: '11px',
                marginTop: '8px',
                textAlign: 'center'
              }}>
                Puedes usar esta imagen como referencia para generar mejoras o variaciones
              </div>
            </div>
          )}

          {/* Información del asset */}
          <div style={{
            background: '#f3f4f6',
            borderRadius: '8px',
            marginBottom: '16px',
            padding: '12px'
          }}>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>
              <strong>Dimensiones:</strong> {promptAsset?.recommended_size.width}x{promptAsset?.recommended_size.height}px
            </div>
            <div style={{ fontSize: '13px' }}>
              <strong>Formato:</strong> {promptAsset?.format.toUpperCase()}
            </div>
          </div>

          {/* Fuente del diseño */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              ¿Desde dónde partir?
            </div>
            <Radio.Group
              onChange={(e) => setPromptSource(e.target.value)}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              value={promptSource}
            >
              <Radio value="new">Nueva descripción (escribo lo que quiero)</Radio>
              {promptAsset?.url && (
                <Radio value="existing">Basarme en la imagen actual</Radio>
              )}
              <Radio value="standard">Usar estilo estándar (minimalista, profesional)</Radio>
            </Radio.Group>
          </div>

          {/* Descripción */}
          {promptSource === 'new' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Describe lo que quieres:
              </div>
              <Input.TextArea
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="Ej: Logo moderno con el nombre 'Mi Evento', colores rosa y dorado, estilo elegante para bodas..."
                rows={3}
                value={promptDescription}
              />
            </div>
          )}

          {/* Número de alternativas */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              ¿Cuántas alternativas generar?
            </div>
            <Radio.Group
              onChange={(e) => setNumAlternatives(e.target.value)}
              style={{ display: 'flex', gap: '12px' }}
              value={numAlternatives}
            >
              <Radio.Button value={1}>1 (~$0.03)</Radio.Button>
              <Radio.Button value={2}>2 (~$0.06)</Radio.Button>
              <Radio.Button value={3}>3 (~$0.09)</Radio.Button>
              <Radio.Button value={4}>4 (~$0.12)</Radio.Button>
            </Radio.Group>
          </div>

          {/* Botón generar prompt */}
          <Button
            icon={<Sparkles size={16} />}
            loading={generatingPrompt && !generatedPrompt && generatedImages.length === 0}
            onClick={generatePrompt}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              marginBottom: '16px',
              width: '100%'
            }}
            type="primary"
          >
            {generatingPrompt && !generatedPrompt ? 'Generando prompt...' : '1. Generar Prompt con IA'}
          </Button>

          {/* Prompt generado */}
          {generatedPrompt && (
            <div style={{ marginTop: '16px' }}>
              <div style={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>
                  Prompt generado:
                </span>
                <Button
                  icon={<Copy size={14} />}
                  onClick={copyPrompt}
                  size="small"
                >
                  Copiar
                </Button>
              </div>
              <div style={{
                background: '#1f2937',
                borderRadius: '8px',
                color: '#e5e7eb',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1.5,
                maxHeight: '100px',
                overflow: 'auto',
                padding: '12px'
              }}>
                {generatedPrompt}
              </div>

              {/* Botón generar imágenes */}
              <Flexbox gap={12} horizontal style={{ marginTop: '16px' }}>
                <Button
                  icon={<Sparkles size={16} />}
                  loading={generatingPrompt && generatedImages.length === 0}
                  onClick={generateImages}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    flex: 1
                  }}
                  type="primary"
                >
                  {generatingPrompt && generatedImages.length === 0
                    ? 'Generando...'
                    : `2. Generar ${numAlternatives} alternativa(s)`}
                </Button>
                <Button
                  onClick={() => window.open('https://www.canva.com/ai-image-generator/', '_blank')}
                  style={{ flex: 1 }}
                >
                  Usar en Canva (Gratis)
                </Button>
              </Flexbox>
            </div>
          )}

          {/* Galería de alternativas */}
          {generatedImages.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                Selecciona la alternativa que más te guste:
              </div>
              <div style={{
                display: 'grid',
                gap: '12px',
                gridTemplateColumns: `repeat(${Math.min(generatedImages.length, 2)}, 1fr)`
              }}>
                {generatedImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    style={{
                      border: selectedImageIndex === idx
                        ? '3px solid #10b981'
                        : '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      padding: '4px',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <img
                      alt={`Alternativa ${idx + 1}`}
                      src={imgUrl}
                      style={{
                        borderRadius: '6px',
                        display: 'block',
                        height: 'auto',
                        width: '100%'
                      }}
                    />
                    <div style={{
                      background: selectedImageIndex === idx ? '#10b981' : '#f3f4f6',
                      borderRadius: '4px',
                      color: selectedImageIndex === idx ? '#fff' : '#6b7280',
                      fontSize: '12px',
                      fontWeight: 600,
                      marginTop: '6px',
                      padding: '4px 8px',
                      textAlign: 'center'
                    }}>
                      {selectedImageIndex === idx ? '✓ Seleccionada' : `Alternativa ${idx + 1}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botón guardar */}
              <Button
                disabled={selectedImageIndex === null}
                icon={<Check size={16} />}
                loading={generatingPrompt}
                onClick={saveSelectedImage}
                style={{
                  background: selectedImageIndex !== null
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#9ca3af',
                  border: 'none',
                  marginTop: '16px',
                  width: '100%'
                }}
                type="primary"
              >
                3. Guardar alternativa seleccionada
              </Button>
            </div>
          )}

          {/* Tip */}
          {!generatedImages.length && generatedPrompt && (
            <div style={{
              background: '#fef3c7',
              borderRadius: '6px',
              color: '#92400e',
              fontSize: '11px',
              marginTop: '12px',
              padding: '8px'
            }}>
              💡 <strong>Tip:</strong> Copia el prompt y pégalo en Canva, Leonardo AI, o Midjourney para generar la imagen gratis.
            </div>
          )}
        </div>
      </Modal>
    </Flexbox>
  );
};

export default BrandingAdmin;
