import { FC, ReactNode, useMemo } from "react";
import { motion } from "framer-motion";
import { IoCloseOutline } from "react-icons/io5";
import { TFunction } from "i18next";

interface FiltersModalProps {
  isMobile: boolean;
  show: boolean;
  onClose: () => void;
  onClear: () => void;
  title?: string;
  titleKey?: string;
  clearLabel?: string;
  clearLabelKey?: string;
  closeAriaLabel?: string;
  closeAriaLabelKey?: string;
  content: ReactNode;
  contentClassName?: string;
  t: TFunction<"translation", undefined>
}

export const FiltersModal: FC<FiltersModalProps> = ({
  isMobile,
  show,
  onClose,
  onClear,
  title,
  clearLabel,
  titleKey,
  clearLabelKey,
  closeAriaLabel,
  closeAriaLabelKey,
  content,
  contentClassName = "p-3 space-y-3 max-h-80 overflow-y-auto",
  t
}) => {
  const resolvedTitle = useMemo(() => {
    if (titleKey) return t(titleKey);
    if (title) return title;
    return t("Filtros", { defaultValue: "Filtros" });
  }, [t, title, titleKey]);

  const resolvedClearLabel = useMemo(() => {
    if (clearLabelKey) return t(clearLabelKey);
    if (clearLabel) return clearLabel;
    return t("Limpiar", { defaultValue: "Limpiar" });
  }, [t, clearLabel, clearLabelKey]);

  const resolvedCloseAriaLabel = useMemo(() => {
    if (closeAriaLabelKey) return t(closeAriaLabelKey);
    if (closeAriaLabel) return closeAriaLabel;
    return t("Cerrar", { defaultValue: "Cerrar" });
  }, [t, closeAriaLabel, closeAriaLabelKey]);

  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isMobile ? 0.3 : 0 }}
    >
      <div className="md:hidden top-0 left-0 w-full h-full bg-black bg-opacity-50 z-40" />
      <div className="filters-modal fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:absolute md:top-11 md:left-32 md:translate-x-0 md:translate-y-0 bg-white shadow-xl rounded-xl border z-50 w-full h-[80vh] md:w-80 md:h-auto md:max-h-[450px] overflow-y-auto">
        <div className="px-3 py-1 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">{resolvedTitle}</h3>
            <div className="flex items-center gap-4">
              <button
                onClick={onClear}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {resolvedClearLabel}
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={resolvedCloseAriaLabel}
              >
                <IoCloseOutline className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className={contentClassName}>
          {content}
        </div>
      </div>
    </motion.div>
  );
};

