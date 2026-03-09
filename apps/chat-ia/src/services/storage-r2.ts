/**
 * Servicio para interactuar con Storage R2 (Cloudflare R2)
 * A través de los endpoints del backend Python
 */

export interface StorageFile {
  accessLevel: 'original' | 'shared' | 'public';
  fileId: string;
  fileType: string;
  originalFilename: string;
  sizeBytes: number;
  uploadDate: string;
  urls: {
    optimized400w?: string;
    optimized800w?: string;
    original?: string;
    thumbnail?: string;
  };
}

export interface ListFilesResponse {
  error?: string;
  files: StorageFile[];
  success: boolean;
  total?: number;
}

export interface GetFileResponse {
  error?: string;
  file_id: string;
  success: boolean;
  url: string;
  version: string;
}

/**
 * Obtener headers de autenticación desde localStorage
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (typeof window !== 'undefined') {
    try {
      const devConfig = localStorage.getItem('dev-user-config');
      if (devConfig) {
        const config = JSON.parse(devConfig);
        if (config.userId) {
          headers['X-User-ID'] = config.userId;
        }
        if (config.development || config.developer) {
          headers['X-Development'] = config.development || config.developer;
        }
      }
    } catch (e) {
      console.warn('⚠️ No se pudo obtener configuración de usuario:', e);
    }
  }
  
  return headers;
}

/**
 * Listar archivos de un evento
 */
export async function listEventFiles(
  eventId: string,
  fileType?: 'photos' | 'documents' | 'videos' | 'audio'
): Promise<ListFilesResponse> {
  try {
    const headers = getAuthHeaders();
    const params = new URLSearchParams({ event_id: eventId });
    if (fileType) {
      params.append('file_type', fileType);
    }

    const url = `/api/storage/upload?${params.toString()}`;

    const response = await fetch(url, {
      headers,
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: `Error ${response.status}` };
      }
      return {
        error: errorData.error || `Error ${response.status}`,
        files: [],
        success: false,
      };
    }

    const data = await response.json();
    
    // El backend puede retornar { success, files } o directamente { files }
    if (data.success !== undefined) {
      return {
        error: data.error,
        files: data.files || data.data?.files || [],
        success: data.success,
        total: data.total,
      };
    }
    
    return {
      files: data.files || data.data || [],
      success: true,
      total: data.total,
    };
  } catch (error: any) {
    console.error('❌ Error listando archivos:', error);
    return {
      error: error.message || 'Error desconocido',
      files: [],
      success: false,
    };
  }
}

/**
 * Obtener URL de un archivo
 */
export async function getFileUrl(
  fileId: string,
  version: 'original' | 'optimized_800w' | 'optimized_400w' | 'thumbnail' = 'optimized_800w',
  eventId?: string
): Promise<GetFileResponse> {
  try {
    const headers = getAuthHeaders();
    const params = new URLSearchParams({ version });
    if (eventId) {
      params.append('event_id', eventId);
    }

    const response = await fetch(`/api/storage/files/${fileId}?${params.toString()}`, {
      headers,
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
      return {
        error: errorData.error || `Error ${response.status}`,
        file_id: fileId,
        success: false,
        url: '',
        version,
      };
    }

    const data = await response.json();
    
    return {
      error: data.error,
      file_id: fileId,
      success: data.success !== false,
      url: data.url || '',
      version,
    };
  } catch (error: any) {
    console.error('❌ Error obteniendo URL de archivo:', error);
    return {
      error: error.message || 'Error desconocido',
      file_id: fileId,
      success: false,
      url: '',
      version,
    };
  }
}

/**
 * Eliminar un archivo
 */
export async function deleteFile(fileId: string, eventId?: string): Promise<{ error?: string, success: boolean; }> {
  try {
    const headers = getAuthHeaders();
    const params = new URLSearchParams();
    if (eventId) {
      params.append('event_id', eventId);
    }

    const response = await fetch(`/api/storage/files/${fileId}?${params.toString()}`, {
      headers,
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
      return {
        error: errorData.error || `Error ${response.status}`,
        success: false,
      };
    }

    const data = await response.json();
    return {
      error: data.error,
      success: data.success !== false,
    };
  } catch (error: any) {
    console.error('❌ Error eliminando archivo:', error);
    return {
      error: error.message || 'Error desconocido',
      success: false,
    };
  }
}

/**
 * Obtener eventId desde localStorage o contexto
 */
export function getCurrentEventId(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const devConfig = localStorage.getItem('dev-user-config');
    if (devConfig) {
      const config = JSON.parse(devConfig);
      if (config.current_event_id) {
        return config.current_event_id;
      }
      if (config.eventos && config.eventos.length > 0) {
        return config.eventos[0]._id || config.eventos[0].id || null;
      }
    }
  } catch (e) {
    console.warn('⚠️ No se pudo obtener event_id:', e);
  }
  
  return null;
}

