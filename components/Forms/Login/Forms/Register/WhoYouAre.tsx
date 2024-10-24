import { useTranslation } from 'react-i18next';
interface propsWhoYouAre {
  select: string
  setSelect: any
}

export const WhoYouAre = ({ select, setSelect }: propsWhoYouAre) => {
  const { t } = useTranslation();
  type TypeOption = {
    title: string;
    icon: string;
  };

  const List: TypeOption[] = [
    { title: "novia", icon: "/FormRegister/icon-women.webp" },
    { title: "novio", icon: "/FormRegister/icon-men.webp" },
    { title: "otro", icon: "/FormRegister/icon-heart.webp" },
    // { title: "empresa", icon: "/FormRegister/icon-business.webp" },
  ];
  return (

    <div className="grid grid-cols-3 md:gap-28 gap-16">
      {List.map((item, idx) => (
        <div key={idx} className={`flex flex-col items-center justify-center gap-2 capitalize ${item?.title === select ? "selected" : "option"}`}
        >
          <div
            onClick={() => { setSelect(item?.title) }}
            className="w-24 h-24 rounded-full shadow bg-color-base grid place-items-center overflow-hidden p-1 "
          >
            <img src={item?.icon} alt={item?.title} className="object-contain" />
          </div>
          <h2 className="text-gray-500 text-lg text-light">{t(item?.title)}</h2>
        </div>
      ))}

      <style jsx>
        {`
          .selected {
            transform: scale(1.05);
            transition: 0.5s;
          }
          .option {
            filter: saturate(0);
            transition: 0.5s;
          }

          .option:hover {
            filter: saturate(1);
            transition: 0.5s;
            cursor: pointer;
            transform: scale(1.05);
          }
        `}
      </style>

    </div>
  )
}