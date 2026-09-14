'use client';

import { Select, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { searchChatRecipients, type ChatRecipient } from './sharing';

interface Props {
  currentUserId: string;
  value: string;
  onChange: (userId: string) => void;
}

export function RecipientPicker({ currentUserId, value, onChange }: Props): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<ChatRecipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setUsers([]);
    setError('');
    setLoading(false);
    if (query.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      void searchChatRecipients(query, controller.signal)
        .then(result => { if (!controller.signal.aborted) setUsers(result.filter(user => user.id !== currentUserId)); })
        .catch(() => { if (!controller.signal.aborted) setError('No se pudo buscar. Inténtalo de nuevo.'); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, currentUserId]);

  return <>
    <Select
      aria-label="Destinatario de la conversación"
      showSearch
      filterOption={false}
      loading={loading}
      value={value || undefined}
      onSearch={text => { onChange(''); setQuery(text); }}
      onChange={onChange}
      options={users.map(user => ({
        value: user.id,
        label: [user.name, user.email || user.phone].filter(Boolean).join(' · '),
      }))}
      placeholder="Busca por nombre, email o teléfono"
      notFoundContent={loading ? 'Buscando…' : query.trim().length < 3 ? 'Escribe al menos 3 caracteres' : 'Sin usuarios coincidentes'}
      style={{ width: '100%' }}
    />
    {error && <Typography.Text type="danger">{error}</Typography.Text>}
  </>;
}
