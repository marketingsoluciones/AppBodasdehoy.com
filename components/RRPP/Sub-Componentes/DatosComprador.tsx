import { FC } from "react"

interface propsDatosComprador{
    idx:any;
    item:any
}
export const DatosComprador: FC<propsDatosComprador> = ({idx,item}) => {
    
    return( <>
        <div className="w-auto rounded-md overflow-hidden bg-white shadow-[0px_1px_5px_rgba(0,_0,_0,_0.12),_0px_2px_2px_rgba(0,_0,_0,_0.14),_0px_3px_1px_-2px_rgba(0,_0,_0,_0.2)] flex flex-col items-start justify-start text-gray-600">
        <div className="w-full bg-rosa flex flex-col items-start justify-start py-[10.5px] pl-[21px]">
          <b className="relative leading-[21px] uppercase text-gray-600 inline-block">
            Datos del Comprador #{idx+1}
          </b>
        </div>
        <div className="self-stretch w-full h-auto pb-5 px-5 pt-2">
          <div className="self-stretch flex flex-row gap-2 items-center justify-center ">
          
          <div className="h-[100%)] w-[100%] flex flex-col items-start justify-start">
            <div className="self-stretch flex flex-col items-start justify-start ">
              <div className="relative leading-[21px] font-semibold inline-block ">
                Nombre y apellidos
              </div>
            </div>
             <input
              className="[outline:none] font-medium text-sm bg-gray-200 self-stretch rounded-[5.25px] box-border h-9 flex flex-col items-start justify-start py-0 px-[11.5px] text-black border-[1px] border-solid border-gray-200"
              placeholder={item.comprador}
              type="text"
              /* value={inputValue}
              onChange={(event) => setInputValue(event.target.value)} */
            /> 
          </div>

          <div className="h-[100%] w-[100%] flex flex-col items-start justify-start">
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="relative leading-[21px] font-semibold inline-block">
                Correo electrónico
              </div>
            </div>
            <input
              className="[outline:none] font-medium text-sm bg-gray-200 self-stretch rounded-[5.25px] box-border h-9 flex flex-col items-start justify-start py-0 px-[11.5px] text-black border-[1px] border-solid border-gray-200"
              placeholder={item.email}
              type="text"
          /*     value={input1Value}
              onChange={(event) => setInput1Value(event.target.value)} */
            /> 
          </div>

          <div className="h-[100%] w-[100%] flex flex-col items-start justify-start">
            <div className="self-stretch flex flex-col items-start justify-start">
              <div className="relative leading-[21px] font-semibold inline-block ">
                Repetir correo electrónico
              </div>
            </div>
        <input
              className="[outline:none] bg-gray-200 self-stretch relative rounded-[5.25px] box-border h-9 border-[1px] border-solid border-gray-200"
              type="text"
/*               value={input2Value}
              onChange={(event) => setInput2Value(event.target.value)} */
            /> 
          </div>
          </div>
          <div className="h-[100%] w-[100%] flex flex-col items-start justify-start">
            <div className="self-stretch flex flex-col items-start justify-start ">
              <div className="relative leading-[21px] font-semibold inline-block">
                Teléfono
              </div>
            </div>
            <input
              className="[outline:none] flex font-medium text-sm bg-gray-200 self-stretch rounded-[5.25px] flex-row items-start justify-start pt-[9px] px-[52.79999999999927px] pb-2.5 italic text-black border-[1px] border-solid border-gray-200"
              placeholder={item.telefono}
              type="text"
/*               value={divitiValue}
              onChange={(event) => setDivitiValue(event.target.value)} */
            /> 
          </div>
        </div>
      </div>
      </>)
}