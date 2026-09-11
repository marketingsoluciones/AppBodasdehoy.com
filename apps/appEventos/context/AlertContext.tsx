import { createContext, useState, useContext, ReactNode } from "react";

type AlertContextType = {
  alerts: any[];
  setAlerts: (alerts: any[]) => void;
};

const AlertContext = createContext<AlertContextType>({
  alerts: [],
  setAlerts: () => null,
});

export default AlertContext;

const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<any[]>([]);

  return (
    <AlertContext.Provider value={{ alerts, setAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

const AlertContextProvider = () => useContext(AlertContext);
export { AlertContextProvider, AlertProvider };
