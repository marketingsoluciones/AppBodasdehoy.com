import { createContext, useState, useContext, ReactNode } from "react";

type ChatContextType = {
  chat: any;
  setChat: (chat: any) => void;
};

const ChatContext = createContext<ChatContextType>({
  chat: false,
  setChat: () => null,
});

export default ChatContext;

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chat, setChat] = useState<any>([]);

  return (
    <ChatContext.Provider value={{ chat, setChat }}>
      {children}
    </ChatContext.Provider>
  );
};

const ChatContextProvider = () => useContext(ChatContext);
export { ChatContextProvider, ChatProvider };
