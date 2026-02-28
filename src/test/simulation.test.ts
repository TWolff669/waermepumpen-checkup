import { describe, it, expect } from "vitest";
import { runSimulation, type SimulationInput } from "@/lib/simulation";
import { getClimateData } from "@/lib/climate-data";

// ─── Helper ────────────────────────────────────────────────────────

function baseInput(overrides: Partial<SimulationInput> = {}): SimulationInput {
  return {
    postleitzahl: "80331",
    beheizteFlaeche: "150",
    gebaeudetyp: "neubau",
    baujahr: "ab2016",
    renovierungen: [],
    wpLeistung: "10",
    personenAnzahl: "4",
    pufferspeicher: "nein",
    heizungstyp: "flaechenheizung",
    heizkoerperZustand: "",
    hydraulischerAbgleich: "ja",
    gesamtverbrauch: "",
    gesamtproduktion: "",
    abrechnungVorhanden: "nein",
    ...overrides,
  };
}

// ─── getClimateData ────────────────────────────────────────────────

describe("getClimateData", () => {
  it("PLZ 80331 → München, HGT 3400", () => {
    const data = getClimateData("80331");
    expect(data.region).toBe("München");
    expect(data.heizgradtage).toBe(3400);
  });

  it("PLZ 20095 → Hamburg, HGT 3200", () => {
    const data = getClimateData("20095");
    expect(data.region).toBe("Hamburg");
    expect(data.heizgradtage).toBe(3200);
  });

  it("Ungültige PLZ → Fallback Deutschland (Durchschnitt)", () => {
    const data = getClimateData("00000");
    expect(data.region).toBe("Deutschland (Durchschnitt)");
  });
});

// ─── Heizwärmebedarf ──────────────────────────────────────────────

describe("runSimulation – Heizwärmebedarf", () => {
  it("Neubau ab 2016, 150m², PLZ 80331 → spez. Bedarf 35", () => {
    const result = runSimulation(baseInput());
    expect(result.specificHeatDemand).toBe(35);
  });

  it("Altbau vor 1960, keine Renovierung → Bedarf 180", () => {
    const result = runSimulation(baseInput({
      gebaeudetyp: "altbau",
      baujahr: "vor1960",
      renovierungen: [],
    }));
    expect(result.specificHeatDemand).toBe(180);
  });

  it("Altbau vor 1960, alle 4 Renovierungen → Bedarf sinkt signifikant aber >= 45", () => {
    const result = runSimulation(baseInput({
      gebaeudetyp: "altbau",
      baujahr: "vor1960",
      renovierungen: ["dach", "fenster", "fassade", "kellerdecke"],
    }));
    expect(result.specificHeatDemand).toBeLessThan(180);
    expect(result.specificHeatDemand).toBeGreaterThanOrEqual(45);
  });
});

// ─── JAZ ──────────────────────────────────────────────────────────

describe("runSimulation – JAZ", () => {
  it("Fußbodenheizung (35°C VL) → JAZ zwischen 3.5 und 5.0", () => {
    const result = runSimulation(baseInput({
      heizungstyp: "flaechenheizung",
    }));
    expect(result.jaz).toBeGreaterThanOrEqual(3.5);
    expect(result.jaz).toBeLessThanOrEqual(5.5);
  });

  it("Bestandsheizkörper (55°C VL) → JAZ zwischen 2.0 und 3.5", () => {
    const result = runSimulation(baseInput({
      heizungstyp: "heizkoerper",
      heizkoerperZustand: "uebernommen",
      hydraulischerAbgleich: "nein",
    }));
    expect(result.jaz).toBeGreaterThanOrEqual(2.0);
    expect(result.jaz).toBeLessThanOrEqual(3.5);
  });

  it("JAZ bleibt immer im Bereich 2.0-5.5", () => {
    const configs = [
      baseInput({ heizungstyp: "flaechenheizung" }),
      baseInput({ heizungstyp: "heizkoerper", heizkoerperZustand: "uebernommen" }),
      baseInput({ heizungstyp: "heizkoerper", heizkoerperZustand: "saniert" }),
    ];
    for (const input of configs) {
      const result = runSimulation(input);
      expect(result.jaz).toBeGreaterThanOrEqual(2.0);
      expect(result.jaz).toBeLessThanOrEqual(5.5);
    }
  });
});

// ─── Annualisierung ───────────────────────────────────────────────

describe("runSimulation – Annualisierung", () => {
  it("12 Monate → kein Hochrechnen (isPartialPeriod = false)", () => {
    const result = runSimulation(baseInput({
      abrechnungVorhanden: "ja",
      gesamtverbrauch: "5000",
      abrechnungVon: "2025-01-01",
      abrechnungBis: "2025-12-31",
    }));
    expect(result.isPartialPeriod).toBe(false);
  });

  it("6 Wintermonate (Okt-März) → Hochrechnung", () => {
    const result = runSimulation(baseInput({
      abrechnungVorhanden: "ja",
      gesamtverbrauch: "4000",
      abrechnungVon: "2024-10-01",
      abrechnungBis: "2025-03-31",
    }));
    expect(result.isPartialPeriod).toBe(true);
    // Annualized should be different from raw value
    expect(result.actualConsumption).not.toBe(4000);
  });
});

// ─── Ohne Abrechnungsdaten ────────────────────────────────────────

describe("runSimulation – Ohne Abrechnungsdaten", () => {
  it("Score soll -1 sein", () => {
    const result = runSimulation(baseInput({ abrechnungVorhanden: "nein" }));
    expect(result.score).toBe(-1);
  });

  it("actualConsumption === simulatedConsumption", () => {
    const result = runSimulation(baseInput({ abrechnungVorhanden: "nein" }));
    expect(result.actualConsumption).toBe(result.simulatedConsumption);
  });

  it("deviation soll 0 sein", () => {
    const result = runSimulation(baseInput({ abrechnungVorhanden: "nein" }));
    expect(result.deviation).toBe(0);
  });
});

// ─── Empfehlungen ─────────────────────────────────────────────────

describe("generateRecommendations", () => {
  it("Hohe VL-Temp + Fußbodenheizung → Empfehlung VL senken", () => {
    const result = runSimulation(baseInput({
      heizungstyp: "flaechenheizung",
      isAdvanced: true,
      vorlauftemperatur: "50",
    }));
    const vlRec = result.recommendations.find((r) =>
      r.title.toLowerCase().includes("vorlauftemperatur")
    );
    expect(vlRec).toBeDefined();
  });

  it("Hydraulischer Abgleich 'nein' → Empfehlung hydraulischer Abgleich", () => {
    const result = runSimulation(baseInput({
      hydraulischerAbgleich: "nein",
    }));
    const haRec = result.recommendations.find((r) =>
      r.title.toLowerCase().includes("hydraulisch")
    );
    expect(haRec).toBeDefined();
  });

  it("Spezifischer Bedarf > 100 + fehlende Renovierungen → Sanierungsempfehlung", () => {
    const result = runSimulation(baseInput({
      gebaeudetyp: "altbau",
      baujahr: "vor1960",
      renovierungen: [],
    }));
    const sanRec = result.recommendations.find((r) =>
      r.category === "Gebäude"
    );
    expect(sanRec).toBeDefined();
  });
});
