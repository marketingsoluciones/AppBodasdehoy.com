
const Estadistica = (props) => {
  const { total: data } = props;
  const { total, confirmados, pendientes, cancelados } = data;
  return (
    <div className=" w-full flex gap-5">
      <div className="w-full ">
        <div className={`w-full p-4 rounded-3xl bg-white h-28 mt-8 shadow-lg`}>
          <div className="flex items-center h-full justify-center">
            <div className="flex items-center gap-2 justify-center">
              <div className="text-3xl font-bold text-pink-secondary">
                {total}
              </div>
              <div className="text-regular font-light mt-2 text-pink-secondary">
                Invitados
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full ">
        <div className={`w-full p-4 flex rounded-3xl bg-white h-28 mt-8 shadow-lg`}>
          <div className="flex flex-col items-start w-1/2 pr-4 h-full justify-center border-r border-gray-200">
            <div className="flex items-center gap-1 pl-2 justify-start">
              <div className="text-xl font-bold text-blue-primary">
                {confirmados}
              </div>
              <div className="text-xs font-light text-blue-primary">
                confirmados
              </div>
            </div>
            <div className="flex items-center gap-1  pl-2 justify-start">
              <div className="text-xl font-bold text-gray-300">
                {pendientes}
              </div>
              <div className="text-xs font-light text-gray-300">pendientes</div>
            </div>
            <div className="flex items-center gap-1 pl-2 justify-start">
              <div className="text-xl font-bold text-red-300">{cancelados}</div>
              <div className="text-xs font-light text-red-300">cancelados</div>
            </div>
          </div>
          <div className="w-1/2 flex items-center justify-center">

          </div>
        </div>
      </div>

      <div className="w-full">
        <div className={`w-full p-4 rounded-3xl bg-white h-28 mt-8 shadow-lg`}>
          <div className="flex items-center h-full justify-center">
            <div className="flex items-center gap-2 justify-center">
              <div className="text-3xl font-bold text-pink-secondary">
                {total}
              </div>
              <div className="text-regular font-light mt-2 text-pink-secondary">
                Invitados no sentados
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadistica;
