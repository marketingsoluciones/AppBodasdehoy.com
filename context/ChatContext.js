import { createContext, useState, useContext } from "react";

const ChatContext = createContext({
  chat: false,
  setChat: () => null,
});

export default ChatContext;


const ChatProvider = ({ children }) => {
  const [chat, setChat] = useState([]);
  
  return (
    <ChatContext.Provider value={{ chat, setChat }}>
      {children}
    </ChatContext.Provider>
  );
};

const ChatContextProvider = () => useContext(ChatContext)
export { ChatContextProvider, ChatProvider };
