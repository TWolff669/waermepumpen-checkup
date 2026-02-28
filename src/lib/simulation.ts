/**
 * Realistic heat pump simulation engine for German residential buildings.
 *
 * Based on simplified VDI 4650 / DIN V 18599 methodology:
 * - Building heat demand from specific heat demand × area × climate factor
 * - Hot water demand from occupancy
 * - COP/JAZ estimation from flow temperature and source temperature
 * - Electricity consumption = heat demand / JAZ
 */

import { getClimateData } from "./climate-data";

// ─── Building parameters ───────────────────────────────────────────

/** Base specific heat demand (kWh/m²·a) by construction year */
function getBaseDemandByBaujahr(baujahr: string): number {
  switch (baujahr) {
    case "vor1960":    return 180; // Ungedämmt, einschalig
    case "1960-1978":  return 150; // Erste Dämmansätze
    case "1979-1995":  return 120; // 1. WSchV
    case "1996-2002":  return 90;  // 2./3. WSchV
    case "2003-2015":  return 65;  // EnEV
    case "ab2016":     return 40;  // EnEV 2016 / GEG
    default:           return 130; // Fallback Altbau
  }
}

/** Specific heat demand (kWh/m²·a) by building type, construction year and renovation state */
function getSpecificHeatDemand(
  gebaeudetyp: string,
  renovierungen: string[],
  baujahr: string
): number {
  if (gebaeudetyp === "neubau") {
    // Neubau: Baujahr determines standard
    if (baujahr === "ab2016") return 35;
    if (baujahr === "2003-2015") return 50;
    return 40; // KfW55 / GEG default
  }

  // Altbau: base from construction year
  let demand = getBaseDemandByBaujahr(baujahr);

  // Each renovation measure reduces demand
  if (renovierungen.includes("dach")) demand -= 20;
  if (renovierungen.includes("fenster")) demand -= 18;
  if (renovierungen.includes("fassade")) demand -= 35;
  if (renovierungen.includes("kellerdecke")) demand -= 12;

  // Floor: can't go below well-renovated level for that era
  const minDemand = gebaeudetyp === "neubau" ? 35 : 45;
  return Math.max(demand, minDemand);
}

/** Climate correction factor: ratio of local HGT to reference (3400 Kd) */
function getClimateFactor(heizgradtage: number): number {
  return heizgradtage / 3400;
}

// ─── Hot water demand ──────────────────────────────────────────────

/**
 * Annual hot water energy demand in kWh.
 * Based on VDI 2067: ~500 kWh per person per year for standard use.
 * Adjusted for shower/bath frequency if advanced data available.
 */
function getHotWaterDemand(
  personen: number,
  duschenProTag?: number
): number {
  const basePerPerson = 500; // kWh/person/year
  let demand = personen * basePerPerson;

  if (duschenProTag !== undefined) {
    // Reference: 2 showers/day for average household
    const avgDaily = personen * 0.7; // ~0.7 showers per person per day average
    const factor = duschenProTag / Math.max(avgDaily, 1);
    demand *= Math.max(0.6, Math.min(factor, 2.0));
  }

  return demand;
}

// ─── COP / JAZ estimation ──────────────────────────────────────────

/**
 * Estimate seasonal COP (Jahresarbeitszahl, JAZ) for a Luft-Wasser WP.
 *
 * Simplified Carnot-based model with real-world efficiency factor:
 *   COP_carnot = T_sink / (T_sink - T_source)
 *   COP_real = η_carnot × COP_carnot
 *
 * η_carnot typically 0.40-0.50 for modern air-source heat pumps.
 */
function estimateJAZ(params: {
  vorlauftemperatur: number;    // °C flow temperature
  avgOutdoorTemp: number;       // °C average annual outdoor temp
  heizungstyp: string;          // flaechenheizung | heizkoerper
  wpHeizkoerper?: string;       // ja | nein
  hydraulischerAbgleich: string; // ja | nein | unbekannt
  pufferspeicher: string;       // ja | nein
}): number {
  const {
    vorlauftemperatur,
    avgOutdoorTemp,
    heizungstyp,
    wpHeizkoerper,
    hydraulischerAbgleich,
    pufferspeicher,
  } = params;

  // Source temp = average outdoor + 2K (air intake slightly above ambient)
  const T_source_K = avgOutdoorTemp + 2 + 273.15;
  const T_sink_K = vorlauftemperatur + 273.15;

  const COP_carnot = T_sink_K / (T_sink_K - T_source_K);

  // Real-world Carnot efficiency factor
  let eta = 0.45; // Modern air-source WP baseline

  // Adjustments
  if (heizungstyp === "flaechenheizung") eta += 0.02; // Better heat transfer
  if (wpHeizkoerper === "ja") eta += 0.015;
  if (hydraulischerAbgleich === "ja") eta += 0.02;
  if (hydraulischerAbgleich === "nein") eta -= 0.02;
  if (pufferspeicher === "ja") eta -= 0.01; // Slight loss from storage

  const JAZ = eta * COP_carnot;

  // Clamp to realistic range for air-source WP
  return Math.max(2.0, Math.min(JAZ, 5.5));
}

/**
 * JAZ for hot water production (typically lower due to higher temps).
 * Hot water needs ~50-55°C, reducing COP significantly.
 */
function estimateJAZWarmwasser(avgOutdoorTemp: number): number {
  const T_source_K = avgOutdoorTemp + 2 + 273.15;
  const T_sink_K = 52 + 273.15; // ~52°C for hot water
  const COP_carnot = T_sink_K / (T_sink_K - T_source_K);
  return Math.max(1.8, Math.min(0.40 * COP_carnot, 3.5));
}

// ─── Room temperature adjustment ──────────────────────────────────

/**
 * Each degree above 20°C increases heating demand by ~6%.
 * Each degree below 20°C reduces it by ~6%.
 */
function getRoomTempFactor(raumtemperatur: number): number {
  return 1 + (raumtemperatur - 20) * 0.06;
}

/**
 * Automatic room controllers reduce demand by ~5% through
 * better zone control and setback.
 */
function getControllerFactor(automatischeRaumregler: string): number {
  return automatischeRaumregler === "ja" ? 0.95 : 1.0;
}

// ─── Flow temperature estimation ──────────────────────────────────

/** Estimate typical flow temperature when not provided */
function estimateVorlauftemperatur(
  heizungstyp: string,
  heizkoerperZustand: string,
  wpHeizkoerper?: string
): number {
  if (heizungstyp === "flaechenheizung") return 35;
  if (wpHeizkoerper === "ja") return 42;
  if (heizkoerperZustand === "saniert") return 45;
  return 55; // Bestandsheizkörper
}

// ─── Monthly heating degree day distribution ──────────────────────
// Fraction of annual HGT per month (Germany average, DWD data)
// Used to weight partial-year consumption for annualization.
const MONTHLY_HGT_FRACTION = [
  0.17,  // Jan
  0.14,  // Feb
  0.11,  // Mar
  0.07,  // Apr
  0.02,  // May
  0.00,  // Jun
  0.00,  // Jul
  0.00,  // Aug
  0.02,  // Sep
  0.08,  // Oct
  0.13,  // Nov
  0.16,  // Dec
];  // sum ≈ 0.90 (remaining 0.10 is base hot water load)

/**
 * Annualize partial-year consumption using heating degree day weighting.
 * If dates cover a full year, returns the raw value.
 * For partial periods, it calculates what fraction of annual heating load
 * falls within the given period and extrapolates accordingly.
 */
function annualizeConsumption(
  consumption: number,
  von?: string,
  bis?: string
): { annualized: number; days: number; isPartial: boolean } {
  if (!von || !bis) return { annualized: consumption, days: 365, isPartial: false };

  const startDate = new Date(von);
  const endDate = new Date(bis);
  const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) return { annualized: consumption, days: 0, isPartial: false };
  if (days >= 350) return { annualized: consumption, days, isPartial: false };

  // Calculate HGT fraction for the covered period
  // Walk through each day and accumulate the monthly HGT fraction
  let coveredFraction = 0;
  const current = new Date(startDate);
  while (current < endDate) {
    const month = current.getMonth();
    // Each day in a month contributes its share of that month's HGT
    const daysInMonth = new Date(current.getFullYear(), month + 1, 0).getDate();
    // HGT fraction + base load fraction (hot water is ~10% spread evenly)
    const dailyFraction = (MONTHLY_HGT_FRACTION[month] + 0.10 / 12) / daysInMonth;
    coveredFraction += dailyFraction;
    current.setDate(current.getDate() + 1);
  }

  // Prevent division by very small numbers
  coveredFraction = Math.max(coveredFraction, 0.05);

  const annualized = Math.round(consumption / coveredFraction);
  return { annualized, days, isPartial: true };
}

// ─── Main simulation ──────────────────────────────────────────────

export interface SimulationInput {
  postleitzahl: string;
  beheizteFlaeche: string;
  gebaeudetyp: string;
  baujahr: string;
  renovierungen: string[];
  wpLeistung: string;
  personenAnzahl: string;
  pufferspeicher: string;
  heizungstyp: string;
  heizkoerperZustand: string;
  hydraulischerAbgleich: string;
  gesamtverbrauch: string;
  gesamtproduktion: string;
  abrechnungVorhanden: string;
  abrechnungVon?: string;
  abrechnungBis?: string;
  // Advanced fields (optional)
  vorlauftemperatur?: string;
  wpHeizkoerper?: string;
  duschenProTag?: string;
  raumtemperatur?: string;
  automatischeRaumregler?: string;
  isAdvanced?: boolean;
}

export interface SimulationResult {
  /** Efficiency score 0-100 */
  score: number;
  /** Deviation from optimal in % */
  deviation: number;
  /** Simulated optimal electricity consumption kWh/year */
  simulatedConsumption: number;
  /** User's actual consumption kWh/year (or estimated) */
  actualConsumption: number;
  /** Whether advanced data was used */
  isAdvanced: boolean;
  /** Estimated JAZ (seasonal performance factor) */
  jaz: number;
  /** Estimated JAZ for hot water */
  jazWarmwasser: number;
  /** Total heat demand kWh/year */
  heatingDemand: number;
  /** Hot water demand kWh/year */
  hotWaterDemand: number;
  /** Specific heat demand kWh/m²·a */
  specificHeatDemand: number;
  /** Climate region name */
  climateRegion: string;
  /** Flow temperature used °C */
  vorlauftemperatur: number;
  /** Whether consumption was annualized from partial period */
  isPartialPeriod: boolean;
  /** Number of days in the measurement period */
  measurementDays: number;
  /** Personalized recommendations */
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: string;
  title: string;
  impact: string;
  priority: "high" | "medium" | "low";
  /** Optional prerequisite steps that must happen first */
  prerequisites?: string[];
  /** Optional follow-up context */
  context?: string;
}

export function runSimulation(input: SimulationInput): SimulationResult {
  // ── Parse inputs ──
  const flaeche = Math.max(Number(input.beheizteFlaeche) || 120, 20);
  const personen = Math.max(Number(input.personenAnzahl) || 3, 1);
  const isAdvanced = Boolean(input.isAdvanced);

  // ── Climate data ──
  const climate = getClimateData(input.postleitzahl || "10115");
  const climateFactor = getClimateFactor(climate.heizgradtage);

  // ── Building heat demand ──
  const specificDemand = getSpecificHeatDemand(
    input.gebaeudetyp || "altbau",
    input.renovierungen || [],
    input.baujahr || ""
  );
  let heatingDemand = specificDemand * flaeche * climateFactor;

  // ── Room temperature adjustment (advanced) ──
  const raumtemp = isAdvanced ? Number(input.raumtemperatur) || 21 : 21;
  heatingDemand *= getRoomTempFactor(raumtemp);

  // ── Controller adjustment (advanced) ──
  heatingDemand *= getControllerFactor(input.automatischeRaumregler || "");

  // ── Hot water demand ──
  const duschenProTag = isAdvanced ? Number(input.duschenProTag) || undefined : undefined;
  const hotWaterDemand = getHotWaterDemand(personen, duschenProTag);

  // ── Flow temperature ──
  let vorlauftemp: number;
  if (isAdvanced && input.vorlauftemperatur) {
    vorlauftemp = Number(input.vorlauftemperatur);
  } else {
    vorlauftemp = estimateVorlauftemperatur(
      input.heizungstyp || "flaechenheizung",
      input.heizkoerperZustand || "",
      input.wpHeizkoerper
    );
  }

  // ── JAZ calculation ──
  const jaz = estimateJAZ({
    vorlauftemperatur: vorlauftemp,
    avgOutdoorTemp: climate.avgTemp,
    heizungstyp: input.heizungstyp || "flaechenheizung",
    wpHeizkoerper: input.wpHeizkoerper,
    hydraulischerAbgleich: input.hydraulischerAbgleich || "unbekannt",
    pufferspeicher: input.pufferspeicher || "nein",
  });

  const jazWW = estimateJAZWarmwasser(climate.avgTemp);

  // ── Electricity consumption ──
  const stromHeizung = heatingDemand / jaz;
  const stromWarmwasser = hotWaterDemand / jazWW;
  const simulatedConsumption = Math.round(stromHeizung + stromWarmwasser);

  // ── Comparison with actual (with annualization) ──
  const hasActual = input.abrechnungVorhanden === "ja" && Number(input.gesamtverbrauch) > 0;
  let actualConsumption: number;
  let isPartialPeriod = false;
  let measurementDays = 365;

  if (hasActual) {
    const { annualized, days, isPartial } = annualizeConsumption(
      Number(input.gesamtverbrauch),
      input.abrechnungVon,
      input.abrechnungBis
    );
    actualConsumption = annualized;
    isPartialPeriod = isPartial;
    measurementDays = days;
  } else {
    // No actual consumption data: no comparison possible
    actualConsumption = simulatedConsumption;
  }

  let deviation: number;
  let score: number;

  if (hasActual) {
    deviation = Math.round(
      ((actualConsumption - simulatedConsumption) / simulatedConsumption) * 100
    );
    score = Math.max(0, Math.min(100, 100 - Math.abs(deviation) * 1.5));
  } else {
    deviation = 0;
    score = -1; // Marker: no comparison possible
  }

  // ── Recommendations ──
  const recommendations = generateRecommendations(input, {
    vorlauftemp,
    jaz,
    deviation,
    raumtemp,
    isAdvanced,
    duschenProTag,
    specificDemand,
  });

  return {
    score,
    deviation,
    simulatedConsumption,
    actualConsumption,
    isAdvanced,
    jaz: Math.round(jaz * 100) / 100,
    jazWarmwasser: Math.round(jazWW * 100) / 100,
    heatingDemand: Math.round(heatingDemand),
    hotWaterDemand: Math.round(hotWaterDemand),
    specificHeatDemand: Math.round(specificDemand),
    climateRegion: climate.region,
    vorlauftemperatur: vorlauftemp,
    isPartialPeriod,
    measurementDays,
    recommendations,
  };
}

// ─── Recommendation engine ─────────────────────────────────────────

function generateRecommendations(
  input: SimulationInput,
  params: {
    vorlauftemp: number;
    jaz: number;
    deviation: number;
    raumtemp: number;
    isAdvanced: boolean;
    duschenProTag?: number;
    specificDemand: number;
  }
): Recommendation[] {
  const recs: Recommendation[] = [];

  const heizungstyp = input.heizungstyp || "flaechenheizung";
  const heizkoerperZustand = input.heizkoerperZustand || "";
  const hatFlaechenheizung = heizungstyp === "flaechenheizung";
  const hatBestandsHK = heizungstyp === "heizkoerper" && heizkoerperZustand === "uebernommen";
  const hatSanierteHK = heizungstyp === "heizkoerper" && heizkoerperZustand === "saniert";
  const hatWPHeizkoerper = input.wpHeizkoerper === "ja";
  const renovierungen = input.renovierungen || [];

  // ─── Vorlauftemperatur ───────────────────────────────────────────
  // Context-aware: you can't just lower VL temp if radiators can't handle it.
  if (params.vorlauftemp > 45) {
    if (hatFlaechenheizung) {
      // Flächenheizung can easily handle low VL temps
      recs.push({
        category: "Einstellungen",
        title: `Vorlauftemperatur von ${params.vorlauftemp}°C auf 35°C senken`,
        impact: `Bei Flächenheizung sind 35°C ausreichend. Geschätzte JAZ-Verbesserung um ca. ${Math.round((params.vorlauftemp - 35) * 2.5)}%.`,
        priority: "high",
        context: "Flächenheizungen (Fußboden/Wand) arbeiten bereits bei niedrigen Temperaturen effizient. Eine Absenkung ist meist ohne bauliche Maßnahmen möglich.",
      });
    } else if (hatWPHeizkoerper || hatSanierteHK) {
      // WP-HK or new radiators can handle ~42°C
      const targetTemp = hatWPHeizkoerper ? 42 : 45;
      recs.push({
        category: "Einstellungen",
        title: `Vorlauftemperatur von ${params.vorlauftemp}°C auf ${targetTemp}°C senken`,
        impact: `${hatWPHeizkoerper ? "WP-Heizkörper" : "Sanierte Heizkörper"} sind für niedrigere Vorlauftemperaturen ausgelegt. Ca. ${Math.round((params.vorlauftemp - targetTemp) * 2.5)}% Einsparung.`,
        priority: "high",
        context: hatWPHeizkoerper
          ? "WP-Heizkörper haben große Übertragungsflächen und arbeiten effizient bei 42°C."
          : "Prüfen Sie mit Ihrem Installateur, ob die Heizkörper bei der Sanierung korrekt dimensioniert wurden.",
      });
    } else if (hatBestandsHK) {
      // OLD radiators: can't just lower temp — need a plan
      const targetRealistic = Math.max(params.vorlauftemp - 5, 50);
      if (params.vorlauftemp > 50) {
        recs.push({
          category: "Einstellungen",
          title: `Vorlauftemperatur schrittweise von ${params.vorlauftemp}°C auf ${targetRealistic}°C testen`,
          impact: `Bereits ${params.vorlauftemp - targetRealistic}°C weniger bringen ca. ${Math.round((params.vorlauftemp - targetRealistic) * 2.5)}% Einsparung.`,
          priority: "medium",
          context: "Senken Sie die Vorlauftemperatur in 2°C-Schritten ab und prüfen Sie jeweils über einige Tage, ob alle Räume noch warm werden. Nicht pauschal auf 42°C senken — Bestandsheizkörper sind dafür in der Regel nicht ausgelegt.",
          prerequisites: [
            "Heizkurve an der WP-Regelung anpassen (nicht nur Raumthermostat)",
            "An kalten Tagen prüfen, ob Räume noch ausreichend warm werden",
          ],
        });
      }

      // Suggest upgrading radiators as the real solution
      recs.push({
        category: "Investition",
        title: "Heizflächen vergrößern oder auf WP-Heizkörper umrüsten",
        impact: `Ermöglicht Absenkung der Vorlauftemperatur auf 42°C und steigert die JAZ um bis zu ${Math.round((params.vorlauftemp - 42) * 2.5)}%.`,
        priority: "high",
        context: "Bestandsheizkörper wurden für 55-70°C Vorlauf ausgelegt. Für effiziente WP-Nutzung müssen die Heizflächen vergrößert werden — entweder durch größere Heizkörper, WP-Heizkörper (z.B. Ventilheizkörper Typ 33) oder Flächenheizung.",
        prerequisites: [
          "Heizlastberechnung (Raum für Raum) durch Fachplaner erstellen lassen",
          "Prüfen, welche Räume zuerst getauscht werden sollten (Bad, Wohnzimmer sind oft kritisch)",
          "Fördermöglichkeiten prüfen (BEG-Förderung für Heizungsoptimierung)",
        ],
      });
    }
  } else if (params.vorlauftemp > 35 && hatFlaechenheizung) {
    recs.push({
      category: "Einstellungen",
      title: `Vorlauftemperatur von ${params.vorlauftemp}°C auf 35°C optimieren`,
      impact: `Bei Fußbodenheizung reichen meist 35°C. Ca. ${Math.round((params.vorlauftemp - 35) * 2.5)}% Einsparung möglich.`,
      priority: "medium",
      context: "Senken Sie die Heizkurve schrittweise ab. Bei gut gedämmten Neubauten sind sogar 30°C möglich.",
    });
  }

  // ─── Hydraulischer Abgleich ──────────────────────────────────────
  if (input.hydraulischerAbgleich === "nein") {
    const prereqs: string[] = [
      "Fachbetrieb mit hydraulischem Abgleich beauftragen",
    ];
    if (hatBestandsHK) {
      prereqs.push("Voreinstellbare Thermostatventile nachrüsten (falls nicht vorhanden)");
    }
    recs.push({
      category: "Maßnahme",
      title: "Hydraulischen Abgleich durchführen lassen",
      impact: "10-15% Effizienzsteigerung durch optimale Wärmeverteilung. Kosten: ca. 500-1.000€.",
      priority: "high",
      context: "Der hydraulische Abgleich stellt sicher, dass jeder Heizkörper genau die richtige Wassermenge erhält. Ohne ihn werden nahegelegene Räume überversorgt und entfernte unterversorgt. Förderfähig über BEG (bis zu 20%).",
      prerequisites: prereqs,
    });
  }

  // ─── Raumtemperatur (advanced) ───────────────────────────────────
  if (params.isAdvanced && params.raumtemp > 21) {
    const savings = Math.round((params.raumtemp - 21) * 6);
    recs.push({
      category: "Verhalten",
      title: `Raumtemperatur von ${params.raumtemp}°C auf 21°C senken`,
      impact: `Ca. ${savings}% Heizkostenersparnis. Bereits 1°C weniger spart rund 6% Energie.`,
      priority: "medium",
      context: "Senken Sie die Temperatur zunächst in selten genutzten Räumen. Schlafzimmer und Flur benötigen meist nur 18°C. Wohnräume können auf 21°C eingestellt werden.",
    });
  }

  // ─── Automatische Raumregler ─────────────────────────────────────
  if (input.automatischeRaumregler === "nein") {
    recs.push({
      category: "Investition",
      title: "Smarte Thermostate / automatische Raumregler nachrüsten",
      impact: "5% Einsparung durch bedarfsgerechte Raumregelung und automatische Nachtabsenkung.",
      priority: "medium",
      context: "Smarte Thermostate ermöglichen raumweise Zeitprogramme und Absenkung bei Abwesenheit. Kosten: ca. 50-80€ pro Heizkörper, schnelle Amortisation.",
    });
  }

  // ─── WP-Heizkörper (nur wenn Bestandsheizkörper und noch nicht empfohlen) ──
  if (hatBestandsHK && !hatWPHeizkoerper && params.vorlauftemp <= 45) {
    // Nur empfehlen, wenn oben keine VL-Temp-Empfehlung den HK-Tausch schon abdeckt
    recs.push({
      category: "Investition",
      title: "Einzelne kritische Heizkörper gegen WP-Heizkörper tauschen",
      impact: "Ermöglicht niedrigere Vorlauftemperaturen in Problemräumen und verbessert die Gesamt-JAZ.",
      priority: "medium",
      context: "Nicht immer müssen alle Heizkörper getauscht werden. Oft genügt es, die 2-3 am schlechtesten versorgten Räume (z.B. Bad, großer Wohnraum) umzurüsten.",
      prerequisites: [
        "Raumweise Heizlastberechnung, um die kritischen Räume zu identifizieren",
        "Prüfung, ob vorhandene Rohrleitungen für größere Heizkörper ausreichen",
      ],
    });
  }

  // ─── Warmwasser ──────────────────────────────────────────────────
  if (params.duschenProTag && params.duschenProTag > 4) {
    recs.push({
      category: "Warmwasser",
      title: "Warmwasserverbrauch optimieren",
      impact: "Hoher WW-Bedarf belastet die WP erheblich. Sparbrausen und kürzere Duschzeiten helfen.",
      priority: "medium",
      context: `Bei ${params.duschenProTag} Dusch-/Badevorgängen pro Tag ist der Warmwasseranteil am Stromverbrauch überdurchschnittlich hoch. Sparbrausen (6-8 l/min statt 12-15 l/min) können den WW-Bedarf um 30-40% senken.`,
    });
  }

  // ─── Gebäudehülle ────────────────────────────────────────────────
  if (params.specificDemand > 100) {
    const missing: { name: string; saving: string }[] = [];
    if (!renovierungen.includes("fassade")) missing.push({ name: "Fassadendämmung", saving: "20-35 kWh/m²" });
    if (!renovierungen.includes("dach")) missing.push({ name: "Dachdämmung", saving: "15-20 kWh/m²" });
    if (!renovierungen.includes("fenster")) missing.push({ name: "Fenstererneuerung", saving: "10-18 kWh/m²" });
    if (!renovierungen.includes("kellerdecke")) missing.push({ name: "Kellerdeckendämmung", saving: "8-12 kWh/m²" });

    if (missing.length > 0) {
      const totalSavingLow = missing.length * 12;
      const totalSavingHigh = missing.length * 25;
      recs.push({
        category: "Gebäude",
        title: `Energetische Sanierung: ${missing.map((m) => m.name).join(", ")}`,
        impact: `Heizwärmebedarf (${params.specificDemand} kWh/m²) ist hoch. Mögliche Reduktion: ${totalSavingLow}-${totalSavingHigh} kWh/m².`,
        priority: "high",
        context: `Eine bessere Gebäudehülle reduziert nicht nur den Verbrauch, sondern ermöglicht auch niedrigere Vorlauftemperaturen — ein doppelter Effizienzgewinn für die WP.\n\nEinzelpotenziale:\n${missing.map((m) => `• ${m.name}: ${m.saving}`).join("\n")}`,
        prerequisites: [
          "Energieberatung (BAFA-gefördert, ca. 80% Zuschuss) durchführen lassen",
          "Individuellen Sanierungsfahrplan (iSFP) erstellen lassen — erhöht Fördersätze um 5%",
          "Maßnahmen in sinnvoller Reihenfolge planen (Dämmung vor Heizungstausch)",
        ],
      });
    }
  } else if (params.specificDemand > 70 && input.gebaeudetyp === "altbau") {
    // Moderately high — suggest targeted measures
    const missing: string[] = [];
    if (!renovierungen.includes("kellerdecke")) missing.push("Kellerdeckendämmung");
    if (!renovierungen.includes("dach")) missing.push("Dachdämmung/oberste Geschossdecke");
    if (missing.length > 0) {
      recs.push({
        category: "Gebäude",
        title: `Gezielte Dämmung: ${missing.join(", ")}`,
        impact: `Kostengünstige Maßnahmen mit schneller Amortisation. Heizwärmebedarf kann um 10-20 kWh/m² sinken.`,
        priority: "medium",
        context: "Kellerdecken- und Dachdämmung sind oft die wirtschaftlichsten Sanierungsmaßnahmen und können teilweise in Eigenleistung durchgeführt werden.",
      });
    }
  }

  // ─── Pufferspeicher-Hinweis ──────────────────────────────────────
  if (input.pufferspeicher === "ja" && hatFlaechenheizung) {
    recs.push({
      category: "Einstellungen",
      title: "Notwendigkeit des Pufferspeichers prüfen",
      impact: "Pufferspeicher verursacht Verluste (ca. 1-3% des Wärmebedarfs). Bei Fußbodenheizung oft nicht nötig.",
      priority: "low",
      context: "Fußbodenheizungen haben bereits eine große thermische Masse und dienen selbst als Puffer. Ein zusätzlicher Pufferspeicher kann die Effizienz verschlechtern. Prüfen Sie mit Ihrem Installateur, ob der Pufferspeicher deaktiviert oder entfernt werden kann.",
    });
  }

  // ─── Wartung ─────────────────────────────────────────────────────
  recs.push({
    category: "Wartung",
    title: "Regelmäßige Wartung und Filterkontrolle",
    impact: "3-5% Effizienzgewinn. Empfohlen: jährliche Wartung durch Fachbetrieb.",
    priority: "low",
    context: "Verschmutzte Luftfilter (bei Luft-WP), verkalkte Wärmetauscher oder zu wenig Kältemittel reduzieren die Leistung deutlich.",
  });

  // ─── Fachplaner ──────────────────────────────────────────────────
  if (Math.abs(params.deviation) > 30) {
    recs.push({
      category: "Fachplaner",
      title: "Professionelle Analyse durch Energieberater empfohlen",
      impact: `Bei ${Math.abs(params.deviation)}% Abweichung vom Optimum sollte ein zertifizierter Energieberater die Anlage prüfen.`,
      priority: "high",
      context: "Eine so große Abweichung deutet auf systematische Probleme hin, die über einfache Einstellungsänderungen hinausgehen. Ein Energieberater kann die Anlage, die Hydraulik und die Regelung umfassend analysieren.",
      prerequisites: [
        "Energieberater über die Energieeffizienz-Expertenliste (www.energie-effizienz-experten.de) finden",
        "BAFA-Förderung für Energieberatung beantragen (bis zu 80% Zuschuss)",
        "Betriebsdaten (Zählerstände, Einstellungen) für den Berater dokumentieren",
      ],
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}
