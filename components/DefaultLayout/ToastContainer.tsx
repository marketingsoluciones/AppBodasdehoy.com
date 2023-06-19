//@ts-check
import { AnimatePresence, motion } from "framer-motion";
import { FC } from "react";
import { ToastContextProvider } from "../../context";
import { Toast } from "../../context/ToastContext";
import { capitalize } from "../../utils/Capitalize";
import { CSSTransition, TransitionGroup } from "react-transition-group";

const ToastContainer: FC = () => {
  const { toasts } = ToastContextProvider()

  return (
    <>
      {
        
        <TransitionGroup initial={false} >
        <ul className="fixed bottom-3 md:bottom-3 right-5 mx-auto w-max md:w-2/6 h-max z-[1000] grid grid-flow-row gap-6">
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast}/>
          ))}
        </ul>
        </TransitionGroup>
       
      }
    </>
  );
};

const Toast: FC<Toast> = ({ message, id, type }) => {
  const { dispatch } = ToastContextProvider()

  const colors = {
    success: "bg-green",
    error: "bg-red",
    warning: "bg-yellow-700",

  }
  return (
    <motion.li initial={{ opacity: 0, scale: 0.3, y: 25 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ ease: "easeIn" }}  >
      <div className={`rounded-md ${colors[type]} text-white p-4  z-[1000]`}>
        <div className="flex">
          <div className="flex-shrink-0"></div>
          <div className="ml-3">
            <p className={`text-sm font-display font-medium`}>
              {message && capitalize(message)}
            </p>
          </div>
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={() => {
                  dispatch({ type: "DELETE_TOAST", payload: id });
                }}
                className={`inline-flex rounded-md p-1.5`}
              >
                <span className="sr-only">Dismiss</span>

                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.li>


  )
}

export default ToastContainer