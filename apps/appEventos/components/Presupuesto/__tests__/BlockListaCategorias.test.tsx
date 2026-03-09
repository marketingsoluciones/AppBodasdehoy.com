/**
 * Tests de front: BlockListaCategorias.
 * Comprueban que no lance el error categorias_array y que renderice correctamente
 * con evento sin presupuesto_objeto o con categorías vacías.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BlockListaCategorias } from '../BlockListaCategorias';

jest.mock('../../../context', () => ({
  EventContextProvider: () => ({
    event: {
      _id: 'ev-1',
      presupuesto_objeto: undefined,
    },
  }),
}));

jest.mock('../../../hooks/useAllowed', () => ({
  useAllowed: () => [() => true, () => {}],
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: {} }),
}));

jest.mock('../../../hooks/useToast', () => ({
  useToast: () => jest.fn(),
}));

const setShowCategoria = jest.fn();
const defaultProps = {
  setShowCategoria,
  showCategoria: { state: false, _id: '' },
  categorias_array: [],
};

describe('BlockListaCategorias', () => {
  it('no lanza error cuando event.presupuesto_objeto es undefined', () => {
    expect(() => {
      render(<BlockListaCategorias {...defaultProps} />);
    }).not.toThrow();
  });

  it('muestra el botón de nueva categoría', () => {
    render(<BlockListaCategorias {...defaultProps} />);
    expect(screen.getByText(/newcategory/i)).toBeInTheDocument();
  });

  it('acepta categorias_array por prop cuando event no tiene presupuesto_objeto', () => {
    const categorias = [{ _id: 'c1', nombre: 'Categoría A', coste_final: 0, gastos_array: [] }];
    render(<BlockListaCategorias {...defaultProps} categorias_array={categorias} />);
    expect(screen.getByText(/Categoría A/i)).toBeInTheDocument();
  });
});
