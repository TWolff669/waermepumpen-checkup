/**
 * Fördermittel für Optimierungsmaßnahmen bestehender WP-Anlagen.
 * Stand: Anfang 2026. Angaben ohne Gewähr.
 */

import type { Recommendation } from "./simulation";

export interface Foerdermittel {
  programm: string;
  massnahme: string;
  foerderquote: number; // %
  maxBetrag?: number; // €
  isfpBonus: boolean; // +5% bei iSFP
  hinweis: string;
  link: string;
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
