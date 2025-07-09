import { useRouter } from "next/router"
import { GoTriangleRight } from "react-icons/go";

export const EmailTemplatesList = ({ setEmailEditorModal, EmailEditorModal }) => {
    return (
        <div className="w-full -my-7 h-[270px]   ">
            <div className="flex justify-center items-center pb-1 text-xl text-primary font-body">
                Mis Plantillas
            </div>
            <div className="grid grid-cols-2 ">
                <div className="col-span-1 ">
                    <TempaltesList />
                </div>
                <div className="flex justify-end gap-4 col-span-1 relative bg-blue pr-2">
                    <img src="/ejemplocard5.webp" className=" h-[220px] rounded-lg absolute right-32 z-40 " />
                    <img src="/ejemplocard3.webp" className=" h-[220px] rounded-lg absolute right-24 z-30 " />
                    <img src="/ejemplocard4.webp" className=" h-[220px] rounded-lg absolute right-16 z-20 " />
                    <img src="/ejemplocard1.webp" className=" h-[220px] rounded-lg absolute right-10 z-10" />
                    <img src="/ejemplocard2.jpg" className=" h-[220px] rounded-lg" />

                <div onClick={() => setEmailEditorModal(!EmailEditorModal)} className="absolute bg-primary w-28 h-28 rounded-full z-40 -bottom-3 right-0 cursor-pointer hover:scale-110 transition-all ">
                    <div className="flex justify-center items-center h-full text-xs text-white ">
                        Diseñar nuevo
                    </div>
                </div>
                </div>
            </div>
        </div>
    )
}

const TempaltesList = () => {
    const plantillas = [
        {
            id: 1,
            name: 'Plantilla 1asdasdasdasdasd',
            description: 'Descripción de la plantilla 1',
            image: '/images/plantilla1.png'
        },
    ]
    return (
        <div className="text-xl bg-slate-50 rounded-md">
            <div className="h-[230px] w-full px-4 py-2 overflow-y-auto ">
                { 
                    plantillas.map((item, idx) => {
                        return (

                            <div key={idx} className="truncate overflow-hidden flex items-center text-[13px] cursor-pointer hover:opacity-80 transition">
                                <GoTriangleRight />
                                {
                                    item.name
                                }
                            </div>
                        )
                    })
                }


            </div>
        </div>
    )
}
