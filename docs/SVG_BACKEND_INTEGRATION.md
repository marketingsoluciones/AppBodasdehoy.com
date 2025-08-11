# Integración de SVGs con Backend

## Descripción General

Este sistema permite cargar, guardar y gestionar SVGs desde el backend usando GraphQL, convirtiendo automáticamente los strings SVG en componentes React renderizables.

## Flujo de Datos

### 1. Carga de SVGs desde Backend

```typescript
// Cuando se carga la página, se obtienen los SVGs guardados
useEffect(() => {
  if (event?.galerySvgVersion) {
    fetchApiEventos({
      query: queries.getGalerySvgs,
      variables: {
        evento_id: event?._id,
        tipo: "element"
      }
    }).then((result: any) => {
      // Convertir strings SVG en componentes React
      const svgsWithReactIcons = convertBackendSvgsToReact(result.results);
      // Actualizar estado
    });
  }
}, [event?.galerySvgVersion])
```

### 2. Conversión de String a React Component

```typescript
const convertBackendSvgsToReact = (backendSvgs: any[]): GalerySvg[] => {
  return backendSvgs.map((svgItem: any) => ({
    ...svgItem,
    // Convertir el string SVG del backend en un componente React
    icon: <SvgFromString svgString={svgItem.icon} className="relative w-max" />,
    size: { width: 60, height: 60 }
  }));
};
```

### 3. Guardado de Nuevos SVGs

```typescript
// Al subir un archivo o URL
const result = await fetchApiEventos({
  query: queries.createGalerySvgs,
  variables: {
    evento_id: event?._id,
    galerySvgs: [{
      title: "mi-svg",
      icon: svgContent, // String SVG
      tipo: "element"
    }]
  },
});

// Convertir respuesta del backend en elementos React
const svgsWithReactIcons = convertBackendSvgsToReact(result.results);
```

## Estructura de Datos

### Interfaz GalerySvg

```typescript
export interface GalerySvg {
  _id?: string
  title: string
  icon: ReactElement | string  // Puede ser ReactElement o string
  svg?: string                 // Para el contenido SVG como string
  tipo: string
  size?: { width: number; height: number }
}
```

### Backend → Frontend

1. **Backend devuelve:**
   ```json
   {
     "_id": "123",
     "title": "mi-icono",
     "icon": "<svg>...</svg>",  // String SVG
     "tipo": "element"
   }
   ```

2. **Frontend convierte a:**
   ```typescript
   {
     "_id": "123",
     "title": "mi-icono",
     "icon": <SvgFromString svgString="<svg>...</svg>" />,  // ReactElement
     "tipo": "element",
     "size": { width: 60, height: 60 }
   }
   ```

## Componentes Clave

### SvgFromString
Convierte un string SVG en un componente React renderizable.

### SvgWrapper
Envuelve cualquier SVG (ReactElement o string) y proporciona control sobre propiedades como:
- `width`, `height`
- `fill`, `stroke`
- `transform`, `opacity`
- Auto-scaling basado en `viewBox`

### DragTable
Renderiza los SVGs en la interfaz, manejando tanto elementos estáticos como SVGs del backend.

## Mutaciones GraphQL

### Crear SVG
```graphql
mutation CreateGalerySvgs($evento_id: String!, $galerySvgs: [galerySvgInput!]!) {
  createGalerySvgs(evento_id: $evento_id, galerySvgs: $galerySvgs) {
    _id
    title
    icon
    tipo
  }
}
```

### Obtener SVGs
```graphql
query GetGalerySvgs($evento_id: String!, $tipo: String!) {
  getGalerySvgs(evento_id: $evento_id, tipo: $tipo) {
    _id
    title
    icon
    tipo
  }
}
```

## Ventajas del Sistema

1. **Persistencia**: SVGs se guardan en el backend
2. **Flexibilidad**: Maneja tanto archivos como URLs
3. **Optimización**: Validación de tamaño y sugerencias
4. **Rendimiento**: Conversión eficiente de string a React
5. **Escalabilidad**: Fácil agregar nuevas funcionalidades

## Consideraciones

- Los SVGs se optimizan antes de guardar (eliminación de espacios, comentarios)
- Tamaño máximo: 10KB por SVG
- Se mantiene compatibilidad con elementos estáticos (Arbol, Arbol2, etc.)
- El estado se sincroniza automáticamente entre backend y frontend 