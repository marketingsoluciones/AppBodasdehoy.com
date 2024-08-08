export const Productos = ({ data, setProducts, products }) => {
    return (
        <div className="space-y-5">
            {data?.map((item: any, idx: any) => (
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
                            {`${item?.prices[0]?.currency === "usd" ? "$" : "€"} ${(item?.prices[0]?.unit_amount / 100).toFixed(2)}`}
                        </div>
                        <div className="h-[50px]">
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
                                className={`bg-primary text-[13px] py-1 px-1.5 rounded-lg  capitalize hover:opacity-90 ${products?.findIndex(elem => elem?.id === item?.id) > -1 ? "bg-white border border-primary text-primary" : "bg-primary text-white"} `}>
                                {products?.findIndex(elem => elem?.id === item?.id) > -1 ? "- Quitar complemento" : "+ Añadir complemento"}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}