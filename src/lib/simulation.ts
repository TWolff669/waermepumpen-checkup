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

/** Specific heat demand (kWh/m²·a) by building type and renovation state */
function getSpecificHeatDemand(
  gebaeudetyp: string,
  renovierungen: string[]
): number {
  if (gebaeudetyp === "neubau") {
    // KfW55 / GEG 2024 standard
    return 40;
  }

  // Altbau base: unrenovated ~150 kWh/m²·a
  let demand = 150;

  // Each renovation measure reduces demand
  if (renovierungen.includes("dach")) demand -= 20;
  if (renovierungen.includes("fenster")) demand -= 18;
  if (renovierungen.includes("fassade")) demand -= 35;
  if (renovierungen.includes("kellerdecke")) demand -= 12;

  return Math.max(demand, 45); // Fully renovated Altbau won't go below ~45
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

// ─── Main simulation ──────────────────────────────────────────────

export interface SimulationInput {
  postleitzahl: string;
  beheizteFlaeche: string;
  gebaeudetyp: string;
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
  /** Personalized recommendations */
  recommendations: Recommendation[];
}

export interface Recommendation {
  category: string;
  title: string;
  impact: string;
  priority: "high" | "medium" | "low";
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
    input.renovierungen || []
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

  // ── Comparison with actual ──
  const hasActual = input.abrechnungVorhanden === "ja" && Number(input.gesamtverbrauch) > 0;
  const actualConsumption = hasActual
    ? Number(input.gesamtverbrauch)
    : Math.round(simulatedConsumption * (1 + (Math.random() * 0.3 - 0.05)));

  const deviation = Math.round(
    ((actualConsumption - simulatedConsumption) / simulatedConsumption) * 100
  );

  const score = Math.max(0, Math.min(100, 100 - Math.abs(deviation) * 1.5));

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

  // Vorlauftemperatur
  if (params.vorlauftemp > 45) {
    recs.push({
      category: "Einstellungen",
      title: `Vorlauftemperatur von ${params.vorlauftemp}°C auf max. 42°C senken`,
      impact: `Geschätzte JAZ-Verbesserung um ${Math.round((params.vorlauftemp - 42) * 0.5 * 10) / 10}%. Jedes Grad weniger spart ca. 2.5% Strom.`,
      priority: "high",
    });
  }

  // Hydraulischer Abgleich
  if (input.hydraulischerAbgleich === "nein") {
    recs.push({
      category: "Maßnahme",
      title: "Hydraulischen Abgleich durchführen lassen",
      impact: "10-15% Effizienzsteigerung durch optimale Wärmeverteilung. Kosten: ca. 500-1.000€, oft förderfähig.",
      priority: "high",
    });
  }

  // Room temperature (advanced)
  if (params.isAdvanced && params.raumtemp > 21) {
    const savings = Math.round((params.raumtemp - 21) * 6);
    recs.push({
      category: "Verhalten",
      title: `Raumtemperatur von ${params.raumtemp}°C auf 21°C senken`,
      impact: `Ca. ${savings}% Heizkostenersparnis. Bereits 1°C weniger spart rund 6% Energie.`,
      priority: "medium",
    });
  }

  // Automatic controllers
  if (input.automatischeRaumregler === "nein") {
    recs.push({
      category: "Investition",
      title: "Smarte Thermostate / automatische Raumregler nachrüsten",
      impact: "5% Einsparung durch bedarfsgerechte Raumregelung und automatische Nachtabsenkung.",
      priority: "medium",
    });
  }

  // WP-Heizkörper
  if (input.heizungstyp === "heizkoerper" && input.wpHeizkoerper === "nein") {
    recs.push({
      category: "Investition",
      title: "Wärmepumpenheizkörper in Betracht ziehen",
      impact: "Ermöglicht niedrigere Vorlauftemperaturen und verbessert JAZ um bis zu 7%.",
      priority: "medium",
    });
  }

  // Hot water
  if (params.duschenProTag && params.duschenProTag > 4) {
    recs.push({
      category: "Warmwasser",
      title: "Warmwasserverbrauch optimieren",
      impact: "Hoher WW-Bedarf belastet die WP erheblich. Sparbrausen und kürzere Duschzeiten helfen.",
      priority: "medium",
    });
  }

  // Building envelope for Altbau
  if (params.specificDemand > 100) {
    const missing: string[] = [];
    if (!(input.renovierungen || []).includes("fassade")) missing.push("Fassadendämmung");
    if (!(input.renovierungen || []).includes("dach")) missing.push("Dachdämmung");
    if (!(input.renovierungen || []).includes("fenster")) missing.push("Fenstererneuerung");
    if (missing.length > 0) {
      recs.push({
        category: "Gebäude",
        title: `Energetische Sanierung: ${missing.join(", ")}`,
        impact: `Spezifischer Heizwärmebedarf (${params.specificDemand} kWh/m²) ist hoch. Sanierung kann ihn um 30-50% senken.`,
        priority: "high",
      });
    }
  }

  // Wartung
  recs.push({
    category: "Wartung",
    title: "Regelmäßige Wartung und Filterkontrolle",
    impact: "3-5% Effizienzgewinn. Empfohlen: jährliche Wartung durch Fachbetrieb.",
    priority: "low",
  });

  // Fachplaner bei sehr hoher Abweichung
  if (Math.abs(params.deviation) > 30) {
    recs.push({
      category: "Fachplaner",
      title: "Professionelle Analyse durch Fachplaner empfohlen",
      impact: `Bei ${Math.abs(params.deviation)}% Abweichung vom Optimum sollte ein Energieberater die Anlage prüfen.`,
      priority: "high",
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}
