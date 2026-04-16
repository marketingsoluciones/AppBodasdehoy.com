'use client';

import { Tag } from 'antd';
import { Crown, Edit, Eye, UserCheck, Users } from 'lucide-react';
import { memo } from 'react';

interface SharedAccess {
  permissions?: {
    can_delete?: boolean;
    can_read?: boolean;
    can_write?: boolean;
  };
  user_id: string;
}

interface PermissionBadgeProps {
  compact?: boolean;
  currentUserId: string;
  isOwner: boolean;
  sharedWith?: SharedAccess[];
}

/**
 * Badge que muestra el rol/permisos del usuario en un recurso
 *
 * Roles:
 * - Propietario (owner): Tiene todos los permisos
 * - Colaborador (can_write): Puede editar
 * - Lector (can_read): Solo puede ver
 * - Visitante: Sin acceso especial
 */
export const PermissionBadge = memo<PermissionBadgeProps>(
  ({ isOwner, sharedWith = [], currentUserId, compact = false }) => {
    // Si es owner
    if (isOwner) {
      return (
        <Tag
          color="gold"
          icon={<Crown size={14} />}
          style={{ alignItems: 'center', display: 'inline-flex', gap: 4 }}
        >
          {compact ? 'Owner' : 'Propietario'}
        </Tag>
      );
    }

    // Buscar permisos del usuario actual
    const userAccess = sharedWith.find((access) => access.user_id === currentUserId);

    if (!userAccess || !userAccess.permissions) {
      return (
        <Tag
          color="default"
          icon={<Users size={14} />}
          style={{ alignItems: 'center', display: 'inline-flex', gap: 4 }}
        >
          {compact ? 'Guest' : 'Visitante'}
        </Tag>
      );
    }

    const { can_read, can_write } = userAccess.permissions;

    // Colaborador (puede escribir)
    if (can_write) {
      return (
        <Tag
          color="green"
          icon={<Edit size={14} />}
          style={{ alignItems: 'center', display: 'inline-flex', gap: 4 }}
        >
          {compact ? 'Editor' : 'Colaborador'}
        </Tag>
      );
    }

    // Lector (solo lectura)
    if (can_read) {
      return (
        <Tag
          color="blue"
          icon={<Eye size={14} />}
          style={{ alignItems: 'center', display: 'inline-flex', gap: 4 }}
        >
          {compact ? 'Reader' : 'Lector'}
        </Tag>
      );
    }

    // Por defecto
    return (
      <Tag
        color="default"
        icon={<UserCheck size={14} />}
        style={{ alignItems: 'center', display: 'inline-flex', gap: 4 }}
      >
        {compact ? 'Guest' : 'Invitado'}
      </Tag>
    );
  },
);

PermissionBadge.displayName = 'PermissionBadge';

export default PermissionBadge;

