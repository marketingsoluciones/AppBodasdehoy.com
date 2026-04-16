import DesktopChatInput from './Desktop';

interface ChatInputProps {
  mobile: boolean;
  targetMemberId?: string;
}

const ChatInput = ({ mobile, targetMemberId }: ChatInputProps) => {
  // ✅ SIEMPRE usar versión Desktop (completa) - no usar mobile reducido
  // Esto asegura que se muestren todas las funcionalidades de LobeChat
  const Input = DesktopChatInput; // Antes era: mobile ? MobileChatInput : DesktopChatInput

  return <Input targetMemberId={targetMemberId} />;
};

export default ChatInput;
