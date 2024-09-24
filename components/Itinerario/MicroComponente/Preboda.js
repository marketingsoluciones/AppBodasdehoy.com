
import { useState } from "react";
import { SubHeader, SelectIcon, IconList, Time, Description, Responsable, ResponsableList, Tips, Duration, AddEvent, GuardarButtom } from "../MicroComponente";
import { Modal } from "../../Utils/Modal";
import { Form, Formik } from "formik";
import { InputTime } from "../../Forms/inputs/InputTime"
import { useTranslation } from 'react-i18next';

export const Preboda = ({ event, IconArry }) => {
    const { t } = useTranslation();
    const newDate = new Date(parseInt(event?.fecha));
    const options = { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };
    const time = newDate.toLocaleDateString("es-VE", options)
    const [openIcon, setOpenIcon] = useState(false)
    const [openResponsableList, setOpenResponsableList] = useState(false)
    const [selectIcon, setSelectIcon] = useState(null)
    const resultadoIcon = IconArry.find((Icon) => Icon.id == selectIcon);

    const ResponsablesArry = [
        {
            icon: "/rol_novia.png",
            title: "novia",
        },
        {
            icon: "/rol_novio.png",
            title: "novio",
        },
        {
            icon: "/rol_invitados.png",
            title: "invitados",
        },
        {
            icon: "/rol_proveedor.png",
            title: "proveedor",
        },

    ]

    const initialValues = {
        icon: "",
        time: "",
        duration: "20",
        descripction: "",
        responsible: "",
        tips: ""
    }

    return (
        <>
            <SubHeader date={time} title={t("prewedding")} />
            <Formik initialValues={initialValues} >
                <Form>
                    <div className="flex items-center justify-center border-b border-dashed pb-3 relative" >
                        <SelectIcon openIcon={openIcon} setOpenIcon={setOpenIcon} resultadoIcon={resultadoIcon} />
                        <div className="w-[20%] relative flex flex-col  ">
                            {/* <Time /> */}
                            <InputTime />
                            <Duration />
                        </div>

                        <Description />
                        <Responsable openModal={openResponsableList} setOpenModal={setOpenResponsableList} />
                        <Tips />
                    </div>
                </Form>
            </Formik>
            <AddEvent />
            <GuardarButtom />

            {
                openIcon ? (
                    <Modal openIcon={openIcon} setOpenIcon={setOpenIcon} classe={"h-max md:w-[30%]"} >
                        <IconList IterArry={IconArry} openIcon={openIcon} setOpenIcon={setOpenIcon} setSelectIcon={setSelectIcon} />
                    </Modal>
                ) : null
            }
            {
                openResponsableList ? (
                    <Modal openIcon={openResponsableList} setOpenIcon={setOpenResponsableList} classe={"h-max w-[16%]"} >
                        <ResponsableList DataArry={ResponsablesArry} openModal={openResponsableList} setOpenModal={setOpenResponsableList} />
                    </Modal>
                ) : null
            }
        </>

    )
}