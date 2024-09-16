import React, { useState, useEffect, useContext } from 'react'
import { AuthContextProvider } from "../context";
import { useTranslation } from 'react-i18next';



const Chat = () => {
    const { t } = useTranslation();
    //const { GrupoEventos } = useContext(GrupoEventosContext)
    const { user } = AuthContextProvider()
    const [evento_activo, setEvento_activo] = useState([]);
    const [invitadosSelect, setInvitadosSelect] = useState(false);
    const [emisorId, setEmisorId] = useState("");

    const cargar_chatsygrupos = (e, evento) => {
        e.preventDefault()
        setEvento_activo(evento)
        setInvitadosSelect(false)
    }
    const abrir_chat = (e) => {
        e.preventDefault()
        setInvitadosSelect()
        if (evento_activo?.invitados_array?.length > 0) { setInvitadosSelect(true) }
        //setInvitadosSelect(true)
    }

    useEffect(() => {
        if (evento_activo?.invitados_array?.length == 0) { setInvitadosSelect(false) }
    }, [evento_activo])


    useEffect(() => {
        //console.log(GrupoEventos)
        console.log(user.canales)
    }, [])

    return (
        <>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-3 gap-2">
                    <div>
                        1
                    </div>
                    <div>
                        2
                    </div>
                    <div>
                        3
                    </div>
                </div>
                <div>                <button className="button-primary">
                    {t("test")}
                </button>
                    <div>
                        <label>eventos, largo array: {evento_activo?.invitados_array?.length} invitadosSelect: {invitadosSelect?.toString()}</label>
                        {//GrupoEventos.map((linea, i) => (
                            //   <div key={i}>
                            //</div>       <button className="text-black bg-gray-300 px-4 py-2 hover:bg-gray-900 hover:text-white transition" //</div>onClick={e => cargar_chatsygrupos(e, linea)} type="button">{`${linea.nombre}`}</button>
                            //</div>  </div>
                            //</div>)
                            //)
                        }
                    </div>
                    <div>
                        <li>{evento_activo.nombre}</li>
                        <label>chats</label>
                        <div key="1">
                            <button className="text-black bg-gray-300 px-4 py-2 hover:bg-gray-900 hover:text-white transition" onClick={e => abrir_chat(e)} type="button">+</button>
                        </div>

                        {invitadosSelect ? <InvitadosSelect evento_activo={evento_activo} state={invitadosSelect} emisorID={act => setEmisorId(act)} set={act => setInvitadosSelect(act)} /> : <p>{t("noguestselected")}</p>}
                        <div>
                            <ChatComp />
                        </div>
                    </div>
                    <div>
                        <label>{t("groups")}</label>
                    </div>
                    <div /></div>
            </div>
        </>
    )
}

const ChatComp = (props) => {
    const { t } = useTranslation();
    const { mensajes, set, state } = props
    const [input, setInput] = useState("");
    const [valor, setValor] = useState("");
    const enviar_mensaje = (e) => {
        e.preventDefault()
        setValor(input)
        setInput("")
    }

    return (
        <>
            <div>
                <ul className="w-max h-30 w-60 overflow-auto cursor-pointer ">
                    <li key={1} className="hover:bg-base" onClick={e => iniciar_chat(e)}>{t("heremessage")}</li>
                    <li key={2} className="hover:bg-base" onClick={e => iniciar_chat(e)}>{t("heremessage")}</li>
                    <li key={3} className="hover:bg-base" onClick={e => iniciar_chat(e)}>{t("heremessage")}</li>
                    <li key={4} className="hover:bg-base" onClick={e => iniciar_chat(e)}>{t("heremessage")}</li>
                    <li key={5} className="hover:bg-base" onClick={e => iniciar_chat(e)}>{t("heremessage")}</li>
                    <li key={6} className="hover:bg-base" onClick={e => iniciar_chat(e)}>{t("heremessage")}</li>
                </ul>
            </div>
            <div>
                <input value={input} placeholder="aqui el mensaje" onInput={(e) => setInput(e.target.value)} ></input>
                <button className="text-black bg-gray-300 px-4 py-2 hover:bg-gray-900 hover:text-white transition" onClick={(e) => enviar_mensaje(e)} type="button">{t("sends")}</button>

            </div>
        </>
    )
}


const InvitadosSelect = (props) => {
    const { evento_activo, emisorID, set, state } = props
    const iniciar_chat = (e, linea) => {
        e.preventDefault()
        emisorID(linea._id)
        set(!state)

    }
    return (
        <div>
            <ul className="w-max h-28 w-28 overflow-auto cursor-pointer ">
                {evento_activo?.invitados_array?.map((linea, i) => (
                    <li key={i} className="hover:bg-base" onClick={e => iniciar_chat(e, linea)}>img {linea?.nombre}</li>
                )
                )}
            </ul>
        </div>
    )
}

export default Chat
