import { Form, Formik } from "formik";
import { SubHeader } from "./SubHeader";
import { AddEvent, Description, Duration, GuardarButtom, IconList, ResponsableSelector, ResponsableList, SelectIcon, Time, Tips } from "../MicroComponente";
import { Modal } from "../../Utils/Modal";
import { useState } from "react";
import { InputTime } from "../../Forms/inputs/InputTime";
import { useTranslation } from 'react-i18next';

export const ElGranDia = ({ event, IconArry }) => {
    const newDate = new Date(parseInt(event?.fecha));
    const options = { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };
    const time = newDate.toLocaleDateString("es-VE", options)
    const [openIcon, setOpenIcon] = useState(false)
    const [openResponsableList, setOpenResponsableList] = useState(false)
    const [selectIcon, setSelectIcon] = useState(null)
    const resultadoIcon = IconArry.find((Icon) => Icon.id == selectIcon);

    const initialValues = {
        icon: "",
        time: "",
        duration: "20",
        descripction: "",
        responsible: "",
        tips: ""
    }

    const ResponsablesArry = [
        {
            icon: "/rol_novia.png",
            title: "Novia",
        },
        {
            icon: "/rol_novio.png",
            title: "Novio",
        },
        {
            icon: "/rol_invitados.png",
            title: "Invitados",
        },
        {
            icon: "/rol_proveedor.png",
            title: "Proveedor",
        },

    ]

    return (
        <>
            <SubHeader date={time} title={"El Gran Dia"} />
            <Formik initialValues={initialValues} >
                <Form>
                    <div className="flex items-center justify-center  border-b border-dashed pb-3" >
                        <SelectIcon openIcon={openIcon} setOpenIcon={setOpenIcon} resultadoIcon={resultadoIcon} />
                        <div className="w-[20%] relative flex flex-col ">
                            <InputTime />
                            <Duration />
                        </div>
                        <Description />
                        <ResponsableSelector openModal={openResponsableList} setOpenModal={setOpenResponsableList} />
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