import { FC } from 'react';

import { AuthContextProvider } from '../../context/AuthContext';
import { EventContextProvider } from '../../context/EventContext';
import i18next from "i18next";
import { fetchApiEventos, queries } from '../../utils/Fetching';
import { useTranslation } from 'react-i18next';


interface props {

}


export const WhatsappEditorComponent: FC<props> = ({ ...props }) => {
    const { config } = AuthContextProvider()
    const { event, setEvent } = EventContextProvider()
    const { t } = useTranslation();


    return (
        <div className='relative w-full h-full'>

            <style jsx>
                {`
          .loader {
              border-top-color:  ${config?.theme?.primaryColor};
    -webkit-animation: spinner 1.5s linear infinite;
    animation: spinner 1.5s linear infinite;
    }
    @-webkit-keyframes spinner {
    0% {
    -webkit-transform: rotate(0deg);
    }
    100% {
    -webkit-transform: rotate(360deg);
    }
    }
    @keyframes spinner {
    0% {
    transform: rotate(0deg);
    }
    100% {
    transform: rotate(360deg);
    }
    }
`}
            </style>
        </div>
    );
};
