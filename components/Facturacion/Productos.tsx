export const Productos = ({ DataProductos, setProducts, products }) => {
    console.log(DataProductos)
    return (
        <div className="space-y-5">
            {DataProductos.map((item: any, idx: any) => (
                <div key={idx} className="bg-white grid grid-cols-6 p-3 rounded-lg items-center justify-center">
                    <div className="col-span-1 flex items-center justify-center rounded-lg bg-gray-200 h-[100px]">
                        <img
                            src={item.images.length > 0 ? item?.images[0] : "/placeholder/image.png"}
                            alt={item.name}
                            className="rounded-lg w-[70px] h-[70px]"
                        />
                    </div>
                    <div className="col-span-4 border-r-2 h-full ml-3 capitalize flex flex-col justify-center">
                        <div className="text-[22px]">
                            {item.name}
                        </div>
                        <div className="text-[13px] text-gray-500">
                            {item.description}
                        </div>
                    </div>
                    <div className="col-span-1 flex flex-col items-center justify-center space-y-3 pl-1.5 capitalize">
                        <div>
                            {`${item?.prices[0]?.currency === "usd" ? "$" : item?.prices[0]?.currency} ${item?.prices[0]?.unit_amount / 100}`}
                        </div>
                        <div className="h-[50px]">
                            <button
                                onClick={() => {
                                    setProducts(old => {
                                        if (!products?.map(elem => elem.id).includes(item?.id)) {
                                            const f1 = old.findIndex(elem => elem?.grupo === item?.metadata?.grupo)
                                            if (f1 > -1) {
                                                old?.splice(f1, 0)
                                            }
                                            old = [...old, { id: item?.id, name: item?.name, priceID: item?.prices[0]?.id, grupo: item?.metadata?.grupo }]
                                            return old
                                        }
                                        const f1 = old.findIndex(elem => elem?.id === item?.id)
                                        old?.splice(f1, 1)
                                        return [...old]
                                    })
                                }} 
                                className={`bg-primary text-[13px] py-1 px-1.5 rounded-lg  capitalize hover:opacity-90 ${products?.map(elem => elem.id).includes(item?.id) ? "bg-white border border-primary text-primary" : "bg-primary text-white"} `}>
                                    {products?.map(elem => elem.id).includes(item?.id) ? "- Quitar complemento" : "+ Añadir complemento"}
                                </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}