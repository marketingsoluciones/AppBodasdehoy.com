'use client';

import { createContext, useContext } from 'react';

export interface CopilotInputContextValue {
  /** Whether AI is currently generating a response */
  generating: boolean;
  /** Called when user clicks the history button */
  onHistoryToggle?: () => void;
  /** Called when the user clears the conversation */
  onClear?: () => void;
  /** Called when the user uploads files (to attach to the next message) */
  onFileUpload?: (files: File[]) => void;
  /** Called when STT produces transcribed text */
  onSTTResult?: (text: string) => void;
  /** Called when the search toggle changes */
  onSearchToggle?: (enabled: boolean) => void;
  /** Whether web search is currently enabled */
  searchEnabled?: boolean;
  /** Whether file upload is supported */
  fileUploadEnabled?: boolean;
  /** Whether STT is supported (defaults to checking browser API) */
  sttEnabled?: boolean;
}

const CopilotInputContext = createContext<CopilotInputContextValue>({
  generating: false,
  searchEnabled: false,
  fileUploadEnabled: true,
  sttEnabled: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window,
});

export const CopilotInputProvider = CopilotInputContext.Provider;

export const useCopilotInput = () => useContext(CopilotInputContext);
