export const MetodosDePago = ({ setOptionSelect }) => {
    return (
        <div className="flex flex-col items-center w-[500px] border*  rounded-lg p-10 space-y-3 bg-white shadow-lg mt-3">
            <h1 className="text-[18px] font-semibold">Sin métods de pago</h1>
            <p className="text-center text-[13px] text-gray-600">Aun no tines registrado ninguna forma de pago. Puede guardar una cuando complete su primer pago.</p>
            <button
                onClick={() => setOptionSelect(0)}
                className="bg-primary text-white py-1 px-2 rounded-lg text-[13px]"
            >
                Realizar Pago
            </button>
        </div>
    )
}