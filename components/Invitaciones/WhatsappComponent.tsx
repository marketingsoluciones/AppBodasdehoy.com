import { Separator } from "../Separator"
import { GuestTable } from "./GuestTable"
import Test from "./Test"

export const WhatsappComponent = ({ dataInvitationSent, dataInvitationNotSent, event }) => {
    return(
        <>
        <div className="my-4 space-y-5" >
                <Test TitelComponent={"Whatsapp"} />

                <div className="flex items-center justify-center ">
                    <div className="bg-base p-2 rounded flex gap-2 items-center md:px-16">
                        <h2 className=" text-gray-500 text-lg font-body">Vista previa de invitacion por Whatsapp</h2>
                    </div>
                </div>

                <div className=" w-full bg-white flex py-5* justify-center rounded-xl shadow-md ">
                    <img src="/Views/wsPreView.png" alt="movilsmsview" className="h-auto w-56" />
                </div>

                {/* {event?.invitados_array?.length > 0 && ( */}
                    <div>
                        <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                            <Separator title="  Invitaciones pendientes" />
                            <GuestTable data={dataInvitationNotSent} multiSeled={true} reenviar={false} />
                        </div>
                        {
                            dataInvitationSent.length > 0 ? (
                                <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                                    <Separator title="Invitaciones enviadas" />
                                    <GuestTable data={dataInvitationSent} multiSeled={true} reenviar={true} />
                                </div>
                            ): 
                            null
                        }
                    </div>
                {/* )} */}
        </div>
           
        </>
    )
}