/**
 * Polyfill para findDOMNode en React 19
 * React 19 removió findDOMNode, pero algunas librerías (como react-transition-group) aún lo necesitan
 * Este polyfill proporciona una implementación compatible
 */

if (typeof window !== 'undefined') {
  const ReactDOM = require('react-dom');
  
  // Solo agregar el polyfill si findDOMNode no existe
  if (ReactDOM && !ReactDOM.findDOMNode) {
    ReactDOM.findDOMNode = function(instance: any): Element | Text | null {
      if (!instance) {
        return null;
      }

      // Si es un elemento DOM, devolverlo directamente
      if (instance instanceof Element || instance instanceof Text) {
        return instance;
      }

      // Si es un componente de React con ref
      if (instance && typeof instance === 'object') {
        // Buscar ref en diferentes lugares comunes
        const ref = instance.ref || instance._ref || instance._reactInternalFiber?.ref;
        
        if (ref) {
          // Si es un objeto ref con current
          if (typeof ref === 'object' && 'current' in ref) {
            if (ref.current instanceof Element || ref.current instanceof Text) {
              return ref.current;
            }
            // Si current es un componente, intentar recursivamente
            if (ref.current) {
              return ReactDOM.findDOMNode(ref.current);
            }
          }
          // Si ref es una función, no podemos obtener el elemento directamente
        }

        // Si tiene _reactInternalFiber, intentar obtener el elemento del DOM
        if (instance._reactInternalFiber) {
          let fiber = instance._reactInternalFiber;
          while (fiber) {
            if (fiber.stateNode && (fiber.stateNode instanceof Element || fiber.stateNode instanceof Text)) {
              return fiber.stateNode;
            }
            fiber = fiber.return;
          }
        }
      }

      return null;
    };
  }
}
