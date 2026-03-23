'use client';

import { MicIcon, MicOffIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCopilotInput } from '../CopilotInputContext';
import { useChatInputStore } from '../store';
import Action from './Action';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const STT = memo(() => {
  const { t } = useTranslation('chat');
  const { sttEnabled, onSTTResult } = useCopilotInput();
  const editor = useChatInputStore((s) => s.editor);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const supported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  if (!supported || sttEnabled === false) return null;

  const handleToggle = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || 'es-ES';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        if (onSTTResult) {
          onSTTResult(transcript);
        } else {
          // Insert directly into editor
          (editor as any)?.insertText?.(transcript) ?? (editor as any)?.commands?.insertContent?.(transcript);
        }
      }
    };

    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, onSTTResult, editor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return (
    <Action
      active={isRecording}
      icon={isRecording ? MicIcon : MicOffIcon}
      onClick={handleToggle}
      title={t('stt.action', isRecording ? 'Detener dictado' : 'Dictar mensaje')}
    />
  );
});

export default STT;
