//@ts-check
import { ToastContextProvider } from "../context";

export const useToast = (delay = 4000) => {
  const { dispatch } = ToastContextProvider();

  enum types {
    success,
    error,
    warning
  }

  const toast = (type : keyof typeof types, message : string) => {
    const id = Math.random().toString(36).substring(2, 9);
    dispatch({
      type: "ADD_TOAST",
      payload: {
        id,
        type,
        message,
      },
    });

    setTimeout(() => {
      dispatch({
        type: "DELETE_TOAST",
        payload: id
      });
    }, delay);
  };

  return toast;
};
