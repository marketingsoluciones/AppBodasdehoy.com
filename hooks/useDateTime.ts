import { useTranslation } from "react-i18next";

export const useDateTime = () => {
    const { i18n } = useTranslation();
    const L = i18n?.language == "en" ? "en-US" : "es-ES";

    const getDateFormated = (date: Date | number | string, options?: object) => {
        const d = new Date(date);
        const dEpoch = d.getTime();
        const offsetMilliseconds = d.getTimezoneOffset() * 60 * 1000;
        return new Date(dEpoch + offsetMilliseconds).toLocaleString(L, options);
    }

    const utcDateFormated = (date: Date | number | string, timeZone?: string) => {
        const options: object = { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };
        if (typeof date === 'string') {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
    };

    const utcDateTimeFormated = (date: Date | number | string, timeZone?: string) => {
        const options: object = { year: "numeric", month: "long", day: "numeric", timeZone: "UTC", hour: "2-digit", minute: "2-digit" };
        if (typeof date === 'string') {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
    };

    const utcDate = (date: Date | number | string, timeZone?: string) => {
        if (typeof date === 'string') {
            return new Date(parseInt(date)).toJSON().slice(0, -14);
        }
        return new Date(date).toJSON().slice(0, -14);
    };

    return { utcDateFormated, utcDateTimeFormated, utcDate };
};