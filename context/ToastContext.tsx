//@ts-check
import { createContext, useReducer, useContext, SetStateAction, Dispatch, Reducer } from "react";
import ToastContainer from "../components/DefaultLayout/ToastContainer";

export interface Toast {
  id: string
  type: string
  message: string
}

type Context = {
  toasts : Toast[],
  dispatch: Dispatch<SetStateAction<action>>
}

const ToastContext = createContext<Context>({
  toasts: [],
  dispatch: (action: action) => null,
});

export default ToastContext;

enum actions {
  ADD_TOAST,
  DELETE_TOAST
}


type action = {
  type: keyof typeof actions;
  payload: any;
};


const toastReducer = (state: Toast[], action : action) => {
  switch(action.type){
    case "ADD_TOAST": {
        return [...state, action.payload]
    }
    case "DELETE_TOAST" : {
      const updateToast = state.filter(toast => toast.id !== action.payload)
      return updateToast
    }
    default: {
      return state
    }
  }
}



const ToastProvider = ({ children }) => {
  const [toasts, dispatch] = useReducer<Reducer<Toast[], action>>(toastReducer, []);
  
  return (
    <ToastContext.Provider value={{ toasts, dispatch }}>
      {toasts.length > 0 && <ToastContainer />}
      {children}
    </ToastContext.Provider>
  );
};

const ToastContextProvider = () => useContext(ToastContext)
export { ToastContextProvider, ToastProvider };
