import { FC, useEffect, useState } from 'react';
import { getRelativeTime } from '../../../utils/FormatTime';
import { useTranslation } from 'react-i18next';
import { GuestCellProps } from '../types';

export const GuestDateCell: FC<GuestCellProps> = ({ value }) => {
  const { t } = useTranslation();
  const [dateValue, setDateValue] = useState(value);

  useEffect(() => {
    setDateValue(value);
  }, [value]);

  const displayText = dateValue ? getRelativeTime(dateValue) : t("sin enviar");

  return (
    <div className="group truncate relative w-full h-full flex items-center justify-center pl-3 gap-1">
      <p className="font-display text-md truncate  first-letter:capitalize">
        {displayText}
      </p>
    </div>
  );
}; 