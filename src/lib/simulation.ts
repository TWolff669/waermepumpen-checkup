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
import { analyzePV, type PVAnalyseResult } from "./pv-simulation";
import { getRelevanteFoerderung, type Foerdermittel } from "./foerderung";

// ─── Building parameters ───────────────────────────────────────────

/** Base specific heat demand (kWh/m²·a) by construction year */
function getBaseDemandByBaujahr(baujahr: string): number {
  switch (baujahr) {
    case "vor1960":    return 180;
    case "1960-1978":  return 150;
    case "1979-1995":  return 120;
    case "1996-2002":  return 90;
    case "2003-2015":  return 65;
    case "ab2016":     return 40;
    default:           return 130;
  }
}

/** Specific heat demand (kWh/m²·a) by building type, construction year and renovation state */
function getSpecificHeatDemand(
  gebaeudetyp: string,
  renovierungen: string[],
  baujahr: string
): number {
  if (gebaeudetyp === "neubau") {
    if (baujahr === "ab2016") return 35;
    if (baujahr === "2003-2015") return 50;
    return 40;
  }

  let demand = getBaseDemandByBaujahr(baujahr);
  if (renovierungen.includes("dach")) demand -= 20;
  if (renovierungen.includes("fenster")) demand -= 18;
  if (renovierungen.includes("fassade")) demand -= 35;
  if (renovierungen.includes("kellerdecke")) demand -= 12;

  const minDemand = gebaeudetyp === "neubau" ? 35 : 45;
  return Math.max(demand, minDemand);
}

/** Climate correction factor: ratio of local HGT to reference (3400 Kd) */
function getClimateFactor(heizgradtage: number): number {
  return heizgradtage / 3400;
}

// ─── Hot water demand ──────────────────────────────────────────────

function getHotWaterDemand(
  personen: number,
  duschenProTag?: number
): number {
  const basePerPerson = 500;
  let demand = personen * basePerPerson;

  if (duschenProTag !== undefined) {
    const avgDaily = personen * 0.7;
    const factor = duschenProTag / Math.max(avgDaily, 1);
    demand *= Math.max(0.6, Math.min(factor, 2.0));
  }

  return demand;
}

// ─── COP / JAZ estimation ──────────────────────────────────────────

function estimateJAZ(params: {
  vorlauftemperatur: number;
  avgOutdoorTemp: number;
  heizungstyp: string;
  wpHeizkoerper?: string;
  hydraulischerAbgleich: string;
  pufferspeicher: string;
}): number {
  const {
    vorlauftemperatur, avgOutdoorTemp, heizungstyp,
    wpHeizkoerper, hydraulischerAbgleich, pufferspeicher,
  } = params;

  const T_source_K = avgOutdoorTemp + 2 + 273.15;
  const T_sink_K = vorlauftemperatur + 273.15;
  const COP_carnot = T_sink_K / (T_sink_K - T_source_K);

  let eta = 0.45;
  if (heizungstyp === "flaechenheizung") eta += 0.02;
  if (wpHeizkoerper === "ja") eta += 0.015;
  if (hydraulischerAbgleich === "ja") eta += 0.02;
  if (hydraulischerAbgleich === "nein") eta -= 0.02;
  if (pufferspeicher === "ja") eta -= 0.01;

  const JAZ = eta * COP_carnot;
  return Math.max(2.0, Math.min(JAZ, 5.5));
}

function estimateJAZWarmwasser(avgOutdoorTemp: number): number {
  const T_source_K = avgOutdoorTemp + 2 + 273.15;
  const T_sink_K = 52 + 273.15;
  const COP_carnot = T_sink_K / (T_sink_K - T_source_K);
  return Math.max(1.8, Math.min(0.40 * COP_carnot, 3.5));
}

// ─── Room temperature adjustment ──────────────────────────────────

function getRoomTempFactor(raumtemperatur: number): number {
  return 1 + (raumtemperatur - 20) * 0.06;
}

function getControllerFactor(automatischeRaumregler: string): number {
  return automatischeRaumregler === "ja" ? 0.95 : 1.0;
}

// ─── Flow temperature estimation ──────────────────────────────────

function estimateVorlauftemperatur(
  heizungstyp: string,
  heizkoerperZustand: string,
  wpHeizkoerper?: string
): number {
  if (heizungstyp === "flaechenheizung") return 35;
  if (wpHeizkoerper === "ja") return 42;
  if (heizkoerperZustand === "saniert") return 45;
  return 55;
}

// ─── Monthly heating degree day distribution ──────────────────────
export const MONTHLY_HGT_FRACTION = [
  0.17, 0.14, 0.11, 0.07, 0.02, 0.00,
  0.00, 0.00, 0.02, 0.08, 0.13, 0.16,
];

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

  let coveredFraction = 0;
  const current = new Date(startDate);
  while (current < endDate) {
    const month = current.getMonth();
    const daysInMonth = new Date(current.getFullYear(), month + 1, 0).getDate();
    const dailyFraction = (MONTHLY_HGT_FRACTION[month] + 0.10 / 12) / daysInMonth;
    coveredFraction += dailyFraction;
    current.setDate(current.getDate() + 1);
  }

  coveredFraction = Math.max(coveredFraction, 0.05);
  const annualized = Math.round(consumption / coveredFraction);
  return { annualized, days, isPartial: true };
}

// ─── Heizstab analysis ────────────────────────────────────────────

export interface HeizstabAnalyse {
  stromverbrauchHeizstab: number;
  anteilAmGesamtverbrauch: number;
  jazOhneHeizstab: number;
  jazMitHeizstab: number;
  bewertung: 'gut' | 'auffaellig' | 'kritisch';
  mehrkostenProJahr: number;
}

function analyzeHeizstab(params: {
  heizstabVorhanden: string;
  heizstabLeistung?: number;
  heizstabBetriebsstunden?: number;
  heizstabModus?: string;
  actualConsumption: number;
  simulatedConsumption: number;
  totalHeatDemand: number;
  jaz: number;
  strompreis: number;
  heizgradtage: number;
}): HeizstabAnalyse | undefined {
  const {
    heizstabVorhanden, heizstabLeistung, heizstabBetriebsstunden,
    heizstabModus, actualConsumption, simulatedConsumption,
    totalHeatDemand, jaz, strompreis, heizgradtage,
  } = params;

  if (heizstabVorhanden !== "ja") return undefined;

  const leistung = heizstabLeistung || 6; // Default 6 kW

  // Estimate operating hours if not provided
  let betriebsstunden: number;
  if (heizstabBetriebsstunden && heizstabBetriebsstunden > 0) {
    betriebsstunden = heizstabBetriebsstunden;
  } else if (heizstabModus === "notfall") {
    betriebsstunden = 75; // 50-100h/a average
  } else if (heizstabModus === "parallel") {
    // Scale with climate zone
    const climateFactor = heizgradtage / 3400;
    betriebsstunden = Math.round(500 * climateFactor);
  } else {
    betriebsstunden = 200; // Unknown mode fallback
  }

  const stromverbrauchHeizstab = Math.round(leistung * betriebsstunden);
  const referenceConsumption = actualConsumption > simulatedConsumption ? actualConsumption : simulatedConsumption;
  const anteilAmGesamtverbrauch = referenceConsumption > 0
    ? Math.round((stromverbrauchHeizstab / referenceConsumption) * 100)
    : 0;

  // Heat produced by Heizstab (COP ≈ 0.98)
  const waermeHeizstab = leistung * betriebsstunden * 0.98;

  // JAZ with Heizstab (effective overall efficiency)
  const gesamtWaerme = totalHeatDemand;
  const stromWP = referenceConsumption - stromverbrauchHeizstab;
  const jazMitHeizstab = referenceConsumption > 0
    ? Math.round((gesamtWaerme / referenceConsumption) * 100) / 100
    : jaz;

  // JAZ without Heizstab
  const waermeOhneHeizstab = gesamtWaerme - waermeHeizstab;
  const jazOhneHeizstab = stromWP > 0
    ? Math.round((Math.max(waermeOhneHeizstab, 0) / Math.max(stromWP, 1)) * 100) / 100
    : jaz;

  const bewertung: HeizstabAnalyse['bewertung'] =
    anteilAmGesamtverbrauch < 5 ? 'gut' :
    anteilAmGesamtverbrauch <= 15 ? 'auffaellig' : 'kritisch';

  // Additional costs vs. pure WP operation
  // If WP had produced that heat, it would have used waermeHeizstab/jaz electricity
  const wpStromAlternative = waermeHeizstab / Math.max(jaz, 2);
  const mehrkostenProJahr = Math.round((stromverbrauchHeizstab - wpStromAlternative) * strompreis);

  return {
    stromverbrauchHeizstab,
    anteilAmGesamtverbrauch,
    jazOhneHeizstab: Math.max(jazOhneHeizstab, 2.0),
    jazMitHeizstab: Math.max(jazMitHeizstab, 1.0),
    bewertung,
    mehrkostenProJahr: Math.max(mehrkostenProJahr, 0),
  };
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
  strompreis?: string;
  // Advanced fields (optional)
  vorlauftemperatur?: string;
  wpHeizkoerper?: string;
  duschenProTag?: string;
  raumtemperatur?: string;
  automatischeRaumregler?: string;
  isAdvanced?: boolean;
  // Heizstab
  heizstabVorhanden?: string;
  heizstabLeistung?: string;
  heizstabBetriebsstunden?: string;
  heizstabModus?: string;
  // PV
  pvVorhanden?: string;
  pvLeistung?: string;
  pvAusrichtung?: string;
  batterieSpeicher?: string;
  batterieSpeicherKapazitaet?: string;
}

export interface KostenAnalyse {
  strompreis: number;
  istKostenJahr: number;
  sollKostenJahr: number;
  einsparpotenzialJahr: number;
  einsparpotenzial5Jahre: number;
  einsparpotenzialProzent: number;
}

export interface SimulationResult {
  score: number;
  deviation: number;
  simulatedConsumption: number;
  actualConsumption: number;
  isAdvanced: boolean;
  jaz: number;
  jazWarmwasser: number;
  heatingDemand: number;
  hotWaterDemand: number;
  specificHeatDemand: number;
  climateRegion: string;
  vorlauftemperatur: number;
  isPartialPeriod: boolean;
  measurementDays: number;
  recommendations: Recommendation[];
  heizstabAnalyse?: HeizstabAnalyse;
  pvAnalyse?: PVAnalyseResult;
  kostenAnalyse: KostenAnalyse;
  foerderungen: Foerdermittel[];
}

export interface Recommendation {
  category: string;
  title: string;
  impact: string;
  priority: "high" | "medium" | "low";
  prerequisites?: string[];
  context?: string;
}

export function runSimulation(input: SimulationInput): SimulationResult {
  // ── Parse inputs ──
  const flaeche = Math.max(Number(input.beheizteFlaeche) || 120, 20);
  const personen = Math.max(Number(input.personenAnzahl) || 3, 1);
  const isAdvanced = Boolean(input.isAdvanced);

  // ── Strompreis ──
  const strompreisCtInput = Number(input.strompreis) || 0;
  const strompreis = strompreisCtInput > 0 ? strompreisCtInput / 100 : 0.30; // ct → €

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

  // ── Comparison with actual ──
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
    score = -1;
  }

  // ── Heizstab analysis ──
  const totalHeatDemand = heatingDemand + hotWaterDemand;
  const heizstabAnalyse = isAdvanced ? analyzeHeizstab({
    heizstabVorhanden: input.heizstabVorhanden || "unbekannt",
    heizstabLeistung: Number(input.heizstabLeistung) || undefined,
    heizstabBetriebsstunden: Number(input.heizstabBetriebsstunden) || undefined,
    heizstabModus: input.heizstabModus,
    actualConsumption,
    simulatedConsumption,
    totalHeatDemand,
    jaz,
    strompreis,
    heizgradtage: climate.heizgradtage,
  }) : undefined;

  // ── Kostenanalyse ──
  const istKostenJahr = Math.round(actualConsumption * strompreis);
  const sollKostenJahr = Math.round(simulatedConsumption * strompreis);
  const einsparpotenzialJahr = hasActual ? Math.max(0, istKostenJahr - sollKostenJahr) : 0;

  const kostenAnalyse: KostenAnalyse = {
    strompreis: Math.round(strompreis * 100), // back to ct/kWh for display
    istKostenJahr,
    sollKostenJahr,
    einsparpotenzialJahr,
    einsparpotenzial5Jahre: einsparpotenzialJahr * 5,
    einsparpotenzialProzent: istKostenJahr > 0 ? Math.round((einsparpotenzialJahr / istKostenJahr) * 100) : 0,
  };

  // ── Recommendations ──
  const recommendations = generateRecommendations(input, {
    vorlauftemp,
    jaz,
    deviation,
    raumtemp,
    isAdvanced,
    duschenProTag,
    specificDemand,
    heizstabAnalyse,
    simulatedConsumption,
    strompreis,
  });

  // ── PV analysis ──
  let pvAnalyse: PVAnalyseResult | undefined;
  if (isAdvanced && (input.pvVorhanden === "ja" || input.pvVorhanden === "geplant") && Number(input.pvLeistung) > 0) {
    pvAnalyse = analyzePV({
      pvLeistung: Number(input.pvLeistung),
      pvAusrichtung: input.pvAusrichtung || "sued",
      batterieSpeicher: input.batterieSpeicher === "ja",
      batterieKapazitaet: Number(input.batterieSpeicherKapazitaet) || undefined,
      simulatedConsumption,
      strompreis,
      einspeiseverguetung: 0.08,
      plzPrefix: (input.postleitzahl || "10").substring(0, 2),
    });
  }

  // ── Förderungen ──
  const foerderungen = getRelevanteFoerderung(recommendations);

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
    heizstabAnalyse,
    pvAnalyse,
    kostenAnalyse,
    foerderungen,
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
    heizstabAnalyse?: HeizstabAnalyse;
    simulatedConsumption: number;
    strompreis: number;
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

  // ─── Heizstab ──────────────────────────────────────────────────
  if (params.heizstabAnalyse && params.heizstabAnalyse.anteilAmGesamtverbrauch > 5) {
    const ha = params.heizstabAnalyse;
    recs.push({
      category: "Heizstab",
      title: `Heizstab-Einsatz reduzieren – ${ha.anteilAmGesamtverbrauch}% des Stromverbrauchs`,
      impact: `Ca. ${ha.mehrkostenProJahr}€/Jahr Einsparpotenzial. JAZ-Verbesserung von ${ha.jazMitHeizstab.toFixed(2)} auf ${ha.jazOhneHeizstab.toFixed(2)} möglich.`,
      priority: "high",
      context: "Der Heizstab arbeitet mit COP ≈ 1 und ist damit 3-4× ineffizienter als der Verdichter. Häufige Ursachen: Bivalenzpunkt zu hoch eingestellt, Abtauung zu aggressiv, Warmwasser-Legionellenprogramm zu häufig.",
      prerequisites: [
        "Bivalenzpunkt in der WP-Regelung prüfen (typisch: -5 bis -10°C)",
        "Heizstab-Freigabetemperatur kontrollieren",
        "Betriebsstunden Heizstab regelmäßig ablesen und dokumentieren",
      ],
    });
  }

  if (input.heizstabVorhanden === "unbekannt") {
    recs.push({
      category: "Diagnose",
      title: "Heizstab-Betriebsstunden prüfen",
      impact: "Der Heizstab kann bis zu 20% des Stromverbrauchs verursachen – oft unbemerkt.",
      priority: "medium",
      context: "Prüfen Sie im WP-Menü unter 'Betriebsstunden Heizstab' oder 'Zuheizer', wie viele Stunden der Heizstab gelaufen ist.",
    });
  }

  // ─── PV Empfehlungen ────────────────────────────────────────────
  if (input.pvVorhanden === "nein" && params.simulatedConsumption > 3000) {
    const geschaetzteErsparnis = Math.round(params.simulatedConsumption * 0.30 * (params.strompreis - 0.08));
    recs.push({
      category: "PV-Anlage",
      title: "PV-Anlage zur WP-Stromversorgung prüfen",
      impact: `Eine 10 kWp PV-Anlage könnte ca. 25-35% Ihres WP-Stroms abdecken und ${geschaetzteErsparnis}€/Jahr einsparen.`,
      priority: "medium",
      context: "Die größte Überlappung zwischen PV-Ertrag und WP-Bedarf findet in der Übergangszeit (März-April, September-Oktober) statt.",
    });
  }

  if (input.pvVorhanden === "ja" && input.batterieSpeicher === "nein") {
    recs.push({
      category: "PV-Anlage",
      title: "Batteriespeicher zur Erhöhung des PV-Eigenverbrauchs prüfen",
      impact: "Ein Batteriespeicher kann den PV-Eigenverbrauchsanteil von ca. 35% auf 55% steigern.",
      priority: "medium",
      context: "Besonders in der Übergangszeit kann ein Speicher überschüssigen Tagesertrag für den abendlichen/nächtlichen WP-Betrieb nutzen.",
    });
  }

  // ─── Vorlauftemperatur ───────────────────────────────────────────
  if (params.vorlauftemp > 45) {
    if (hatFlaechenheizung) {
      recs.push({
        category: "Einstellungen",
        title: `Vorlauftemperatur von ${params.vorlauftemp}°C auf 35°C senken`,
        impact: `Bei Flächenheizung sind 35°C ausreichend. Geschätzte JAZ-Verbesserung um ca. ${Math.round((params.vorlauftemp - 35) * 2.5)}%.`,
        priority: "high",
        context: "Flächenheizungen (Fußboden/Wand) arbeiten bereits bei niedrigen Temperaturen effizient. Eine Absenkung ist meist ohne bauliche Maßnahmen möglich.",
      });
    } else if (hatWPHeizkoerper || hatSanierteHK) {
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
    const prereqs: string[] = ["Fachbetrieb mit hydraulischem Abgleich beauftragen"];
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

  // ─── WP-Heizkörper ──────────────────────────────────────────────
  if (hatBestandsHK && !hatWPHeizkoerper && params.vorlauftemp <= 45) {
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
