import ClickAwayListener from "react-click-away-listener"
import { AuthContextProvider } from "../../context"

export const ObtenerFullAcceso = () => {
    const {actionModals,setActionModals} = AuthContextProvider()
    return (
        <ClickAwayListener  onClickAway={() => actionModals && setActionModals(!actionModals)}>
            <div className="p-4 overflow-y-scroll h-full">
                <button className="bg-primary">Pagar</button>
            </div>
        </ClickAwayListener>
    )
}