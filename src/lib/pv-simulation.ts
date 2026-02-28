/**
 * PV + Wärmepumpe Eigenverbrauchsoptimierung
 * 
 * Berechnet, wie viel des WP-Stroms durch eine PV-Anlage gedeckt werden kann.
 */

// Monthly PV yields per kWp for South orientation, 35° tilt (Germany average)
const MONTHLY_PV_YIELD_SOUTH: number[] = [
  30,  // Jan
  45,  // Feb
  80,  // Mär
  110, // Apr
  130, // Mai
  135, // Jun
  130, // Jul
  120, // Aug
  90,  // Sep
  55,  // Okt
  30,  // Nov
  22,  // Dez
];

// Orientation correction factors
const ORIENTATION_FACTORS: Record<string, number> = {
  "sued": 1.0,
  "sued-west": 0.93,
  "sued-ost": 0.93,
  "west": 0.82,
  "ost": 0.82,
};

// Monthly HGT fraction (same as simulation.ts)
const MONTHLY_HGT_FRACTION = [
  0.17, 0.14, 0.11, 0.07, 0.02, 0.00,
  0.00, 0.00, 0.02, 0.08, 0.13, 0.16,
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_NAMES = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function getClimatePVFactor(plzPrefix: string): number {
  const num = parseInt(plzPrefix, 10);
  // Northern Germany
  if (num >= 17 && num <= 29) return 0.92;
  // Southern Germany
  if ((num >= 60 && num <= 99) || (num >= 1 && num <= 16)) return 1.05;
  // Central
  return 1.0;
}

export interface PVAnalyseResult {
  pvJahresertrag: number;
  eigenverbrauchWP: number;
  eigenverbrauchAnteil: number;
  einsparungProJahr: number;
  monatsdaten: {
    monat: string;
    pvErtrag: number;
    wpBedarf: number;
    eigenverbrauch: number;
  }[];
}

export function analyzePV(params: {
  pvLeistung: number;
  pvAusrichtung: string;
  batterieSpeicher: boolean;
  batterieKapazitaet?: number;
  simulatedConsumption: number;
  strompreis: number;
  einspeiseverguetung: number;
  plzPrefix: string;
}): PVAnalyseResult {
  const {
    pvLeistung, pvAusrichtung, batterieSpeicher, batterieKapazitaet,
    simulatedConsumption, strompreis, einspeiseverguetung, plzPrefix,
  } = params;

  const orientFactor = ORIENTATION_FACTORS[pvAusrichtung] || 1.0;
  const climateFactor = getClimatePVFactor(plzPrefix);

  // Overlap factor: how much PV can be directly used by WP
  let overlapFactor = 0.35; // Without battery
  if (batterieSpeicher) {
    // Scale overlap with battery capacity (reference: 10 kWh)
    const kapRef = batterieKapazitaet || 10;
    overlapFactor = 0.35 + 0.20 * Math.min(kapRef / 10, 1.5);
  }

  let totalPVErtrag = 0;
  let totalEigenverbrauch = 0;
  const monatsdaten: PVAnalyseResult["monatsdaten"] = [];

  for (let m = 0; m < 12; m++) {
    const pvErtrag = Math.round(MONTHLY_PV_YIELD_SOUTH[m] * pvLeistung * orientFactor * climateFactor);
    const wpBedarf = Math.round(simulatedConsumption * (MONTHLY_HGT_FRACTION[m] + 0.10 / 12));
    const eigenverbrauch = Math.round(Math.min(pvErtrag * overlapFactor, wpBedarf));

    totalPVErtrag += pvErtrag;
    totalEigenverbrauch += eigenverbrauch;

    monatsdaten.push({
      monat: MONTH_NAMES[m],
      pvErtrag,
      wpBedarf,
      eigenverbrauch,
    });
  }

  const eigenverbrauchAnteil = simulatedConsumption > 0
    ? Math.round((totalEigenverbrauch / simulatedConsumption) * 100)
    : 0;

  // Savings: eigenverbrauch * (strompreis - einspeiseverguetung)
  // because instead of buying from grid at strompreis, you use your own PV
  const einsparungProJahr = Math.round(totalEigenverbrauch * (strompreis - einspeiseverguetung));

  return {
    pvJahresertrag: totalPVErtrag,
    eigenverbrauchWP: totalEigenverbrauch,
    eigenverbrauchAnteil,
    einsparungProJahr,
    monatsdaten,
  };
}
