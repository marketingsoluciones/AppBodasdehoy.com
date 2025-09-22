import { useTranslation } from "react-i18next";
import { EventContextProvider } from "../context";
import { getOffsetMinutes } from "../utils/FormatTime";

export const useDateTime = () => {
    const { event } = EventContextProvider();
    const { i18n } = useTranslation();
    const Lang = i18n?.language == "en" ? "en-CA" : "es-ES";
    const formatter = new Intl.DateTimeFormat(navigator.language, {
        hour: 'numeric',
        hour12: true
    });
    const d = new Date();
    d.setHours(13);
    const formattedTime = formatter.format(d);
    const regex = /(?=.*a)(?=.*m)|(?=.*p)(?=.*m)/i;
    const hour12 = regex.test(formattedTime);

    const getDateFormated = (date: Date | number | string, options?: object) => {
        const offsetMinutes = getOffsetMinutes(date, event.timeZone)
        const d = new Date(date);
        const dEpoch = d.getTime();
        const offsetMilliseconds = -1 * offsetMinutes * 60 * 1000;
        return new Date(dEpoch + offsetMilliseconds).toLocaleString(navigator.language, options);
    }
    const getDate = (date: Date | number | string) => {
        const offsetMinutes = getOffsetMinutes(date, event.timeZone)
        const d = new Date(date);
        const dEpoch = d.getTime();
        const offsetMilliseconds = -1 * offsetMinutes * 60 * 1000;
        return new Date(dEpoch + offsetMilliseconds);
    }
    /*usada en Cards y BlockPrincipal */
    const utcDateFormated = (date: Date | number | string) => {
        const options: object = { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
    };

    /*usada en dateTask */
    const utcDateFormated2Digits = (date: Date | number | string, timeZone: string) => {
        const options: object = { year: "numeric", month: "2-digit", day: "2-digit", timeZone: timeZone || "UTC" };
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
    };

    /*usada en TaskFullView */
    const dateTimeFormated = (date: Date | number | string, timeZone: string) => {
        const options: object = { year: "numeric", month: "2-digit", day: "2-digit", timeZone: timeZone || "UTC", hour: "2-digit", minute: "2-digit", hour12, timeZoneName: timeZone === "UTC" ? "short" : "long" };
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
    };

    const dateTime = (date: Date | number | string) => {
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return getDate(parseInt(date));
        }
        return getDate(date);
    };

    /*usada en FormCrearEvento */
    const utcDate = (date: Date | number | string) => {
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return new Date(parseInt(date)).toJSON().slice(0, -14);
        }
        return new Date(date).toJSON().slice(0, -14);
    };

    /*usada en DateTask */
    const utcTime = (date: Date | number | string) => {
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return new Date(parseInt(date)).toJSON().slice(-13, -8);
        }
        return new Date(date).toJSON().slice(-13, -8);
    };

    /*usada en dateTask y timeTask */
    const utcDateTime = (date: Date | number | string) => {
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return new Date(parseInt(date)).toJSON().slice(0, -14);
        }
        return new Date(date).toJSON().slice(0, -14);
    };

    const is12HourFormat = () => {
        return hour12
    }

    return { utcDateFormated, dateTimeFormated, utcDateTime, utcDate, utcDateFormated2Digits, dateTime, is12HourFormat, utcTime };
};