import { Separator } from "../Separator";
import { GuestTable } from "./GuestTable";
import Test from "./Test"
import VistaPrevia from "./VistaPrevia";

export const EmailComponent = ({ dataInvitationSent, dataInvitationNotSent, event }) => {

    return (
        <>
            <div className="my-4">
                <Test TitelComponent={"email"} />

                <VistaPrevia event={event} />


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
              {/*   )} */}
            </div>
        </>
    )

}