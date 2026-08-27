/**
 * ES and PT subtopic names. The source JSON has English only for all 28 rows, and
 * `Subtopics.name` is `required`, so the ES/PT admin tabs cannot be saved without these.
 *
 * `0` "ACU" is an undefined project acronym — its only other trace in the codebase is the
 * `ACU_KnowledgeDB` ArcGIS service in `constants/datasets.ts` — so it is left untranslated
 * in all three locales. `33` "IDB" becomes "BID" (Banco Interamericano de Desarrollo /
 * de Desenvolvimento), the standard acronym in both languages.
 *
 * Editors can change any of these in the CMS.
 */
export const SUBTOPIC_NAMES: Record<number, { es: string; pt: string }> = {
  0: { es: "ACU", pt: "ACU" },
  1: { es: "Geografía Física", pt: "Geografia Física" },
  2: { es: "Áreas Protegidas y de Conservación", pt: "Áreas Protegidas e de Conservação" },
  3: { es: "Cobertura del Suelo", pt: "Cobertura do Solo" },
  4: { es: "Dinámica Forestal y Carbono", pt: "Dinâmica Florestal e Carbono" },
  5: { es: "Ecosistemas Naturales", pt: "Ecossistemas Naturais" },
  6: { es: "Ecosistemas Modificados", pt: "Ecossistemas Modificados" },
  7: { es: "Biodiversidad y Conservación", pt: "Biodiversidade e Conservação" },
  8: { es: "Patrones Climáticos", pt: "Padrões Climáticos" },
  10: { es: "Demografía", pt: "Demografia" },
  11: { es: "Desarrollo Social", pt: "Desenvolvimento Social" },
  12: { es: "Indígena y Cultural", pt: "Indígena e Cultural" },
  13: { es: "Panorama Económico", pt: "Panorama Econômico" },
  14: { es: "Industrias Extractivas", pt: "Indústrias Extrativas" },
  15: {
    es: "Agricultura - Cultivos de Seguridad Alimentaria",
    pt: "Agricultura - Culturas de Segurança Alimentar",
  },
  16: {
    es: "Agricultura - Cultivos de Exportación",
    pt: "Agricultura - Culturas de Exportação",
  },
  18: { es: "Bioeconomía", pt: "Bioeconomia" },
  19: { es: "Turismo y Hostelería", pt: "Turismo e Hotelaria" },
  21: { es: "Salud", pt: "Saúde" },
  22: { es: "Educación", pt: "Educação" },
  23: { es: "Transporte", pt: "Transporte" },
  24: { es: "Servicios Públicos", pt: "Serviços Públicos" },
  25: { es: "Comunicación", pt: "Comunicação" },
  26: { es: "Infraestructura de Seguridad", pt: "Infraestrutura de Segurança" },
  27: { es: "Desarrollo Urbano", pt: "Desenvolvimento Urbano" },
  28: { es: "Riesgos Ambientales", pt: "Riscos Ambientais" },
  29: { es: "Riesgos Sociales y de Seguridad", pt: "Riscos Sociais e de Segurança" },
  33: { es: "BID", pt: "BID" },
};
