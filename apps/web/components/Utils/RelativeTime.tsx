import { FC } from "react";
import { formatDistanceStrict } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface RelativeTimeProps {
  date: Date | string | number;
  className?: string;
}

export const RelativeTime: FC<RelativeTimeProps> = ({ date, className }) => {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n?.language === "en" ? enUS : es;

  const formattedTime = formatDistanceStrict(
    new Date(date),
    new Date(),
    { locale: dateLocale }
  );

  return (
    <span className={className}>
      {t("ago")} {formattedTime}
    </span>
  );
};
