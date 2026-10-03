import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { isRtl } from "./init";

/**
 * Hook réactif exposant la direction (ltr/rtl) de la langue courante, pour
 * les composants qui ont besoin d'adapter leur mise en page (icônes,
 * marges, alignements) au-delà du simple attribut `dir` du document.
 */
export function useDirection(): "ltr" | "rtl" {
  const { i18n } = useTranslation();
  const [dir, setDir] = useState<"ltr" | "rtl">(isRtl(i18n.language) ? "rtl" : "ltr");

  useEffect(() => {
    const update = (language: string) => setDir(isRtl(language) ? "rtl" : "ltr");
    update(i18n.language);
    i18n.on("languageChanged", update);
    return () => {
      i18n.off("languageChanged", update);
    };
  }, [i18n]);

  return dir;
}
