import { ConstructIcon } from "../icons"
import { EmailTemplatesList } from "./EmailTemplatesList"
import { FooterComponent } from "./FooterComponent"

export const DiseñoComponent = ({ setEmailEditorModal, EmailEditorModal }) => {
    return (
        <>
            <div className="my-4 flex flex-col justify-center items-center translate-y-10 md:translate-y-0">

                {
                    !false ?
                        <FooterComponent  setEmailEditorModal={setEmailEditorModal} EmailEditorModal={EmailEditorModal} /> :
                        <EmailTemplatesList  setEmailEditorModal={setEmailEditorModal} EmailEditorModal={EmailEditorModal} />
                }
            </div>
        </>
    )
}