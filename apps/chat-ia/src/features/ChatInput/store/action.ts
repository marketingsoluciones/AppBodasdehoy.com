import { StateCreator } from 'zustand/vanilla';

import { PublicState, State, initialState } from './initialState';

export interface Action {
  getJSONState: () => any;
  getMarkdownContent: () => string;
  handleSendButton: () => void;
  handleStop: () => void;
  setExpand: (expend: boolean) => void;
  setJSONState: (content: any) => void;
  setShowTypoBar: (show: boolean) => void;
  updateMarkdownContent: () => void;
}

export type Store = Action & State;

// const t = setNamespace('ChatInput');

type CreateStore = (
  initState?: Partial<PublicState>,
) => StateCreator<Store, [['zustand/devtools', never]]>;

export const store: CreateStore = (publicState) => (set, get) => ({
  ...initialState,
  ...publicState,

  getJSONState: () => {
    return get().editor?.getDocument('json');
  },
  getMarkdownContent: () => {
    return String(get().editor?.getDocument('markdown') || '').trimEnd();
  },
  handleSendButton: () => {
    if (!get().editor) return;

    const editor = get().editor;

    // BUG-NEW-08 v5 QA #32 (28-jun, 5º build sin fix): el fix v2 ponía
    // clearContent en generateAIChatV2 (UN solo code path) → otros callers
    // (welcome/mobile/SendArea) no limpian → textarea concatena en ráfaga.
    //
    // v5: capturamos contenido SÍNCRONO + limpiamos SÍNCRONO antes de
    // cualquier await del caller. Pasamos snapshot al callback para que
    // el caller siempre reciba el contenido correcto sin race con el
    // siguiente keystroke del user. clearContent del callback queda
    // no-op porque ya se limpió.
    const snapshot = String(editor?.getDocument('markdown') || '').trimEnd();

    // QA Bug#8: si el snapshot sale VACÍO (carrera de serialización del editor / clic
    // sin contenido), NO limpiar ni enviar — evita el síntoma "el texto se borra pero
    // el mensaje nunca se envía". Con contenido no vacío se procede normal.
    if (!snapshot) return;

    editor?.cleanDocument();

    get().onSend?.({
      clearContent: () => {
        /* no-op: editor ya limpio sincrónicamente en handleSendButton */
      },
      editor: editor!,
      getMarkdownContent: () => snapshot,
    });
  },

  handleStop: () => {
    if (!get().editor) return;

    get().sendButtonProps?.onStop?.({ editor: get().editor! });
  },

  setExpand: (expand) => {
    set({ expand });
  },

  setJSONState: (content) => {
    get().editor?.setDocument('json', content);
  },

  setShowTypoBar: (showTypoBar) => {
    set({ showTypoBar });
  },

  updateMarkdownContent: () => {
    if (!get().onMarkdownContentChange) return;

    const content = get().getMarkdownContent();

    if (content === get().markdownContent) return;

    get().onMarkdownContentChange?.(content);

    set({ markdownContent: content });
  },
});
