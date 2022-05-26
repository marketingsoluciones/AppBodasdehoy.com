
const Modal = (props) => {
  const { children, accionModal, titulo } = props;
  return (
    <>
        <div className="flex bg-white w-max h-max z-50 items-center p-12 rounded-lg flex-col absolute right-0 left-0 m-auto top-0 ">
              {/*header*/}m
              <div className="flex items-start justify-center p-5 rounded-t border-b w-full relative">
                <h3 className="text-2xl text-gray-500 font-semibold">{titulo}</h3>
                <button className="relative text-gray-500 focus:outline-none hover:text-gray-900" onClick={()=> accionModal(false)}>
                <CloseIcon width="25"/>
                </button>

              </div>
              {/*body*/}
              
              {children}
            </div>
        <div className="opacity-25 fixed inset-0 z-40 bg-black" onClick={()=> accionModal(false)}></div>
      </>
  );
};

export default Modal;

