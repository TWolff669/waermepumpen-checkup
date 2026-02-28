import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface FormData {
  postleitzahl: string;
  beheizteFlaeche: string;
  gebaeudetyp: string;
  renovierungen: string[];
  wpLeistung: string;
  hersteller: string;
  personenAnzahl: string;
  abrechnungVorhanden: string;
  pufferspeicher: string;
  heizungstyp: string;
  heizkoerperZustand: string;
  hydraulischerAbgleich: string;
  gesamtverbrauch: string;
  gesamtproduktion: string;
}

const initialData: FormData = {
  postleitzahl: "",
  beheizteFlaeche: "",
  gebaeudetyp: "",
  renovierungen: [],
  wpLeistung: "",
  hersteller: "",
  personenAnzahl: "",
  abrechnungVorhanden: "",
  pufferspeicher: "",
  heizungstyp: "",
  heizkoerperZustand: "",
  hydraulischerAbgleich: "",
  gesamtverbrauch: "",
  gesamtproduktion: "",
};

const renovierungsOptionen = [
  { id: "dach", label: "Dach gedämmt" },
  { id: "fenster", label: "Fenster erneuert" },
  { id: "fassade", label: "Fassade gedämmt" },
  { id: "kellerdecke", label: "Kellerdecke gedämmt" },
];

const herstellerOptionen = [
  "Viessmann", "Bosch", "Vaillant", "Daikin", "Mitsubishi", "Panasonic",
  "Stiebel Eltron", "Wolf", "Buderus", "Nibe", "Andere",
];

const TOTAL_STEPS = 4;

const EfficiencyCheckForm = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initialData);
  const navigate = useNavigate();

  const update = (field: keyof FormData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRenovierung = (id: string) => {
    setData((prev) => ({
      ...prev,
      renovierungen: prev.renovierungen.includes(id)
        ? prev.renovierungen.filter((r) => r !== id)
        : [...prev.renovierungen, id],
    }));
  };

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    // Store data and navigate to results
    sessionStorage.setItem("wp-check-data", JSON.stringify(data));
    navigate("/results");
  };

  const stepLabels = ["Gebäude", "Wärmepumpe", "Heizsystem", "Verbrauch"];

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container max-w-2xl py-10">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "gradient-hero text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`hidden sm:block text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-hero rounded-full"
              initial={false}
              animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-xl shadow-elevated border border-border p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">Gebäudedaten</h2>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="plz">Postleitzahl</Label>
                      <Input id="plz" placeholder="z.B. 80331" value={data.postleitzahl} onChange={(e) => update("postleitzahl", e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="flaeche">Beheizte Fläche (m²)</Label>
                      <Input id="flaeche" type="number" placeholder="z.B. 150" value={data.beheizteFlaeche} onChange={(e) => update("beheizteFlaeche", e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Gebäudetyp</Label>
                      <RadioGroup value={data.gebaeudetyp} onValueChange={(v) => update("gebaeudetyp", v)} className="mt-2 flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="neubau" id="neubau" />
                          <Label htmlFor="neubau" className="font-normal">Neubau</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="altbau" id="altbau" />
                          <Label htmlFor="altbau" className="font-normal">Altbau</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {data.gebaeudetyp === "altbau" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                        <Label>Durchgeführte Sanierungen</Label>
                        {renovierungsOptionen.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <Checkbox id={opt.id} checked={data.renovierungen.includes(opt.id)} onCheckedChange={() => toggleRenovierung(opt.id)} />
                            <Label htmlFor={opt.id} className="font-normal">{opt.label}</Label>
                          </div>
                        ))}
                      </motion.div>
                    )}
                    <div>
                      <Label htmlFor="personen">Anzahl Personen im Haushalt</Label>
                      <Input id="personen" type="number" placeholder="z.B. 4" value={data.personenAnzahl} onChange={(e) => update("personenAnzahl", e.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">Wärmepumpe</h2>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="wpLeistung">Wärmepumpenleistung (kW)</Label>
                      <Input id="wpLeistung" type="number" placeholder="z.B. 10" value={data.wpLeistung} onChange={(e) => update("wpLeistung", e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Hersteller / Typ</Label>
                      <Select value={data.hersteller} onValueChange={(v) => update("hersteller", v)}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Hersteller wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {herstellerOptionen.map((h) => (
                            <SelectItem key={h} value={h.toLowerCase()}>{h}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Pufferspeicher vorhanden?</Label>
                      <RadioGroup value={data.pufferspeicher} onValueChange={(v) => update("pufferspeicher", v)} className="mt-2 flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="ja" id="puffer-ja" />
                          <Label htmlFor="puffer-ja" className="font-normal">Ja</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="nein" id="puffer-nein" />
                          <Label htmlFor="puffer-nein" className="font-normal">Nein</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">Heizsystem</h2>
                  <div className="grid gap-4">
                    <div>
                      <Label>Heizungstyp</Label>
                      <RadioGroup value={data.heizungstyp} onValueChange={(v) => update("heizungstyp", v)} className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="flaechenheizung" id="flaeche-h" />
                          <Label htmlFor="flaeche-h" className="font-normal">Flächenheizung (Fußboden/Wand)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="heizkoerper" id="heizkoerper" />
                          <Label htmlFor="heizkoerper" className="font-normal">Heizkörper</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {data.heizungstyp === "heizkoerper" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                        <Label>Heizkörper-Zustand</Label>
                        <RadioGroup value={data.heizkoerperZustand} onValueChange={(v) => update("heizkoerperZustand", v)} className="mt-2 space-y-2">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="uebernommen" id="uebernommen" />
                            <Label htmlFor="uebernommen" className="font-normal">Übernommen (Bestand)</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="saniert" id="saniert" />
                            <Label htmlFor="saniert" className="font-normal">Saniert / Neu</Label>
                          </div>
                        </RadioGroup>
                      </motion.div>
                    )}
                    <div>
                      <Label>Hydraulischer Abgleich durchgeführt?</Label>
                      <RadioGroup value={data.hydraulischerAbgleich} onValueChange={(v) => update("hydraulischerAbgleich", v)} className="mt-2 flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="ja" id="ha-ja" />
                          <Label htmlFor="ha-ja" className="font-normal">Ja</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="nein" id="ha-nein" />
                          <Label htmlFor="ha-nein" className="font-normal">Nein</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="unbekannt" id="ha-unbekannt" />
                          <Label htmlFor="ha-unbekannt" className="font-normal">Unbekannt</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">Verbrauchsdaten</h2>
                  <div className="grid gap-4">
                    <div>
                      <Label>Aktuelle Abrechnung vorhanden?</Label>
                      <RadioGroup value={data.abrechnungVorhanden} onValueChange={(v) => update("abrechnungVorhanden", v)} className="mt-2 flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="ja" id="ab-ja" />
                          <Label htmlFor="ab-ja" className="font-normal">Ja</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="nein" id="ab-nein" />
                          <Label htmlFor="ab-nein" className="font-normal">Nein</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    {data.abrechnungVorhanden === "ja" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
                        <div>
                          <Label htmlFor="verbrauch">Gesamtstromverbrauch WP (kWh/Jahr)</Label>
                          <Input id="verbrauch" type="number" placeholder="z.B. 4500" value={data.gesamtverbrauch} onChange={(e) => update("gesamtverbrauch", e.target.value)} className="mt-1.5" />
                        </div>
                        <div>
                          <Label htmlFor="produktion">Gesamtwärmeproduktion (kWh/Jahr)</Label>
                          <Input id="produktion" type="number" placeholder="z.B. 15000" value={data.gesamtproduktion} onChange={(e) => update("gesamtproduktion", e.target.value)} className="mt-1.5" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={prev} disabled={step === 0}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Zurück
            </Button>
            {step < TOTAL_STEPS - 1 ? (
              <Button variant="default" onClick={next}>
                Weiter <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit}>
                Ergebnis berechnen <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EfficiencyCheckForm;
