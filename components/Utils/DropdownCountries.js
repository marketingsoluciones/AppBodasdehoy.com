import axios from "axios";
import { useField } from "formik";
import { memo, useEffect } from "react";
import { useState, useMemo } from "react";
import ClickAwayListener from "react-click-away-listener";
import DataCountries from "../../utils/RestCountries.json";

const DropdownCountries = memo(({ label, ...props }) => {
  const Countries = useMemo(() => DataCountries, []);
  const [ciudades, setCiudades] = useState(Countries);
  const [field, meta, helpers] = useField(props);
  const [show, setShow] = useState(false);
  const { setValue } = helpers;
  const [image, setImage] = useState("");
  const [country, setCountry] = useState("")


  useEffect(() => {
    GeolocationIP()
  }, [])

  useEffect(() => {
    const res = DataCountries.find(item => item.alpha2Code == country)
    setValue(res?.name)
    setImage(res?.flag)
  }, [country])

  const GeolocationIP = async () => {
    const {data} = await axios.get("https://api.country.is")
    setCountry(data.country)

  } 


  return (
      <ClickAwayListener onClickAway={() => show ? setShow(false) : null} >
    <div onFocus={() => setShow(true)} className="relative">
      <div className="flex flex-col py-4">
        <label className="text-sm text-primary font-display w-full">{label}</label>
        <span className="relative">
          <input
            {...field}
            {...props}
            autoComplete="off"
            onChange={async (e) => {
              setShow(true);
              setValue(e.target.value);
              setImage("");
              setCiudades(
                Countries.filter(({ name }) =>
                  name.toLowerCase().includes(e.target.value.toLowerCase())
                )
              );
            }}
            className="text-sm py-1 border border-gray-100 w-full rounded-full px-4 focus:outline-none"
          ></input>
          <img
            src={image}
            className="absolute top-0 bottom-0 my-auto right-6 w-6 h-4 rounded"
          />
        </span>
      </div>

      
      <div
        className={`max-h-40 top-20 mx-auto w-full absolute bg-white z-50  shadow-2xl rounded-lg overflow-auto ${
          show ? "block" : "hidden"
        }`}
      >
        <ul>
          {ciudades.map((country, index) => {
            return (
              <>
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 text-sm px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
                  onClick={() => {
                    setValue(country.name);
                    setShow(false);
                    setImage(country.flag);
                  }}
                >
                  {country.name}
                  <div id="flag" className="w-6 h-4 rounded" />
                </li>
                <style jsx>
                  {`
                    #flag {
                      background: url(${country.flag});
                      background-size: contain;
                    }
                  `}
                </style>
              </>
            );
          })}
        </ul>
      </div>
    </div>
      </ClickAwayListener>
  );
});

export default DropdownCountries;
