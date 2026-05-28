/**
 * Partner / supporter logos for the auth marquee.
 *
 * To use a logo: add the image under `src/assets/partners/` and set `logo`
 * to a static import, e.g. `import whoLogo from "../assets/partners/who.svg"`.
 * Leave `logo` null to show the text fallback until assets are ready.
 */

import omsLogo from "../assets/partners/oms.svg";
import unicefLogo from "../assets/partners/unicef.svg";

export const PARTNERS = [
  {
    id: "etat-congolais",
    name: "État congolais",
    logo: null,
    logoAlt: "État congolais",
  },
  {
    id: "ministere-sante-rdc",
    name: "Ministère de la Santé (RDC)",
    logo: null,
    logoAlt: "Ministère de la Santé Publique, Hygiène et Prévoyance Sociale de la RDC",
  },
  {
    id: "oms",
    name: "OMS",
    logo: omsLogo,
    logoAlt: "Organisation mondiale de la Santé",
  },
  {
    id: "unicef",
    name: "UNICEF",
    logo: unicefLogo,
    logoAlt: "UNICEF",
  },
  {
    id: "pev-rdc",
    name: "PEV RDC",
    logo: null,
    logoAlt: "Programme Élargi de Vaccination de la RDC",
  },
];
