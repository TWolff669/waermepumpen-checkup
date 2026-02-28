/**
 * Fördermittel für Optimierungsmaßnahmen bestehender WP-Anlagen.
 * Stand: Anfang 2026. Angaben ohne Gewähr.
 * Erweitert um regionale Förderprogramme auf PLZ-Basis.
 */

import type { Recommendation } from "./simulation";
import type { MassnahmeKosten } from "./massnahmen-kosten";

export interface Foerdermittel {
  programm: string;
  massnahme: string;
  foerderquote: number; // %
  maxBetrag?: number; // €
  isfpBonus: boolean; // +5% bei iSFP
  hinweis: string;
  link: string;
  regional?: boolean;
}

export function getRelevanteFoerderung(recommendations: Recommendation[]): Foerdermittel[] {
  const foerderungen: Foerdermittel[] = [];
  const added = new Set<string>();

  const recTexts = recommendations.map(r =>
    `${r.title} ${r.impact} ${r.context || ""} ${(r.prerequisites || []).join(" ")}`
  ).join(" ").toLowerCase();

  // Hydraulischer Abgleich
  if (recTexts.includes("hydraulisch") && !added.has("ha")) {
    added.add("ha");
    foerderungen.push({
      programm: "BEG Einzelmaßnahmen",
      massnahme: "Hydraulischer Abgleich / Heizungsoptimierung",
      foerderquote: 15,
      maxBetrag: 60000,
      isfpBonus: false,
      hinweis: "Förderung über BAFA. Antrag vor Maßnahmenbeginn stellen.",
      link: "https://www.bafa.de/DE/Energie/Effiziente_Gebaeude/Sanierung_Wohngebaeude/sanierung_wohngebaeude_node.html",
    });
  }

  // Heizkörper / Heizflächen
  if ((recTexts.includes("heizkörper") || recTexts.includes("heizflächen") || recTexts.includes("wp-heizkörper")) && !added.has("hk")) {
    added.add("hk");
    foerderungen.push({
      programm: "BEG Einzelmaßnahmen",
      massnahme: "Heizungsoptimierung / Heizkörpertausch",
      foerderquote: 15,
      maxBetrag: 60000,
      isfpBonus: false,
      hinweis: "Heizkörpertausch ist als Heizungsoptimierung förderfähig.",
      link: "https://www.bafa.de/DE/Energie/Effiziente_Gebaeude/Sanierung_Wohngebaeude/sanierung_wohngebaeude_node.html",
    });
  }

  // Gebäudehülle: Fassade, Dach, Fenster, Kellerdecke
  if ((recTexts.includes("fassade") || recTexts.includes("dach") || recTexts.includes("fenster") || recTexts.includes("kellerdecke") || recTexts.includes("dämmung")) && !added.has("hulle")) {
    added.add("hulle");
    foerderungen.push({
      programm: "BEG Einzelmaßnahmen",
      massnahme: "Gebäudehülle (Dämmung, Fenster)",
      foerderquote: 15,
      maxBetrag: 60000,
      isfpBonus: true,
      hinweis: "Mit individuellem Sanierungsfahrplan (iSFP) zusätzlich +5% Förderung möglich.",
      link: "https://www.bafa.de/DE/Energie/Effiziente_Gebaeude/Sanierung_Wohngebaeude/sanierung_wohngebaeude_node.html",
    });
  }

  // Energieberatung
  if ((recTexts.includes("energieberater") || recTexts.includes("energieberatung") || recTexts.includes("fachplaner")) && !added.has("eb")) {
    added.add("eb");
    foerderungen.push({
      programm: "BAFA Energieberatung Wohngebäude",
      massnahme: "Energieberatung / individueller Sanierungsfahrplan",
      foerderquote: 80,
      maxBetrag: 1300,
      isfpBonus: false,
      hinweis: "Bis zu 80% Zuschuss (max. 1.300€ für EFH). Beratung durch zugelassenen Energieberater.",
      link: "https://www.bafa.de/DE/Energie/Energieberatung/Energieberatung_Wohngebaeude/energieberatung_wohngebaeude_node.html",
    });
  }

  return foerderungen;
}

/**
 * Regionale Förderprogramme auf Bundesland-Basis (PLZ-Mapping).
 * Vereinfachte Zuordnung über PLZ-Bereiche → Bundesland.
 */
interface RegionalesFoerderprogramm {
  bundesland: string;
  programm: string;
  massnahme: string;
  foerderquote: number;
  maxBetrag?: number;
  hinweis: string;
  link: string;
  /** Welche Maßnahmen-IDs passen? */
  passendFuer: string[];
}

const REGIONALE_PROGRAMME: RegionalesFoerderprogramm[] = [
  // Bayern
  {
    bundesland: "Bayern",
    programm: "BayernLabo – Bayerisches Wohnungsbauprogramm",
    massnahme: "Energetische Sanierung (Gebäudehülle, Heizung)",
    foerderquote: 10,
    maxBetrag: 20000,
    hinweis: "Zinsgünstige Darlehen für energetische Sanierung von Ein-/Zweifamilienhäusern in Bayern.",
    link: "https://bayernlabo.de/foerderprogramme/",
    passendFuer: ["fassadendaemmung", "dachdaemmung", "fenster_tausch", "kellerdeckendaemmung"],
  },
  // NRW
  {
    bundesland: "Nordrhein-Westfalen",
    programm: "progres.nrw – Klimaschutztechnik",
    massnahme: "PV-Anlage mit Batteriespeicher",
    foerderquote: 0,
    maxBetrag: 1500,
    hinweis: "Zuschuss für Batteriespeicher in Verbindung mit PV-Neuinstallation. Förderhöhe abhängig von Speichergröße.",
    link: "https://www.progres.nrw/",
    passendFuer: ["batteriespeicher", "pv_anlage"],
  },
  // Baden-Württemberg
  {
    bundesland: "Baden-Württemberg",
    programm: "L-Bank – Energieeffizienzfinanzierung",
    massnahme: "Energetische Gebäudesanierung",
    foerderquote: 0,
    maxBetrag: 100000,
    hinweis: "Zinsgünstige Darlehen für Sanierungsmaßnahmen. Kombinierbar mit BEG-Zuschüssen.",
    link: "https://www.l-bank.de/",
    passendFuer: ["fassadendaemmung", "dachdaemmung", "fenster_tausch", "kellerdeckendaemmung", "heizkoerper_tausch"],
  },
  // Hessen
  {
    bundesland: "Hessen",
    programm: "WIBank – Hessisches Energiegesetz",
    massnahme: "Energieberatung & Sanierung",
    foerderquote: 0,
    maxBetrag: 5000,
    hinweis: "Ergänzende Landesförderung für Energieberatung und Sanierungsmaßnahmen.",
    link: "https://www.wibank.de/",
    passendFuer: ["energieberatung", "fassadendaemmung", "dachdaemmung"],
  },
  // Niedersachsen
  {
    bundesland: "Niedersachsen",
    programm: "NBank – Energetische Sanierung",
    massnahme: "Gebäudehülle & Anlagentechnik",
    foerderquote: 0,
    maxBetrag: 15000,
    hinweis: "Zinsgünstige Darlehen für Sanierungsmaßnahmen in Niedersachsen.",
    link: "https://www.nbank.de/",
    passendFuer: ["fassadendaemmung", "dachdaemmung", "fenster_tausch", "hydraulischer_abgleich"],
  },
  // Sachsen
  {
    bundesland: "Sachsen",
    programm: "SAB – Energetische Sanierung",
    massnahme: "Gebäudehülle & Wärmeversorgung",
    foerderquote: 0,
    maxBetrag: 10000,
    hinweis: "Zinsvergünstigte Darlehen für Wohngebäudesanierung in Sachsen.",
    link: "https://www.sab.sachsen.de/",
    passendFuer: ["fassadendaemmung", "dachdaemmung", "fenster_tausch", "kellerdeckendaemmung"],
  },
  // Berlin
  {
    bundesland: "Berlin",
    programm: "IBB – Berliner Programm für Nachhaltige Entwicklung",
    massnahme: "Energetische Gebäudesanierung",
    foerderquote: 0,
    maxBetrag: 15000,
    hinweis: "Zuschüsse und Darlehen für energetische Sanierung in Berlin.",
    link: "https://www.ibb.de/",
    passendFuer: ["fassadendaemmung", "dachdaemmung", "fenster_tausch", "kellerdeckendaemmung"],
  },
  // Hamburg
  {
    bundesland: "Hamburg",
    programm: "IFB Hamburg – Modernisierungsförderung",
    massnahme: "Energetische Modernisierung",
    foerderquote: 0,
    maxBetrag: 20000,
    hinweis: "Zuschüsse für umfassende energetische Modernisierung in Hamburg.",
    link: "https://www.ifbhh.de/",
    passendFuer: ["fassadendaemmung", "dachdaemmung", "fenster_tausch", "kellerdeckendaemmung", "heizkoerper_tausch"],
  },
  // Schleswig-Holstein
  {
    bundesland: "Schleswig-Holstein",
    programm: "IB.SH – Energetische Sanierung",
    massnahme: "Wohngebäudesanierung",
    foerderquote: 0,
    maxBetrag: 10000,
    hinweis: "Ergänzungsdarlehen für energetische Sanierung.",
    link: "https://www.ib-sh.de/",
    passendFuer: ["fassadendaemmung", "dachdaemmung", "fenster_tausch"],
  },
  // Thüringen
  {
    bundesland: "Thüringen",
    programm: "TAB – Thüringer Sanierungsbonus",
    massnahme: "Gebäudehülle & Heizungsoptimierung",
    foerderquote: 10,
    maxBetrag: 8000,
    hinweis: "Zusätzlicher Landesbonus für Sanierungsmaßnahmen.",
    link: "https://www.aufbaubank.de/",
    passendFuer: ["fassadendaemmung", "dachdaemmung", "fenster_tausch", "hydraulischer_abgleich"],
  },
];

/**
 * PLZ → Bundesland (vereinfachte Zuordnung über PLZ-Bereiche)
 */
function getBundeslandFromPLZ(plz: string): string {
  const prefix = parseInt(plz.substring(0, 2), 10);
  if (isNaN(prefix)) return "";

  // Grobe Zuordnung (PLZ-Bereiche nicht 100% trennscharf)
  if (prefix >= 1 && prefix <= 9) return plzToBundesland1(prefix, plz);
  if (prefix >= 10 && prefix <= 19) return "Berlin";
  if (prefix >= 20 && prefix <= 29) return plzToBundesland2(prefix);
  if (prefix >= 30 && prefix <= 39) return "Niedersachsen";
  if (prefix >= 40 && prefix <= 51) return "Nordrhein-Westfalen";
  if (prefix >= 52 && prefix <= 53) return "Nordrhein-Westfalen";
  if (prefix >= 54 && prefix <= 56) return "Rheinland-Pfalz";
  if (prefix >= 57 && prefix <= 59) return "Nordrhein-Westfalen";
  if (prefix >= 60 && prefix <= 65) return "Hessen";
  if (prefix >= 66 && prefix <= 66) return "Saarland";
  if (prefix >= 67 && prefix <= 69) return "Baden-Württemberg";
  if (prefix >= 70 && prefix <= 79) return "Baden-Württemberg";
  if (prefix >= 80 && prefix <= 87) return "Bayern";
  if (prefix >= 88 && prefix <= 89) return "Baden-Württemberg";
  if (prefix >= 90 && prefix <= 97) return "Bayern";
  if (prefix >= 98 && prefix <= 99) return "Thüringen";
  return "";
}

function plzToBundesland1(prefix: number, plz: string): string {
  const p3 = parseInt(plz.substring(0, 3), 10);
  if (prefix <= 6) {
    if (p3 >= 10 && p3 <= 19) return "Sachsen";
    if (p3 >= 20 && p3 <= 29) return "Brandenburg";
    return "Sachsen";
  }
  if (prefix <= 9) return "Sachsen";
  return "Sachsen";
}

function plzToBundesland2(prefix: number): string {
  if (prefix >= 20 && prefix <= 22) return "Hamburg";
  if (prefix >= 23 && prefix <= 25) return "Schleswig-Holstein";
  if (prefix >= 26 && prefix <= 27) return "Niedersachsen";
  if (prefix >= 28 && prefix <= 28) return "Bremen";
  if (prefix >= 29 && prefix <= 29) return "Niedersachsen";
  return "Hamburg";
}

/**
 * Ermittelt regionale Förderprogramme anhand der PLZ und der ausgewählten Maßnahmen.
 */
export function getRegionaleFoerderung(
  plz: string,
  selectedMassnahmenIds: string[]
): Foerdermittel[] {
  const bundesland = getBundeslandFromPLZ(plz);
  if (!bundesland) return [];

  const passende = REGIONALE_PROGRAMME.filter(p =>
    p.bundesland === bundesland &&
    p.passendFuer.some(id => selectedMassnahmenIds.includes(id))
  );

  return passende.map(p => ({
    programm: p.programm,
    massnahme: p.massnahme,
    foerderquote: p.foerderquote,
    maxBetrag: p.maxBetrag,
    isfpBonus: false,
    hinweis: p.hinweis,
    link: p.link,
    regional: true,
  }));
}

/**
 * Ermittelt alle Förderungen (Bund + regional) für eine Maßnahmenauswahl.
 */
export function getAlleFoerderungen(
  recommendations: Recommendation[],
  plz: string,
  selectedMassnahmenIds: string[]
): { bundesFoerderungen: Foerdermittel[]; regionaleFoerderungen: Foerdermittel[] } {
  const bundesFoerderungen = getRelevanteFoerderung(recommendations);
  const regionaleFoerderungen = getRegionaleFoerderung(plz, selectedMassnahmenIds);
  return { bundesFoerderungen, regionaleFoerderungen };
}
