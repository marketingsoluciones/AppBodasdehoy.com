import { Formik, Form } from "formik"
import InputField from "./InputField"
import SelectField from "./SelectField"
import { phoneUtil } from "../../utils/Authentication";
import { AuthContextProvider } from "../../context";
import { FC } from "react";
import { guests, menu } from "../../utils/Interfaces";
import { useRouter } from "next/router";
import { fetchApiEventos, queries } from "../../utils/Fetching";
import { useTranslation } from 'react-i18next';

interface props {
    visible: boolean
    setVisible: any
    guestData: guests[]
    guestFather: guests
    menus_array: menu[]
}


export const FormConfirmarAsistencia: FC<props> = ({ visible, setVisible, guestData, guestFather, menus_array }) => {
    const { t } = useTranslation();
    const { geoInfo } = AuthContextProvider();
    const router = useRouter()
    const GuestAcompañantes = guestData.filter(e => e.father != null)
    const GuetsArray = Array.from({ length: guestFather?.passesQuantity }, (_, index) => index);
    const eventID = router?.query?.pGuestEvent?.slice(-24)

    let initialValues = {
        _id: guestFather?._id,
        nombre: guestFather?.nombre ?? "",
        telefono: guestFather?.telefono ? guestFather?.telefono : `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`,
        correo: guestFather?.correo ?? "",
        sexo: guestFather?.sexo ?? "",
        grupo_edad: guestFather?.grupo_edad ?? "",
        nombre_menu: guestFather?.nombre_menu ?? "",
        confirmacion: guestFather?.asistencia ?? "",
    }

    for (let i = 0; i < guestFather?.passesQuantity; i++) {
        initialValues = {
            ...initialValues,
            [`_id_${i}`]: GuestAcompañantes[i]?._id ?? "",
            [`nombre_${i}`]: GuestAcompañantes[i]?.nombre ?? "",
            [`telefono_${i}`]: GuestAcompañantes[i]?.telefono ? GuestAcompañantes[i].telefono : `+${phoneUtil.getCountryCodeForRegion(geoInfo?.ipcountry)}`,
            [`correo_${i}`]: GuestAcompañantes[i]?.correo ?? "",
            [`sexo_${i}`]: GuestAcompañantes[i]?.sexo ?? "",
            [`grupo_edad_${i}`]: GuestAcompañantes[i]?.grupo_edad ?? "",
            [`nombre_menu_${i}`]: GuestAcompañantes[i]?.nombre_menu ?? "",
            [`confirmacion_${i}`]: GuestAcompañantes[i]?.asistencia ?? "",
        }
    }

    const handelSubmit = (values: any) => {
        let sendValues = [
            {
                _id: initialValues._id,
                nombre: values[`nombre`],
                telefono: values[`telefono`],
                correo: values[`correo`],
                sexo: values[`sexo`],
                grupo_edad: values[`grupo_edad`],
                nombre_menu: values[`nombre_menu`],
                asistencia: values[`confirmacion`]
            }
        ]
        for (let i = 0; i < guestFather?.passesQuantity; i++) {
            const item = {
                _id: initialValues[`_id_${i}`] === "" ? null : initialValues[`_id_${i}`],
                nombre: values[`nombre_${i}`],
                telefono: values[`telefono_${i}`],
                correo: values[`correo_${i}`],
                sexo: values[`sexo_${i}`]  === "" ? "hombre" : values[`sexo_${i}`],
                grupo_edad: values[`grupo_edad_${i}`] === "" ? "adulto" : values[`grupo_edad_${i}`],
                nombre_menu: values[`nombre_menu_${i}`] === "" ? "adultos" : values[`nombre_menu_${i}`],
                father: guestFather._id,
                asistencia: values[`confirmacion_${i}`] === "" ? "pendiente" : values[`confirmacion_${i}`]

            }
            if (!!item.nombre) {
                sendValues.push(item)
            }
        }
        fetchApiEventos({
            query: queries.createGuests,
            variables: {
                eventID: eventID,
                invitados_array: sendValues
            },
        }).then(result => {
            console.log(result)
            if (result ) {
                setVisible(!visible)
            }
        })
    }

    return (
        <>
            <Formik initialValues={initialValues} onSubmit={handelSubmit}>
                <Form className="w-full">
                    <div className="flex flex-col space-y-4  ">
                        <div className="px-5 space-y-3">
                            <div className="grid md:grid-cols-2 gap-5 ">
                                <InputField
                                    id="nombre"
                                    name="nombre"
                                    label={t("guestname")}
                                    type="text"
                                    labelClass={false}
                                />
                                <InputField
                                    id="telefono"
                                    name="telefono"
                                    label={t("phone")}
                                    type="telefono"
                                    labelClass={false}
                                />
                            </div>
                            <div className="grid md:grid-cols-2 gap-2 md:gap-5">
                                <InputField
                                    name={`correo`}
                                    label={t("email")}
                                    type="email"
                                    labelClass={false}
                                />
                                <div className="grid grid-cols-2 gap-5 ">
                                    <SelectField
                                        options={["Hombre", "Mujer"]}
                                        name="sexo"
                                        label={t("sex")}
                                        labelClass={false}

                                    />
                                    <SelectField
                                        options={["Adulto", "Niño"]}
                                        name={`grupo_edad`}
                                        label={t("age")}
                                        labelClass={false}
                                    />
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-2 md:gap-5">
                                <SelectField
                                    nullable
                                    options={["Confirmado", "Cancelado"]}
                                    name="confirmacion"
                                    label={t("confirmationattendance")}
                                    labelClass={false}
                                />
                                <SelectField
                                    name={`nombre_menu`}
                                    label={t("menu")}
                                    labelClass={false}
                                    options={[...menus_array?.map(elem => elem.nombre_menu), "sin menú"]}
                                />
                            </div>
                        </div>
                        {
                            (() => {
                                if (GuetsArray.length > 0) {
                                    return (
                                        <>
                                            <div className="bg-primary flex flex-col items-center justify-center py-5 space-y-1">
                                                <p className="text-acento text-2xl md:text-3xl font-body ">{t("have")}{GuetsArray.length}{t("morepasses")}</p>
                                                <p className="text-white md:text-xl font-body">{t("registercompanions")}</p>
                                            </div>
                                        </>
                                    )
                                }
                            })()
                        }
                        {GuetsArray?.map((_, i) => {
                            return (
                                <div key={i} className="px-5">
                                    < div >
                                        <div
                                            className="text-acento font-body font-semibold text-2xl mb-3 mt-5 "
                                        >
                                            Pase {[i + 1]}
                                        </div>
                                        <div className=" space-y-3" >
                                            <div className="grid md:grid-cols-2 gap-5 ">
                                                <InputField
                                                    id={`nombre_${i}`}
                                                    name={`nombre_${i}`}
                                                    label={t("guestname")}
                                                    type="text"
                                                    labelClass={false}
                                                />
                                                <InputField
                                                    //placeholder="960 66 66 66"
                                                    id={`telefono_${i}`}
                                                    name={`telefono_${i}`}
                                                    label={t("phone")}
                                                    type="telefono"
                                                    labelClass={false}
                                                />

                                            </div>
                                            <div className="grid md:grid-cols-2 gap-2 md:gap-5">
                                                <InputField
                                                    id={`correo_${i}`}
                                                    name={`correo_${i}`}
                                                    label={t("email")}
                                                    type="email"
                                                    labelClass={false}
                                                />
                                                <div className="grid grid-cols-2 gap-5 ">
                                                    <SelectField
                                                        id={`sexo_${i}`}
                                                        name={`sexo_${i}`}
                                                        label={t("sex")}
                                                        options={["Hombre", "Mujer"]}
                                                        labelClass={false}
                                                    />
                                                    <SelectField
                                                        id={`grupo_edad_${i}`}
                                                        name={`grupo_edad_${i}`}
                                                        label={t("ago")}
                                                        options={["Adulto", "Niño"]}
                                                        labelClass={false}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-2 md:gap-5">
                                                <SelectField
                                                    nullable
                                                    options={["Confirmado", "Cancelado"]}
                                                    name={`confirmacion_${i}`}
                                                    label={t("confirmationattendance")}
                                                    labelClass={false}
                                                />
                                                <SelectField
                                                    id={`nombre_menu_${i}`}
                                                    name={`nombre_menu_${i}`}
                                                    label={t("menu")}
                                                    labelClass={false}
                                                    options={[...menus_array?.map(elem => elem.nombre_menu), "sin menú"]}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            )
                        })}
                        <div className="flex items-center justify-center">
                            <button type="submit" className=" bg-primary md:w-[30%] px-5 md:px-0 py-2 rounded-2xl font-body text-white">
                                {t("rsvp")}
                            </button>
                        </div>
                    </div>
                </Form>
            </Formik>
        </>
    )
}