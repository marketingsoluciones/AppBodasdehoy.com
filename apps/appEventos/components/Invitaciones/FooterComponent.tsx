import Banner from "./Banner"
import { useTranslation } from 'react-i18next';

export const FooterComponent = ({ setEmailEditorModal, EmailEditorModal }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full -translate-y-4">
      <div className="w-full rounded-xl bg-secondary shadow-lg px-6">
        <p className=" font-display text-white text-center">
          {t("findadesigner")}
        </p>
      </div>
      <Banner  setEmailEditorModal={setEmailEditorModal} EmailEditorModal={EmailEditorModal} />
    </div>
  )

}