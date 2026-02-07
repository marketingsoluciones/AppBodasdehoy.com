import { Coordina } from "../components/InfoApp/Coordina"
import { CreaPlanifica } from "../components/InfoApp/CreaPlanifica"
import { Email } from "../components/InfoApp/Email"
import { GestionaEventos } from "../components/InfoApp/GestionaEventos"
import { GridButtons } from "../components/InfoApp/GridButtons"
import { MasInfo } from "../components/InfoApp/MasInfo"
import { PanelAcceso } from "../components/InfoApp/PanelAcceso"
import { Footer } from "../components/InfoApp/footer"

const InfoApp = () => {
    return (
        <>
            <section className="w-full ">
                <div className="bg-basePage space-y-20 pt-10 md:pb-40 pb-32 ">
                    <Coordina />
                    <CreaPlanifica />
                    <GestionaEventos />
                </div>
                <div className="relative">
                    <div className="hidden md:block">
                        <div className="absolute  inset-x-1/4 -top-32">
                            <img src="/vistaApp.png" alt="vista de la app" />
                        </div>
                    </div>
                    <div className="block md:hidden">
                        <div className="absolute  inset-x-8 -top-20">
                            <img src="/vistaAppM.png" alt="vista de la app" />
                        </div>
                    </div>
                    <div className="pb-20 md:pt-60 pt-48 ">
                        <PanelAcceso />
                    </div>
                </div>
                <div className="bg-basePage space-y-20 py-10">
                    <MasInfo />
                </div>
                <div className="py-20">
                    <GridButtons />
                </div>
                <div className="bg-basePage space-y-20 py-10">
                    <Email />
                </div>
                <div className="bg-primaryOrg space-y-5 py-10">
                    <Footer />
                </div>
            </section>
        </>
    )
}

export default InfoApp