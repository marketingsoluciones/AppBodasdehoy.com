const TooltipOld = ({ text }) => {
    console.log("***************** TOOLTIP *****************")
    return (
        <div className="bg-white shadow-md px-3 py-1 absolute top-10 w-max transform transform-x-full z-20 rounded-lg border-2 border-base ">
            <p className="font-display text-sm ">{text}</p>
        </div>
    )
}

export default TooltipOld
