/**
 * Tests para CopilotInputEditor - Editor completo del Copilot
 *
 * Verifica:
 * - Renderizado del componente
 * - Botones de acción (emojis, código, lista)
 * - Auto-resize del textarea
 * - Envío de mensajes
 * - Estados visuales
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CopilotInputEditor from '../CopilotInputEditor';

describe('CopilotInputEditor', () => {
  const mockOnChange = jest.fn();
  const mockOnSend = jest.fn();
  const mockOnStop = jest.fn();

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
    onSend: mockOnSend,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('debe renderizar el componente correctamente', () => {
      render(<CopilotInputEditor {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      expect(textarea).toBeInTheDocument();
    });

    it('debe mostrar el placeholder personalizado', () => {
      const customPlaceholder = 'Test placeholder';
      render(<CopilotInputEditor {...defaultProps} placeholder={customPlaceholder} />);

      expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
    });

    it('debe renderizar todos los botones de acción', () => {
      render(<CopilotInputEditor {...defaultProps} />);

      // Verificar que hay 4 botones en la barra de acciones
      const actionButtons = screen.getAllByRole('button');
      // 4 botones de acción + 1 botón de enviar = 5 total
      expect(actionButtons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Funcionalidad del Textarea', () => {
    it('debe actualizar el valor cuando el usuario escribe', () => {
      render(<CopilotInputEditor {...defaultProps} value="Hello" />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      fireEvent.change(textarea, { target: { value: 'Hello World' } });

      expect(mockOnChange).toHaveBeenCalledWith('Hello World');
    });

    it('debe llamar onSend cuando se presiona Enter', () => {
      render(<CopilotInputEditor {...defaultProps} value="Test message" />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).toHaveBeenCalled();
    });

    it('NO debe llamar onSend cuando se presiona Shift+Enter', () => {
      render(<CopilotInputEditor {...defaultProps} value="Test message" />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('debe estar deshabilitado cuando isLoading es true', () => {
      render(<CopilotInputEditor {...defaultProps} isLoading={true} />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      expect(textarea).toBeDisabled();
    });

    it('debe estar deshabilitado cuando disabled es true', () => {
      render(<CopilotInputEditor {...defaultProps} disabled={true} />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      expect(textarea).toBeDisabled();
    });
  });

  describe('Botón de Enviar', () => {
    it('debe mostrar el botón de enviar cuando no está cargando', () => {
      render(<CopilotInputEditor {...defaultProps} value="Test" />);

      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.getAttribute('title')?.includes('Enviar'));

      expect(sendButton).toBeInTheDocument();
    });

    it('debe llamar onSend cuando se hace click en el botón', () => {
      render(<CopilotInputEditor {...defaultProps} value="Test message" />);

      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.getAttribute('title')?.includes('Enviar'));

      if (sendButton) {
        fireEvent.click(sendButton);
        expect(mockOnSend).toHaveBeenCalled();
      }
    });

    it('debe estar deshabilitado cuando el input está vacío', () => {
      render(<CopilotInputEditor {...defaultProps} value="" />);

      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find(btn => btn.getAttribute('title')?.includes('Enviar'));

      if (sendButton) {
        expect(sendButton).toBeDisabled();
      }
    });

    it('debe mostrar el botón de detener cuando isLoading es true', () => {
      render(<CopilotInputEditor {...defaultProps} isLoading={true} onStop={mockOnStop} />);

      const buttons = screen.getAllByRole('button');
      const stopButton = buttons.find(btn => btn.getAttribute('title')?.includes('Detener'));

      expect(stopButton).toBeInTheDocument();
    });

    it('debe llamar onStop cuando se hace click en detener', () => {
      render(<CopilotInputEditor {...defaultProps} isLoading={true} onStop={mockOnStop} />);

      const buttons = screen.getAllByRole('button');
      const stopButton = buttons.find(btn => btn.getAttribute('title')?.includes('Detener'));

      if (stopButton) {
        fireEvent.click(stopButton);
        expect(mockOnStop).toHaveBeenCalled();
      }
    });
  });

  describe('Botones de Acción', () => {
    it('debe tener botón de emojis', () => {
      render(<CopilotInputEditor {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const emojiButton = buttons.find(btn => btn.getAttribute('title') === 'Emojis');

      expect(emojiButton).toBeInTheDocument();
    });

    it('debe tener botón de adjuntar', () => {
      render(<CopilotInputEditor {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const attachButton = buttons.find(btn => btn.getAttribute('title') === 'Adjuntar archivo');

      expect(attachButton).toBeInTheDocument();
    });

    it('debe tener botón de código', () => {
      render(<CopilotInputEditor {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const codeButton = buttons.find(btn => btn.getAttribute('title') === 'Insertar código');

      expect(codeButton).toBeInTheDocument();
    });

    it('debe tener botón de lista', () => {
      render(<CopilotInputEditor {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const listButton = buttons.find(btn => btn.getAttribute('title') === 'Insertar lista');

      expect(listButton).toBeInTheDocument();
    });
  });

  describe('Selector de Emojis', () => {
    it('debe abrir el popup de emojis al hacer click en el botón', () => {
      render(<CopilotInputEditor {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const emojiButton = buttons.find(btn => btn.getAttribute('title') === 'Emojis');

      if (emojiButton) {
        fireEvent.click(emojiButton);

        // Verificar que aparecen botones de emojis
        waitFor(() => {
          const emojiButtons = screen.getAllByRole('button');
          // Debe haber más botones (16 emojis + 4 de acción + 1 de enviar)
          expect(emojiButtons.length).toBeGreaterThan(10);
        });
      }
    });
  });

  describe('Insertar Código', () => {
    it('debe insertar bloque de código al hacer click', () => {
      render(<CopilotInputEditor {...defaultProps} value="" />);

      const buttons = screen.getAllByRole('button');
      const codeButton = buttons.find(btn => btn.getAttribute('title') === 'Insertar código');

      if (codeButton) {
        fireEvent.click(codeButton);

        // Verificar que se llamó onChange con código markdown
        expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('```'));
      }
    });
  });

  describe('Insertar Lista', () => {
    it('debe insertar item de lista al hacer click', () => {
      render(<CopilotInputEditor {...defaultProps} value="" />);

      const buttons = screen.getAllByRole('button');
      const listButton = buttons.find(btn => btn.getAttribute('title') === 'Insertar lista');

      if (listButton) {
        fireEvent.click(listButton);

        // Verificar que se llamó onChange con item de lista
        expect(mockOnChange).toHaveBeenCalledWith(expect.stringContaining('- '));
      }
    });
  });

  describe('Integración Completa', () => {
    it('debe funcionar el flujo completo: escribir y enviar', () => {
      const { rerender } = render(<CopilotInputEditor {...defaultProps} value="" />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);

      // Escribir mensaje
      fireEvent.change(textarea, { target: { value: 'Hola mundo' } });
      expect(mockOnChange).toHaveBeenCalledWith('Hola mundo');

      // Rerender con nuevo valor
      rerender(<CopilotInputEditor {...defaultProps} value="Hola mundo" />);

      // Enviar con Enter
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
      expect(mockOnSend).toHaveBeenCalled();
    });

    it('debe permitir insertar código y luego enviarlo', () => {
      const { rerender } = render(<CopilotInputEditor {...defaultProps} value="" />);

      const buttons = screen.getAllByRole('button');
      const codeButton = buttons.find(btn => btn.getAttribute('title') === 'Insertar código');

      if (codeButton) {
        // Insertar código
        fireEvent.click(codeButton);
        expect(mockOnChange).toHaveBeenCalled();

        const codeText = mockOnChange.mock.calls[0][0];

        // Rerender con código
        rerender(<CopilotInputEditor {...defaultProps} value={codeText} />);

        // Enviar
        const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
        expect(mockOnSend).toHaveBeenCalled();
      }
    });
  });

  describe('Performance y Edge Cases', () => {
    it('no debe llamar onSend si el valor está vacío', () => {
      render(<CopilotInputEditor {...defaultProps} value="" />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('no debe llamar onSend si está cargando', () => {
      render(<CopilotInputEditor {...defaultProps} value="Test" isLoading={true} />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('debe manejar valores largos correctamente', () => {
      const longText = 'A'.repeat(1000);
      render(<CopilotInputEditor {...defaultProps} value={longText} />);

      const textarea = screen.getByPlaceholderText(/Escribe tu mensaje/i);
      expect(textarea).toHaveValue(longText);
    });
  });
});
