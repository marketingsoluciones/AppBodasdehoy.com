import { createRef, FC } from "react";

interface propsTooltip {
    children: any
    label: string
    disabled?: boolean
    icon?: any
}

export const Tooltip: FC<propsTooltip> = ({ children, label, disabled, icon }) => {
    const tipRef = createRef<any>();
    function handleMouseEnter() {
        tipRef.current.style.opacity = 1;
        tipRef.current.style.marginBottom = "20px";
    }
    function handleMouseLeave() {
        tipRef.current.style.opacity = 0;
        tipRef.current.style.marginBottom = "10px";
    }
    if (disabled) return <>{children}</>
    return (
        <div className="group flex relative ">
            {children}
            <div className="group-hover:opacity-100 gap-2 flex items-center font-display transition-opacity bg-emerald-600 px-10 py-1 text-sm text-gray-100 rounded-3xl absolute left-1/2 -translate-x-1/2 translate-y-[70px] opacity-0 m-4 mx-auto">
                {/* <div></div> */}
                {icon}
                <span>
                    {label}
                </span>
            </div>
        </div>
    );
}