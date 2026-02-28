import { z } from "zod";

// ─── Efficiency Check Schema ─────────────────────────────────────

const baseSchema = z.object({
  postleitzahl: z.string().regex(/^\d{5}$/, "Bitte geben Sie eine gültige 5-stellige PLZ ein"),
  beheizteFlaeche: z.string().refine(
    (v) => { const n = Number(v); return !isNaN(n) && n >= 10 && n <= 1000; },
    "Wert zwischen 10 und 1000 m² eingeben"
  ),
  gebaeudetyp: z.enum(["neubau", "altbau"], { required_error: "Bitte wählen Sie einen Gebäudetyp" }),
  baujahr: z.enum(["vor1960", "1960-1978", "1979-1995", "1996-2002", "2003-2015", "ab2016"], {
    required_error: "Bitte wählen Sie ein Baujahr",
  }),
  renovierungen: z.array(z.string()).optional().default([]),
  personenAnzahl: z.string().refine(
    (v) => { const n = Number(v); return !isNaN(n) && n >= 1 && n <= 20; },
    "Wert zwischen 1 und 20 eingeben"
  ),
});

const wpSchema = z.object({
  wpLeistung: z.string().refine(
    (v) => { const n = Number(v); return !isNaN(n) && n >= 1 && n <= 50; },
    "Wert zwischen 1 und 50 kW eingeben"
  ),
  hersteller: z.string().min(1, "Bitte wählen Sie einen Hersteller"),
  pufferspeicher: z.enum(["ja", "nein"], { required_error: "Bitte wählen" }),
});

const heizsystemSchema = z.object({
  heizungstyp: z.enum(["flaechenheizung", "heizkoerper"], { required_error: "Bitte wählen Sie einen Heizungstyp" }),
  heizkoerperZustand: z.string().optional(),
  hydraulischerAbgleich: z.enum(["ja", "nein", "unbekannt"], { required_error: "Bitte wählen" }),
}).refine(
  (data) => data.heizungstyp !== "heizkoerper" || (data.heizkoerperZustand && data.heizkoerperZustand.length > 0),
  { message: "Bitte wählen Sie den Heizkörper-Zustand", path: ["heizkoerperZustand"] }
);

const verbrauchSchema = z.object({
  abrechnungVorhanden: z.enum(["ja", "nein"], { required_error: "Bitte wählen" }),
  gesamtverbrauch: z.string().optional(),
  gesamtproduktion: z.string().optional(),
  abrechnungVon: z.string().optional(),
  abrechnungBis: z.string().optional(),
  strompreis: z.string().refine(
    (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 10 && Number(v) <= 60),
    "Wert zwischen 10 und 60 ct/kWh"
  ).optional().default(""),
}).refine(
  (data) => data.abrechnungVorhanden !== "ja" || (Number(data.gesamtverbrauch) > 0),
  { message: "Bitte geben Sie den Stromverbrauch ein", path: ["gesamtverbrauch"] }
).refine(
  (data) => data.abrechnungVorhanden !== "ja" || (data.abrechnungVon && data.abrechnungVon.length > 0),
  { message: "Bitte wählen Sie ein Startdatum", path: ["abrechnungVon"] }
).refine(
  (data) => data.abrechnungVorhanden !== "ja" || (data.abrechnungBis && data.abrechnungBis.length > 0),
  { message: "Bitte wählen Sie ein Enddatum", path: ["abrechnungBis"] }
).refine(
  (data) => !data.gesamtproduktion || Number(data.gesamtproduktion) >= 0,
  { message: "Wert muss >= 0 sein", path: ["gesamtproduktion"] }
);

// Step schemas for step-wise validation
export const efficiencyStepSchemas = [
  baseSchema,
  wpSchema,
  heizsystemSchema,
  verbrauchSchema,
] as const;

export const efficiencyFormSchema = z.object({
  ...baseSchema.shape,
  ...wpSchema.shape,
  heizungstyp: z.enum(["flaechenheizung", "heizkoerper"]),
  heizkoerperZustand: z.string().optional(),
  hydraulischerAbgleich: z.enum(["ja", "nein", "unbekannt"]),
  abrechnungVorhanden: z.enum(["ja", "nein"]),
  gesamtverbrauch: z.string().optional(),
  gesamtproduktion: z.string().optional(),
  abrechnungVon: z.string().optional(),
  abrechnungBis: z.string().optional(),
  strompreis: z.string().optional().default(""),
});

export type EfficiencyFormData = z.infer<typeof efficiencyFormSchema>;

// ─── Advanced Check Schema ───────────────────────────────────────

export const advancedStepSchemas = [
  // Step 0: Heizkreis
  z.object({
    vorlauftemperatur: z.string().refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 20 && Number(v) <= 80),
      "Wert zwischen 20 und 80°C"
    ).optional().default(""),
    wpHeizkoerper: z.enum(["ja", "nein", "unbekannt"], { required_error: "Bitte wählen" }),
  }),
  // Step 1: Warmwasser
  z.object({
    duschenProTag: z.string().refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 20),
      "Wert zwischen 0 und 20"
    ).optional().default(""),
  }),
  // Step 2: Raumklima
  z.object({
    raumtemperatur: z.string().refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 15 && Number(v) <= 30),
      "Wert zwischen 15 und 30°C"
    ).optional().default(""),
    automatischeRaumregler: z.enum(["ja", "nein"], { required_error: "Bitte wählen" }),
  }),
  // Step 3: Heizstab
  z.object({
    heizstabVorhanden: z.enum(["ja", "nein", "unbekannt"], { required_error: "Bitte wählen" }),
    heizstabLeistung: z.string().refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 18),
      "Wert zwischen 1 und 18 kW"
    ).optional().default(""),
    heizstabBetriebsstunden: z.string().refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 8760),
      "Wert zwischen 0 und 8760 Stunden"
    ).optional().default(""),
    heizstabModus: z.enum(["notfall", "parallel", "unbekannt"]).optional().default("unbekannt"),
  }),
  // Step 4: PV-Anlage
  z.object({
    pvVorhanden: z.enum(["ja", "nein", "geplant"], { required_error: "Bitte wählen" }),
    pvLeistung: z.string().refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 50),
      "Wert zwischen 1 und 50 kWp"
    ).optional().default(""),
    pvAusrichtung: z.string().optional().default(""),
    batterieSpeicher: z.enum(["ja", "nein"]).optional().default("nein"),
    batterieSpeicherKapazitaet: z.string().refine(
      (v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 1 && Number(v) <= 30),
      "Wert zwischen 1 und 30 kWh"
    ).optional().default(""),
  }),
] as const;

export const advancedFormSchema = z.object({
  vorlauftemperatur: z.string().optional().default(""),
  wpHeizkoerper: z.enum(["ja", "nein", "unbekannt"]).default("unbekannt"),
  duschenProTag: z.string().optional().default(""),
  raumtemperatur: z.string().optional().default(""),
  automatischeRaumregler: z.enum(["ja", "nein"]).default("nein"),
  heizstabVorhanden: z.enum(["ja", "nein", "unbekannt"]).default("unbekannt"),
  heizstabLeistung: z.string().optional().default(""),
  heizstabBetriebsstunden: z.string().optional().default(""),
  heizstabModus: z.enum(["notfall", "parallel", "unbekannt"]).optional().default("unbekannt"),
  pvVorhanden: z.enum(["ja", "nein", "geplant"]).default("nein"),
  pvLeistung: z.string().optional().default(""),
  pvAusrichtung: z.string().optional().default(""),
  batterieSpeicher: z.enum(["ja", "nein"]).default("nein"),
  batterieSpeicherKapazitaet: z.string().optional().default(""),
});

export type AdvancedFormData = z.infer<typeof advancedFormSchema>;
