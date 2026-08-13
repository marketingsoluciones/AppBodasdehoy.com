import { useField } from "formik";
import { memo, useEffect, useRef, useState, useMemo } from "react";
import ClickAwayListener from "react-click-away-listener";
import DataCountries from "../../utils/RestCountries.json";
import { AuthContextProvider } from "../../context";

type Country = {
  name: string;
  alpha2Code: string;
  flag?: string;
};

const flagUrl = (alpha2Code?: string): string =>
  alpha2Code ? `https://flagcdn.com/w40/${alpha2Code.toLowerCase()}.png` : "";

// Países comunes (studio): España + Europa cercana + Norteamérica + Latinoamérica hispana + Brasil
const COMMON_CC = new Set([
  "ES", "PT", "GB", "FR", "AD", "IT", "DE",
  "US", "CA", "MX", "GT", "SV", "HN", "NI", "CR", "PA", "CU", "DO", "PR",
  "CO", "PE", "EC", "VE", "BO", "CL", "AR", "PY", "UY", "BR",
]);

const DropdownCountries = memo(({ label, studio, ...props }: { label?: string; studio?: boolean;[key: string]: any }) => {
  const Countries = useMemo(() => DataCountries as Country[], []);
  const baseList = useMemo(() => studio ? Countries.filter((c) => COMMON_CC.has(c.alpha2Code)) : Countries, [Countries, studio]);
  const [ciudades, setCiudades] = useState(baseList);
  const [field, , helpers] = useField(props as any);
  const [show, setShow] = useState(false);
  const { setValue } = helpers;
  const [image, setImage] = useState("");
  const { geoInfo } = AuthContextProvider();
  const autoAppliedRef = useRef(false);
  const userTouchedRef = useRef(false);

  // Bandera según valor actual del campo
  useEffect(() => {
    if (!field.value || typeof field.value !== "string") {
      setImage("");
      return;
    }
    const match = Countries.find(
      (item) => item.name.toLowerCase() === field.value.toLowerCase()
    );
    setImage(match ? flagUrl(match.alpha2Code) : "");
  }, [field.value, Countries]);

  // Auto-selección: solo si el campo está vacío y el usuario no ha tocado el input
  useEffect(() => {
    if (studio) return; // studio: sin auto-detección, el usuario elige el país
    if (autoAppliedRef.current || userTouchedRef.current) return;
    if (field.value) {
      autoAppliedRef.current = true;
      return;
    }

    const code =
      typeof geoInfo?.ipcountry === "string" ? geoInfo.ipcountry.toUpperCase() : "";
    if (!code || code === "XX") return;

    const match = Countries.find((item) => item.alpha2Code === code);
    if (!match) return;

    autoAppliedRef.current = true;
    setValue(match.name);
  }, [geoInfo, field.value, Countries, setValue]);

  // Fallback si AuthContext aún no tiene geo (p. ej. form antes de verificationDone)
  useEffect(() => {
    if (studio) return; // studio: sin auto-detección
    if (autoAppliedRef.current || userTouchedRef.current || field.value) return;
    if (geoInfo?.ipcountry) return;

    let cancelled = false;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data: { ipcountry?: string }) => {
        if (cancelled || autoAppliedRef.current || userTouchedRef.current || field.value) return;
        const code = typeof data?.ipcountry === "string" ? data.ipcountry.toUpperCase() : "";
        if (!code || code === "XX") return;
        const match = Countries.find((item) => item.alpha2Code === code);
        if (!match) return;
        autoAppliedRef.current = true;
        setValue(match.name);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [geoInfo, field.value, Countries, setValue]);

  return (
    <ClickAwayListener onClickAway={() => (show ? setShow(false) : null)}>
      <div onFocus={() => setShow(true)} className="relative">
        <div className={`flex flex-col ${studio ? "" : "py-4"}`}>
          <label className="text-sm text-primary font-display w-full">{label}</label>
          <span className="relative">
            <input
              {...field}
              {...props}
              autoComplete="off"
              onChange={(e) => {
                userTouchedRef.current = true;
                setShow(true);
                setValue(e.target.value);
                setCiudades(
                  baseList.filter(({ name }) =>
                    name.toLowerCase().includes(e.target.value.toLowerCase())
                  )
                );
              }}
              className="text-sm py-1 border border-gray-100 w-full rounded-full px-4 focus:outline-none pr-12"
            />
            {image ? (
              <img
                src={image}
                alt=""
                className="absolute top-0 bottom-0 my-auto right-4 w-6 h-4 object-cover rounded"
              />
            ) : null}
          </span>
        </div>

        <div
          className={`max-h-40 top-20 mx-auto w-full absolute bg-white z-50 shadow-2xl rounded-lg overflow-auto ${
            show ? "block" : "hidden"
          }`}
        >
          <ul>
            {ciudades.map((c) => (
              <li
                key={c.alpha2Code}
                className="flex items-center justify-between gap-2 text-sm px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
                onClick={() => {
                  userTouchedRef.current = true;
                  setValue(c.name);
                  setShow(false);
                }}
              >
                <span>{c.name}</span>
                <img
                  src={flagUrl(c.alpha2Code)}
                  alt=""
                  className="w-6 h-4 object-cover rounded shrink-0"
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ClickAwayListener>
  );
});

DropdownCountries.displayName = "DropdownCountries";

export default DropdownCountries;
