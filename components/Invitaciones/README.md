# Módulo de Invitaciones - Refactorización

## Descripción
Este módulo ha sido completamente refactorizado para mejorar la mantenibilidad, reutilización y legibilidad del código.

## Estructura de Archivos

### Tipos y Constantes
- `types.ts` - Interfaces TypeScript para todos los componentes
- `constants.ts` - Constantes reutilizables (imágenes, configuraciones de columnas, clases CSS)

### Componentes Principales
- `GuestTable.tsx` - Componente principal de la tabla de invitados
- `DataTableInvitaciones.tsx` - Tabla de datos con funcionalidad de selección
- `ConfirmationBlock.tsx` - Bloque de confirmación para envío de invitaciones

### Componentes de Celdas
- `cells/GuestNameCell.tsx` - Celda para mostrar nombre y foto del invitado
- `cells/GuestEmailCell.tsx` - Celda para mostrar/editar email
- `cells/GuestInvitationCell.tsx` - Celda para estado de invitación
- `cells/GuestCompanionsCell.tsx` - Celda para acompañantes
- `cells/GuestDateCell.tsx` - Celda para fecha de envío

### Componentes Reutilizables
- `components/TableHeader.tsx` - Encabezado de tabla reutilizable
- `components/TableBody.tsx` - Cuerpo de tabla reutilizable
- `components/SendButton.tsx` - Botón de envío reutilizable

### Hooks Personalizados
- `hooks/useGuestColumns.ts` - Hook para configuración de columnas
- `hooks/useRowSelection.ts` - Hook para manejo de selección de filas

## Mejoras Implementadas

### 1. Tipado Fuerte
- Eliminación del uso de `any` en favor de interfaces específicas
- Tipado completo de props y estados
- Mejor autocompletado y detección de errores

### 2. Separación de Responsabilidades
- Cada celda es un componente independiente
- Lógica de negocio separada en hooks personalizados
- Componentes reutilizables para elementos comunes

### 3. Reutilización de Código
- Constantes centralizadas para evitar duplicación
- Componentes de tabla reutilizables
- Hooks personalizados para lógica común

### 4. Mejor Mantenibilidad
- Archivos más pequeños y enfocados
- Nombres descriptivos para funciones y variables
- Documentación clara de interfaces

### 5. Performance
- Uso de `useMemo` para optimizar renderizados
- Eliminación de re-renderizados innecesarios
- Mejor gestión de efectos secundarios

## Uso

```tsx
import { GuestTable } from './components/Invitaciones/GuestTable';

const MyComponent = () => {
  const guestData = [
    {
      _id: '1',
      nombre: 'Juan Pérez',
      correo: 'juan@email.com',
      telefono: '123456789',
      invitacion: false,
      acompañantes: 2,
      sexo: 'hombre'
    }
  ];

  return (
    <GuestTable 
      data={guestData}
      multiSeled={true}
    />
  );
};
```

## Interfaces Principales

```typescript
interface Guest {
  _id: string;
  nombre: string;
  correo: string;
  telefono: string;
  invitacion: boolean;
  acompañantes: number;
  date?: string;
  sexo: 'hombre' | 'mujer';
}

interface GuestTableProps {
  data: Guest[];
  multiSeled?: boolean;
  reenviar?: boolean;
  activeFunction?: () => void;
}
```

## Migración
Para migrar código existente, simplemente reemplaza las importaciones:

```tsx
// Antes
import { GuestTable } from './components/Invitaciones/GuestTable';

// Después (misma importación, pero con mejor tipado)
import { GuestTable } from './components/Invitaciones/GuestTable';
```

Los componentes mantienen la misma API pública, por lo que la migración es transparente. 