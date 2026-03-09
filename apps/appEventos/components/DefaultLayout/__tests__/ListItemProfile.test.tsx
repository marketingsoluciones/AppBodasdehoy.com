/**
 * Tests de front: ListItemProfile (opción del menú de usuario).
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListItemProfile } from '../ListItemProfile';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: {} }),
}));

const mockOnClick = jest.fn();

describe('ListItemProfile', () => {
  it('muestra el título traducido', () => {
    render(
      <ListItemProfile
        title="Iniciar sesión"
        icon={<span data-testid="icon" />}
        development={['bodasdehoy']}
        rol={undefined}
      />
    );
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('llama onClick al hacer clic', () => {
    render(
      <ListItemProfile
        title="Cerrar Sesión"
        icon={<span />}
        onClick={mockOnClick}
        development={['all']}
        rol={['all']}
      />
    );
    fireEvent.click(screen.getByText('Cerrar Sesión'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
