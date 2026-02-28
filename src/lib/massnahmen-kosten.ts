/**
 * Kostenschätzung für WP-Optimierungsmaßnahmen.
 * Erfahrungswerte basierend auf Marktpreisen 2024/2025 (Deutschland).
 * Premium-Nutzer können diese Werte später über die DB anpassen.
 */

export interface MassnahmeKosten {
  id: string;
  label: string;
  kostenMin: number;   // € Untergrenze
  kostenMax: number;   // € Obergrenze
  einheit: string;     // z.B. "pauschal", "pro Stück", "pro m²"
  /** Geschätzte JAZ-Verbesserung in Prozent (für Amortisation) */
  effizienzgewinnProzent: number;
  /** Geschätzte jährliche Stromersparnis in kWh (pro 100m² / Standardfall) */
  stromersparnisKwhBasis: number;
  kategorie: string;
}

/**
 * Standard-Kostentabelle. IDs korrespondieren mit Recommendation-Kategorien/Titeln.
 */
export const DEFAULT_MASSNAHMEN_KOSTEN: MassnahmeKosten[] = [
  {
    id: "hydraulischer_abgleich",
    label: "Hydraulischer Abgleich",
    kostenMin: 650,
    kostenMax: 1250,
    einheit: "pauschal",
    effizienzgewinnProzent: 12,
    stromersparnisKwhBasis: 500,
    kategorie: "Maßnahme",
  },
  {
    id: "heizkoerper_tausch",
    label: "Heizkörper gegen WP-Heizkörper tauschen",
    kostenMin: 800,
    kostenMax: 2000,
    einheit: "pro Stück (2-4 Stück typisch)",
    effizienzgewinnProzent: 18,
    stromersparnisKwhBasis: 700,
    kategorie: "Investition",
  },
  {
    id: "vorlauftemperatur_senken",
    label: "Vorlauftemperatur senken",
    kostenMin: 0,
    kostenMax: 150,
    einheit: "pauschal (Fachbetrieb-Einstellung)",
    effizienzgewinnProzent: 10,
    stromersparnisKwhBasis: 400,
    kategorie: "Einstellungen",
  },
  {
    id: "smarte_thermostate",
    label: "Smarte Thermostate nachrüsten",
    kostenMin: 300,
    kostenMax: 800,
    einheit: "für 6-10 Heizkörper",
    effizienzgewinnProzent: 5,
    stromersparnisKwhBasis: 200,
    kategorie: "Investition",
  },
  {
    id: "heizstab_optimierung",
    label: "Heizstab-Einsatz reduzieren / optimieren",
    kostenMin: 0,
    kostenMax: 300,
    einheit: "pauschal (Parameteranpassung)",
    effizienzgewinnProzent: 8,
    stromersparnisKwhBasis: 350,
    kategorie: "Heizstab",
  },
  {
    id: "fassadendaemmung",
    label: "Fassadendämmung (WDVS)",
    kostenMin: 15000,
    kostenMax: 35000,
    einheit: "für 120m² Fassade",
    effizienzgewinnProzent: 25,
    stromersparnisKwhBasis: 1200,
    kategorie: "Gebäude",
  },
  {
    id: "dachdaemmung",
    label: "Dachdämmung / oberste Geschossdecke",
    kostenMin: 5000,
    kostenMax: 15000,
    einheit: "für 80-100m² Dachfläche",
    effizienzgewinnProzent: 15,
    stromersparnisKwhBasis: 700,
    kategorie: "Gebäude",
  },
  {
    id: "fenster_tausch",
    label: "Fenster erneuern (3-fach Verglasung)",
    kostenMin: 8000,
    kostenMax: 20000,
    einheit: "für 8-12 Fenster",
    effizienzgewinnProzent: 12,
    stromersparnisKwhBasis: 500,
    kategorie: "Gebäude",
  },
  {
    id: "kellerdeckendaemmung",
    label: "Kellerdeckendämmung",
    kostenMin: 2000,
    kostenMax: 5000,
    einheit: "für 80-100m² Kellerfläche",
    effizienzgewinnProzent: 8,
    stromersparnisKwhBasis: 350,
    kategorie: "Gebäude",
  },
  {
    id: "pv_anlage",
    label: "PV-Anlage (10 kWp) installieren",
    kostenMin: 12000,
    kostenMax: 18000,
    einheit: "inkl. Montage",
    effizienzgewinnProzent: 0, // Keine JAZ-Verbesserung, aber Kostenersparnis
    stromersparnisKwhBasis: 1500, // Netzstrom-Ersparnis
    kategorie: "PV-Anlage",
  },
  {
    id: "batteriespeicher",
    label: "Batteriespeicher (5-10 kWh)",
    kostenMin: 5000,
    kostenMax: 10000,
    einheit: "inkl. Installation",
    effizienzgewinnProzent: 0,
    stromersparnisKwhBasis: 600,
    kategorie: "PV-Anlage",
  },
  {
    id: "wartung",
    label: "Professionelle Wartung & Filterkontrolle",
    kostenMin: 200,
    kostenMax: 400,
    einheit: "pro Jahr",
    effizienzgewinnProzent: 4,
    stromersparnisKwhBasis: 150,
    kategorie: "Wartung",
  },
  {
    id: "energieberatung",
    label: "Energieberatung / iSFP",
    kostenMin: 300,
    kostenMax: 500,
    einheit: "Eigenanteil nach 80% Förderung",
    effizienzgewinnProzent: 0,
    stromersparnisKwhBasis: 0,
    kategorie: "Fachplaner",
  },
  {
    id: "raumtemperatur_senken",
    label: "Raumtemperatur auf 21°C senken",
    kostenMin: 0,
    kostenMax: 0,
    einheit: "kostenlos",
    effizienzgewinnProzent: 6,
    stromersparnisKwhBasis: 250,
    kategorie: "Verhalten",
  },
  {
    id: "pufferspeicher_pruefen",
    label: "Pufferspeicher-Notwendigkeit prüfen",
    kostenMin: 0,
    kostenMax: 200,
    einheit: "Fachbetrieb-Check",
    effizienzgewinnProzent: 2,
    stromersparnisKwhBasis: 100,
    kategorie: "Einstellungen",
  },
  {
    id: "heizstab_pruefen",
    label: "Heizstab-Betriebsstunden prüfen",
    kostenMin: 0,
    kostenMax: 0,
    einheit: "Eigenleistung",
    effizienzgewinnProzent: 0,
    stromersparnisKwhBasis: 0,
    kategorie: "Diagnose",
  },
  {
    id: "warmwasser_optimierung",
    label: "Warmwasserverbrauch optimieren (Sparbrausen etc.)",
    kostenMin: 50,
    kostenMax: 200,
    einheit: "für 2-3 Sparbrausen",
    effizienzgewinnProzent: 3,
    stromersparnisKwhBasis: 200,
    kategorie: "Warmwasser",
  },
];

/**
 * Ordnet einer Empfehlung die passende Kostenschätzung zu, basierend auf Kategorie und Titelstichworten.
 */
export function matchMassnahmeToRecommendation(
  recCategory: string,
  recTitle: string
): MassnahmeKosten | undefined {
  const title = recTitle.toLowerCase();
  const cat = recCategory.toLowerCase();

  if (cat === "maßnahme" && title.includes("hydraulisch")) return find("hydraulischer_abgleich");
  if (cat === "heizstab" && title.includes("reduzieren")) return find("heizstab_optimierung");
  if (cat === "diagnose" && title.includes("heizstab")) return find("heizstab_pruefen");
  if (cat === "einstellungen" && title.includes("vorlauftemperatur")) return find("vorlauftemperatur_senken");
  if (cat === "einstellungen" && title.includes("pufferspeicher")) return find("pufferspeicher_pruefen");
  if (cat === "investition" && (title.includes("heizkörper") || title.includes("heizflächen"))) return find("heizkoerper_tausch");
  if (cat === "investition" && title.includes("thermostat")) return find("smarte_thermostate");
  if (cat === "verhalten" && title.includes("raumtemperatur")) return find("raumtemperatur_senken");
  if (cat === "warmwasser") return find("warmwasser_optimierung");
  if (cat === "gebäude" || cat === "gebaeude") {
    if (title.includes("fassade") && title.includes("dach") && title.includes("fenster")) {
      // Combined building envelope — return fassade as primary
      return find("fassadendaemmung");
    }
    if (title.includes("fassade")) return find("fassadendaemmung");
    if (title.includes("dach") || title.includes("geschossdecke")) return find("dachdaemmung");
    if (title.includes("fenster")) return find("fenster_tausch");
    if (title.includes("keller")) return find("kellerdeckendaemmung");
    // Generic building envelope recommendation
    return find("fassadendaemmung");
  }
  if (cat === "pv-anlage") {
    if (title.includes("batterie")) return find("batteriespeicher");
    return find("pv_anlage");
  }
  if (cat === "wartung") return find("wartung");
  if (cat === "fachplaner") return find("energieberatung");

  return undefined;
}

function find(id: string): MassnahmeKosten | undefined {
  return DEFAULT_MASSNAHMEN_KOSTEN.find(m => m.id === id);
}

/**
 * Berechnet die Szenario-Ergebnisse für ausgewählte Maßnahmen.
 */
export interface SzenarioErgebnis {
  gesamtkostenMin: number;
  gesamtkostenMax: number;
  gesamtkostenMittel: number;
  stromersparnisJahr: number;      // kWh
  kostenersparnisJahr: number;     // €
  effizienzgewinnGesamt: number;   // % (kumulativ, nicht-linear)
  neueJAZ: number;
  amortisationJahre: number;       // basierend auf Mittelwert der Kosten
  ausgewaehlteMassnahmen: {
    label: string;
    kostenMin: number;
    kostenMax: number;
    einheit: string;
    stromersparnisKwh: number;
    kostenersparnisEuro: number;
  }[];
}

export function berechneSzenario(
  selectedMassnahmen: MassnahmeKosten[],
  strompreis: number, // €/kWh
  aktuellerVerbrauch: number, // kWh/a
  aktuelleJAZ: number,
  flaecheM2: number,
): SzenarioErgebnis {
  // Scale factor based on actual building size vs. reference (120m²)
  const skalierung = Math.max(0.5, Math.min(2.0, flaecheM2 / 120));

  let gesamtMin = 0;
  let gesamtMax = 0;
  let gesamtErsparnis = 0;
  let effizienzGesamt = 0;
  const details: SzenarioErgebnis["ausgewaehlteMassnahmen"] = [];

  for (const m of selectedMassnahmen) {
    const kMin = m.kostenMin;
    const kMax = m.kostenMax;
    const ersparnisKwh = Math.round(m.stromersparnisKwhBasis * skalierung);
    const ersparnisEuro = Math.round(ersparnisKwh * strompreis);

    gesamtMin += kMin;
    gesamtMax += kMax;
    gesamtErsparnis += ersparnisKwh;
    // Diminishing returns for combined efficiency gains
    effizienzGesamt = effizienzGesamt + m.effizienzgewinnProzent * (1 - effizienzGesamt / 100);

    details.push({
      label: m.label,
      kostenMin: kMin,
      kostenMax: kMax,
      einheit: m.einheit,
      stromersparnisKwh: ersparnisKwh,
      kostenersparnisEuro: ersparnisEuro,
    });
  }

  const gesamtMittel = Math.round((gesamtMin + gesamtMax) / 2);
  const kostenersparnisJahr = Math.round(gesamtErsparnis * strompreis);
  const neueJAZ = Math.round((aktuelleJAZ * (1 + effizienzGesamt / 100)) * 100) / 100;
  const amortisation = kostenersparnisJahr > 0
    ? Math.round((gesamtMittel / kostenersparnisJahr) * 10) / 10
    : 0;

  return {
    gesamtkostenMin: gesamtMin,
    gesamtkostenMax: gesamtMax,
    gesamtkostenMittel: gesamtMittel,
    stromersparnisJahr: gesamtErsparnis,
    kostenersparnisJahr,
    effizienzgewinnGesamt: Math.round(effizienzGesamt * 10) / 10,
    neueJAZ,
    amortisationJahre: amortisation,
    ausgewaehlteMassnahmen: details,
  };
}
