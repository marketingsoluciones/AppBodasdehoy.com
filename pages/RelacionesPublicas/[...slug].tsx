import { useRouter } from "next/navigation";
import { useTranslation } from 'react-i18next';

const Slug = (params) => {
  const { t } = useTranslation();
  return (
    <div className="w-[100%] h-[100%] items-center justify-center">
      <div id="rootElement" />
      {t("saludo")}
    </div>
  );
};

export default Slug;

export async function getServerSideProps({ params }) {
  return {
    props: params,
  };
}