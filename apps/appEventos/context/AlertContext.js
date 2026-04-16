import { createContext, useState, useContext } from "react";

const AlertContext = createContext({
  alerts: [],
  setAlerts: () => null,
});

export default AlertContext;



const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  return (
    <AlertContext.Provider value={{ alerts, setAlerts }}>
      
      {children}
    </AlertContext.Provider>
  );
};

const AlertContextProvider = () => useContext(AlertContext)
export { AlertContextProvider, AlertProvider };