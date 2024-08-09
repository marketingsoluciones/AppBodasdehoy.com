
export const Productos = ({ data, setProducts, products }) => {

    const options: object = {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
    }

    return (
        <div className="space-y-5">
            {data?.map((item: any, idx: any) => {
                const status = !!item?.subscriptionId
                    ? new Date().getTime() < new Date(item?.current_period_end).getTime()
                        ? "ACTIVO"
                        : "SUPENDIDO"
                    : "ACTIVO"
                return (
                    <div key={idx} className="bg-white flex rounded-lg h-24 p-3 space-x-3 items-center justify-center">
                        <div className="bg-gray-200 flex items-center w-32 justify-center rounded-lg">
                            <img
                                src={item.images.length > 0 ? item?.images[0] : "/placeholder/image.png"}
                                alt={item.name}
                                className="rounded-lg object-contain w-[70px] h-[70px]"
                            />
                        </div>
                        <div className="flex-1 border-r-2 h-full capitalize flex flex-col justify-center">
                            <div className="text-[22px]">
                                {item.name}
                            </div>
                            <div className="text-[13px] text-gray-500">
                                {item.description}
                            </div>
                        </div>
                        <div className="flex flex-col w-36 h-full items-center justify-center capitalize">
                            {item.usage
                                ? <div className={`${status.toLowerCase() === "activo" ? "bg-green" : "bg-orange-300"} flex w-full h-11 rounded-lg items-center justify-center relative`}>
                                    <span style={{ userSelect: "none" }} className="text-[16px] font-semibold text-white">
                                        {status}
                                    </span>
                                    {!!item?.subscriptionId && <span className="text-gray-600 text-xs absolute -bottom-4 ">
                                        {`${new Date(item?.current_period_start).toLocaleDateString(undefined, options)} - ${new Date(item?.current_period_end).toLocaleDateString(undefined, options)}`}
                                    </span>}
                                </div>
                                : <>
                                    <div>
                                        {`${item?.prices[0]?.currency === "usd" ? "$" : "€"} ${(item?.prices[0]?.unit_amount / 100).toFixed(2)}`}
                                    </div>
                                    <div className="flex-1 flex items-center justify-center">
                                        <button
                                            disabled={!item?.prices[0]?.currency}
                                            onClick={() => {
                                                const f1 = products.findIndex(elem => elem?.id === item?.id)
                                                if (f1 > -1) {
                                                    products.splice(f1, 1)
                                                    setProducts([...products])
                                                    return
                                                }
                                                products.push(item)
                                                setProducts([...products])
                                            }}
                                            className={`bg-primary py-1 w-full text-[13px] rounded-lg capitalize hover:opacity-90 cursor-pointer ${products?.findIndex(elem => elem?.id === item?.id) > -1 ? "bg-white border border-primary text-primary" : "bg-primary text-white"} `}>
                                            {products?.findIndex(elem => elem?.id === item?.id) > -1 ? "- Quitar complemento" : "+ Añadir complemento"}
                                        </button>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                )
            })}
        </div>
    )
}