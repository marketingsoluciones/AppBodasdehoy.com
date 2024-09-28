export const MenuOptions = ({ DataOptionsArry, optionSelect, onClick }) => {
    return (
        <div className="bg-blue-500 flex w-full items-center justify-center border-b md:py-2">
            <div className="bg-violet-300 flex-1 ">
                <div className="flex justify-between">
                    {
                        DataOptionsArry.map((item, idx) => {
                            return (
                                <div key={idx} onClick={() => onClick(item?.title)} className={`flex items-center space-x-1 pb-0.5 cursor-pointer ${optionSelect === item.title ? " border-b-2 border-primary text-primary" : "text-gray-400"} `}>
                                    <div>
                                        {item.icon}
                                    </div>
                                    <div>
                                        {item.title}
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>
            </div>
            <div className="bg-lime-500 w-20">
                algo
            </div>
        </div>
    )
}