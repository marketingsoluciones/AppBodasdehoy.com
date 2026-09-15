// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MiniMarkdown, stripMiniMarkdown } from './MiniMarkdown';

/**
 * Auditoria QA 14-09 (N28): los paneles de IA mostraban el markdown crudo.
 * Tests de render seguro (sin HTML inyectado — XSS imposible por construccion).
 */

describe('MiniMarkdown (N28)', () => {
  it('renderiza **negrita** como <strong>', () => {
    render(<MiniMarkdown text="Hola **mundo**" />);
    expect(screen.getByText('mundo').tagName).toBe('STRONG');
  });

  it('renderiza *cursiva* como <em>', () => {
    render(<MiniMarkdown text="texto *importante* fin" />);
    expect(screen.getByText('importante').tagName).toBe('EM');
  });

  it('renderiza `codigo` como <code>', () => {
    render(<MiniMarkdown text="usa `pnpm install`" />);
    expect(screen.getByText('pnpm install').tagName).toBe('CODE');
  });

  it('renderiza listas con "-" como <ul>/<li>', () => {
    render(<MiniMarkdown text={'- uno\n- dos'} />);
    expect(screen.getByText('uno').closest('ul')).not.toBeNull();
    expect(screen.getByText('dos').closest('li')).not.toBeNull();
  });

  it('renderiza listas numeradas como <ol>', () => {
    render(<MiniMarkdown text={'1. primero\n2. segundo'} />);
    expect(screen.getByText('primero').closest('ol')).not.toBeNull();
  });

  it('NO interpreta HTML inyectado (sin XSS)', () => {
    render(<MiniMarkdown text={'<img src=x onerror=alert(1)> **b**'} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
  });

  it('asteriscos sueltos sin par se quedan como texto literal', () => {
    render(<MiniMarkdown text="2*3*4 = 24" />);
    expect(screen.getByText(/2\*3\*4/)).toBeInTheDocument();
  });
  it('conserva los saltos de linea simples del mensaje IA (auditoria 15-09)', () => {
    const { container } = render(<MiniMarkdown text={'Nombre: Ana\nFecha: 12 de junio'} />);
    expect(container.querySelectorAll('br')).toHaveLength(1);
    expect(container.textContent).toContain('Nombre: Ana');
    expect(container.textContent).toContain('Fecha: 12 de junio');
  });
});

describe('stripMiniMarkdown — preview de la lista (auditoria 15-09)', () => {
  it('quita el enfasis que el hilo renderiza', () => {
    expect(stripMiniMarkdown('**Hola** equipo')).toBe('Hola equipo');
    expect(stripMiniMarkdown('mira `codigo` aqui')).toBe('mira codigo aqui');
    expect(stripMiniMarkdown('- uno')).toBe('uno');
  });

  it('NO mutila el texto humano (regresion de markdown-to-txt)', () => {
    expect(stripMiniMarkdown('2*3*4 = 24')).toBe('2*3*4 = 24');
    expect(stripMiniMarkdown('_hola_ que tal')).toBe('_hola_ que tal');
    expect(stripMiniMarkdown('#boda en la playa')).toBe('#boda en la playa');
  });

  it('tolera texto vacio', () => {
    expect(stripMiniMarkdown('')).toBe('');
  });
});
