'use client';

import { Edit, Plus, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

interface PromptTemplate {
  category: string;
  content: string;
  createdAt: string;
  description: string;
  id: string;
  isActive: boolean;
  name: string;
  priority: number;
  updatedAt: string;
  variables: string[];
}

const CATEGORIES = [
  { color: '#3b82f6', label: 'System', value: 'system' },
  { color: '#10b981', label: 'User', value: 'user' },
  { color: '#8b5cf6', label: 'Assistant', value: 'assistant' },
  { color: '#f59e0b', label: 'Commercial', value: 'commercial' },
  { color: '#ec4899', label: 'Emotional', value: 'emotional' },
  { color: '#6b7280', label: 'Technical', value: 'technical' },
];

const PromptConfig = () => {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<{ category?: string; isActive?: boolean }>({});

  // Form state
  const [form, setForm] = useState<Partial<PromptTemplate>>({
    category: 'system',
    content: '',
    description: '',
    isActive: true,
    name: '',
    priority: 10,
    variables: [],
  });

  const loadPrompts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.isActive !== undefined) params.append('isActive', String(filter.isActive));

      const response = await fetch(`http://localhost:8030/api/prompts/?${params.toString()}`);
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error('Error loading prompts:', error);
    }
  }, [filter]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const handleCreate = useCallback(() => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedPrompt(null);
    setForm({
      category: 'system',
      content: '',
      description: '',
      isActive: true,
      name: '',
      priority: 10,
      variables: [],
    });
  }, []);

  const handleEdit = useCallback((prompt: PromptTemplate) => {
    setIsEditing(true);
    setIsCreating(false);
    setSelectedPrompt(prompt);
    setForm({ ...prompt });
  }, []);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedPrompt(null);
    setForm({});
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (isCreating) {
        // Create new prompt
        await fetch('http://localhost:8030/api/prompts', {
          body: JSON.stringify({
            category: form.category,
            content: form.content,
            description: form.description,
            isActive: form.isActive ?? true,
            name: form.name,
            priority: form.priority ?? 10,
            variables: form.variables || [],
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });
      } else if (selectedPrompt) {
        // Update existing prompt
        await fetch(`http://localhost:8030/api/prompts/${selectedPrompt.id}`, {
          body: JSON.stringify({
            category: form.category,
            content: form.content,
            description: form.description,
            isActive: form.isActive,
            name: form.name,
            priority: form.priority,
            variables: form.variables,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'PATCH',
        });
      }

      await loadPrompts();
      handleCancel();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Error al guardar el prompt');
    }
  }, [isCreating, selectedPrompt, form, loadPrompts, handleCancel]);

  const handleDelete = useCallback(
    async (promptId: string) => {
      if (!confirm('¿Estás seguro de eliminar este prompt?')) return;

      try {
        await fetch(`http://localhost:8030/api/prompts/${promptId}`, {
          method: 'DELETE',
        });
        await loadPrompts();
        if (selectedPrompt?.id === promptId) {
          handleCancel();
        }
      } catch (error) {
        console.error('Error deleting prompt:', error);
        alert('Error al eliminar el prompt');
      }
    },
    [loadPrompts, selectedPrompt, handleCancel],
  );

  const getCategoryColor = useCallback((category: string) => {
    return CATEGORIES.find((c) => c.value === category)?.color || '#6b7280';
  }, []);

  return (
    <Flexbox gap={16} padding={16} style={{ height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Prompt Configuration</h2>
          <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>
            Gestiona los prompts del sistema
          </p>
        </div>
        <button
          disabled={isEditing}
          onClick={handleCreate}
          style={{
            alignItems: 'center',
            background: '#667eea',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: isEditing ? 'not-allowed' : 'pointer',
            display: 'flex',
            fontSize: '13px',
            fontWeight: 500,
            gap: '4px',
            opacity: isEditing ? 0.5 : 1,
            padding: '6px 16px',
          }}
          type="button"
        >
          <Plus size={14} />
          Nuevo Prompt
        </button>
      </Flexbox>

      {/* Filters */}
      <Flexbox gap={8} horizontal>
        <select
          onChange={(e) =>
            setFilter((prev) => ({ ...prev, category: e.target.value || undefined }))
          }
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            padding: '6px 12px',
          }}
          value={filter.category || ''}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
        <select
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              isActive: e.target.value === '' ? undefined : e.target.value === 'true',
            }))
          }
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '13px',
            padding: '6px 12px',
          }}
          value={filter.isActive === undefined ? '' : String(filter.isActive)}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </Flexbox>

      {/* Content Area */}
      <Flexbox gap={16} horizontal style={{ flex: 1, overflow: 'hidden' }}>
        {/* Prompts List */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'auto',
            width: '300px',
          }}
        >
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              onClick={() => !isEditing && setSelectedPrompt(prompt)}
              style={{
                background: selectedPrompt?.id === prompt.id ? '#f0f9ff' : '#fff',
                borderBottom: '1px solid #e5e7eb',
                cursor: isEditing ? 'not-allowed' : 'pointer',
                opacity: isEditing ? 0.6 : 1,
                padding: '12px',
              }}
            >
              <Flexbox gap={4}>
                <Flexbox align="center" horizontal justify="space-between">
                  <strong style={{ fontSize: '14px' }}>{prompt.name}</strong>
                  <span
                    style={{
                      background: prompt.isActive ? '#10b981' : '#ef4444',
                      borderRadius: '50%',
                      height: '8px',
                      width: '8px',
                    }}
                  />
                </Flexbox>
                <p
                  style={{
                    color: '#6b7280',
                    fontSize: '12px',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prompt.description}
                </p>
                <Flexbox align="center" gap={4} horizontal>
                  <span
                    style={{
                      backgroundColor: `${getCategoryColor(prompt.category)}20`,
                      borderRadius: '4px',
                      color: getCategoryColor(prompt.category),
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '2px 6px',
                    }}
                  >
                    {prompt.category}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                    Priority: {prompt.priority}
                  </span>
                </Flexbox>
              </Flexbox>
            </div>
          ))}
        </div>

        {/* Prompt Detail/Editor */}
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            flex: 1,
            overflow: 'auto',
            padding: '16px',
          }}
        >
          {isEditing ? (
            /* Editor Mode */
            <Flexbox gap={16}>
              <Flexbox align="center" horizontal justify="space-between">
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  {isCreating ? 'Nuevo Prompt' : 'Editar Prompt'}
                </h3>
                <Flexbox gap={8} horizontal>
                  <button
                    onClick={handleCancel}
                    style={{
                      alignItems: 'center',
                      background: '#fff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      fontSize: '13px',
                      gap: '4px',
                      padding: '6px 12px',
                    }}
                    type="button"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    style={{
                      alignItems: 'center',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      fontSize: '13px',
                      fontWeight: 500,
                      gap: '4px',
                      padding: '6px 16px',
                    }}
                    type="button"
                  >
                    <Save size={14} />
                    Guardar
                  </button>
                </Flexbox>
              </Flexbox>

              <Flexbox gap={12}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '4px',
                    }}
                  >
                    Nombre
                  </label>
                  <input
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Sistema Base"
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      padding: '8px 12px',
                      width: '100%',
                    }}
                    type="text"
                    value={form.name || ''}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '4px',
                    }}
                  >
                    Descripción
                  </label>
                  <input
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descripción del prompt"
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      padding: '8px 12px',
                      width: '100%',
                    }}
                    type="text"
                    value={form.description || ''}
                  />
                </div>

                <Flexbox gap={12} horizontal>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 500,
                        marginBottom: '4px',
                      }}
                    >
                      Categoría
                    </label>
                    <select
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        padding: '8px 12px',
                        width: '100%',
                      }}
                      value={form.category || 'system'}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: '100px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 500,
                        marginBottom: '4px',
                      }}
                    >
                      Prioridad
                    </label>
                    <input
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, priority: parseInt(e.target.value) }))
                      }
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        padding: '8px 12px',
                        width: '100%',
                      }}
                      type="number"
                      value={form.priority || 10}
                    />
                  </div>

                  <div
                    style={{
                      alignItems: 'flex-end',
                      display: 'flex',
                      gap: '8px',
                      paddingBottom: '8px',
                    }}
                  >
                    <input
                      checked={form.isActive ?? true}
                      id="isActive"
                      onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      type="checkbox"
                    />
                    <label htmlFor="isActive" style={{ fontSize: '13px', fontWeight: 500 }}>
                      Activo
                    </label>
                  </div>
                </Flexbox>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '4px',
                    }}
                  >
                    Contenido del Prompt
                  </label>
                  <textarea
                    onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Escribe el contenido del prompt aquí..."
                    rows={15}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      padding: '12px',
                      resize: 'vertical',
                      width: '100%',
                    }}
                    value={form.content || ''}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 500,
                      marginBottom: '4px',
                    }}
                  >
                    Variables (separadas por coma)
                  </label>
                  <input
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        variables: e.target.value
                          .split(',')
                          .map((v) => v.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="Ej: user_name, event_type, date"
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      padding: '8px 12px',
                      width: '100%',
                    }}
                    type="text"
                    value={form.variables?.join(', ') || ''}
                  />
                </div>
              </Flexbox>
            </Flexbox>
          ) : selectedPrompt ? (
            /* View Mode */
            <Flexbox gap={16}>
              <Flexbox align="center" horizontal justify="space-between">
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  {selectedPrompt.name}
                </h3>
                <Flexbox gap={8} horizontal>
                  <button
                    onClick={() => handleEdit(selectedPrompt)}
                    style={{
                      alignItems: 'center',
                      background: '#fff',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      fontSize: '13px',
                      gap: '4px',
                      padding: '6px 12px',
                    }}
                    type="button"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(selectedPrompt.id)}
                    style={{
                      alignItems: 'center',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      color: '#dc2626',
                      cursor: 'pointer',
                      display: 'flex',
                      fontSize: '13px',
                      gap: '4px',
                      padding: '6px 12px',
                    }}
                    type="button"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </Flexbox>
              </Flexbox>

              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {selectedPrompt.description}
              </p>

              <Flexbox gap={8} horizontal>
                <span
                  style={{
                    backgroundColor: `${getCategoryColor(selectedPrompt.category)}20`,
                    borderRadius: '6px',
                    color: getCategoryColor(selectedPrompt.category),
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 12px',
                  }}
                >
                  {selectedPrompt.category}
                </span>
                <span
                  style={{
                    background: selectedPrompt.isActive ? '#ecfdf5' : '#fef2f2',
                    borderRadius: '6px',
                    color: selectedPrompt.isActive ? '#10b981' : '#ef4444',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 12px',
                  }}
                >
                  {selectedPrompt.isActive ? 'Activo' : 'Inactivo'}
                </span>
                <span style={{ color: '#9ca3af', fontSize: '12px', padding: '4px 12px' }}>
                  Priority: {selectedPrompt.priority}
                </span>
              </Flexbox>

              <div>
                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>
                  Contenido:
                </strong>
                <pre
                  style={{
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    maxHeight: '400px',
                    overflow: 'auto',
                    padding: '12px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedPrompt.content}
                </pre>
              </div>

              {selectedPrompt.variables.length > 0 && (
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '8px' }}>
                    Variables:
                  </strong>
                  <Flexbox gap={4} horizontal style={{ flexWrap: 'wrap' }}>
                    {selectedPrompt.variables.map((variable, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#f3f4f6',
                          borderRadius: '4px',
                          color: '#374151',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          padding: '2px 8px',
                        }}
                      >
                        {variable}
                      </span>
                    ))}
                  </Flexbox>
                </div>
              )}

              <Flexbox gap={4}>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                  Creado: {new Date(selectedPrompt.createdAt).toLocaleString()}
                </span>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                  Actualizado: {new Date(selectedPrompt.updatedAt).toLocaleString()}
                </span>
              </Flexbox>
            </Flexbox>
          ) : (
            /* No Selection */
            <Flexbox align="center" justify="center" style={{ color: '#9ca3af', height: '100%' }}>
              <p>Selecciona un prompt para ver detalles</p>
            </Flexbox>
          )}
        </div>
      </Flexbox>
    </Flexbox>
  );
};

export default PromptConfig;
