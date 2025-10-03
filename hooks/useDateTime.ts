import { useTranslation } from "react-i18next";
import { EventContextProvider } from "../context";
import { getOffsetMinutes } from "../utils/FormatTime";

export const useDateTime = () => {
    const { event } = EventContextProvider();
    const { i18n } = useTranslation();
    const Lang = i18n?.language == "en" ? "en-CA" : "es-ES";
    const formatter = new Intl.DateTimeFormat(Intl.DateTimeFormat().resolvedOptions().locale, {
        hour: 'numeric',
        hour12: true
    });
    const { hourCycle } = formatter.resolvedOptions();
    const hour12 = hourCycle === 'h11' || hourCycle === 'h12';

    const getDateFormated = (date: Date | number | string, options?: object) => {
        const offsetMinutes = getOffsetMinutes(date, event?.timeZone)
        const d = new Date(date);
        const dEpoch = d.getTime();
        const offsetMilliseconds = -1 * offsetMinutes * 60 * 1000;
        return new Date(dEpoch + offsetMilliseconds).toLocaleString(navigator.language, options);
    }

    /*usada en Cards BlockPrincipal */
    const utcDateFormated = (date: Date | number | string) => {
        const options: object = { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" };
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
    };

    /*usada en DateTask */
    const utcDateFormated2Digits = (date: Date | number | string, timeZone?: string) => {
        const validTimeZone = timeZone && typeof timeZone === 'string' ? timeZone : "UTC";
        const options: object = { year: "numeric", month: "2-digit", day: "2-digit", timeZone: validTimeZone };
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
    };

    /*usada en TaskFullView TaskDurationContainer*/
    const dateTimeFormated = (date: Date | number | string, timeZone?: string) => {
        const validTimeZone = timeZone && typeof timeZone === 'string' ? timeZone : "UTC";
        const options: object = { year: "numeric", month: "2-digit", day: "2-digit", timeZone: validTimeZone, hour: "2-digit", minute: "2-digit", hour12, timeZoneName: validTimeZone === "UTC" ? "short" : "long" };
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
    };

    /*usada en TaskSchemaView TimeTask*/
    const timeFormated = (date: Date | number | string, timeZone?: string) => {
        const validTimeZone = timeZone && typeof timeZone === 'string' ? timeZone : "UTC";
        const options: object = { timeZone: validTimeZone, hour: "2-digit", minute: "2-digit", hour12 };
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return getDateFormated(parseInt(date), options);
        }
        return getDateFormated(date, options);
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

    /*usada en DateTask TimeTask */
    const utcDateTime = (date: Date | number | string) => {
        if (typeof date === 'string' && !date.includes('T') && !date.includes('-')) {
            return new Date(parseInt(date)).toJSON().slice(0, -14);
        }
        return new Date(date).toJSON().slice(0, -14);
    };

    /*usada en TimeTask */
    const is12HourFormat = () => {
        return hour12
    }

    return { utcDateFormated, dateTimeFormated, utcDateTime, utcDate, utcDateFormated2Digits, is12HourFormat, utcTime, timeFormated };
};