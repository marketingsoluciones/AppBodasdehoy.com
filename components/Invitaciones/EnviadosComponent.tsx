import { Separator } from "../Separator"
import { GuestTable } from "./GuestTable"

export const EnviadosComponent = ({ dataInvitationSent, dataInvitationNotSent, event }) => {
    return (
        <>
            <div className="my-4">
                {/* {event?.invitados_array?.length > 0 && ( */}
                <div>
                    <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                        <Separator title="  Invitaciones pendientes" />
                        <div className="w-full overflow-auto">
                            <div className="w-[200%] md:w-full">
                                <GuestTable data={dataInvitationNotSent} multiSeled={true} reenviar={false} />
                            </div>
                        </div>
                    </div>
                    {
                        dataInvitationSent.length > 0 ? (
                            <div className="bg-white w-full rounded-xl shadow-md relative mt-4 mb-8">
                                <Separator title="Invitaciones enviadas" />
                                <div className="w-full overflow-auto">
                                    <div className="w-[200%] md:w-full">
                                        <GuestTable data={dataInvitationSent} multiSeled={true} reenviar={true} />
                                    </div>
                                </div>
                            </div>
                        ) :
                            null
                    }
                </div>
                {/*    )} */}
            </div>
        </>
    )
}