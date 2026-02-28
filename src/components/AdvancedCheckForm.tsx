import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import InfoTooltip from "@/components/InfoTooltip";
import { advancedStepSchemas } from "@/lib/validations";

interface AdvancedFormData {
  vorlauftemperatur: string;
  wpHeizkoerper: string;
  duschenProTag: string;
  raumtemperatur: string;
  automatischeRaumregler: string;
}

const initialData: AdvancedFormData = {
  vorlauftemperatur: "", wpHeizkoerper: "", duschenProTag: "",
  raumtemperatur: "", automatischeRaumregler: "",
};

const TOTAL_STEPS = 3;

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
};

const AdvancedCheckForm = () => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AdvancedFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const update = (field: keyof AdvancedFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const stepFields: (keyof AdvancedFormData)[][] = [
    ["vorlauftemperatur", "wpHeizkoerper"],
    ["duschenProTag"],
    ["raumtemperatur", "automatischeRaumregler"],
  ];

  const validateStep = (stepIndex: number): boolean => {
    const schema = advancedStepSchemas[stepIndex];
    const fields = stepFields[stepIndex];
    const stepData: Record<string, any> = {};
    fields.forEach((f) => { stepData[f] = data[f]; });

    const result = schema.safeParse(stepData);
    if (result.success) { setErrors({}); return true; }

    const newErrors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path[0]?.toString();
      if (path && !newErrors[path]) newErrors[path] = issue.message;
    });
    setErrors(newErrors);
    return false;
  };

  const next = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); };
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    if (!validateStep(step)) return;
    const basicData = sessionStorage.getItem("wp-check-data");
    const combined = { ...(basicData ? JSON.parse(basicData) : {}), ...data, isAdvanced: true };
    sessionStorage.setItem("wp-check-data", JSON.stringify(combined));
    navigate("/results");
  };

  const stepLabels = ["Heizkreis", "Warmwasser", "Raumklima"];

  return (
    <div className="min-h-screen gradient-subtle">
      <div className="container max-w-2xl py-10">
        <div className="mb-8 p-4 bg-info/10 border border-info/20 rounded-lg">
          <p className="text-sm text-foreground">
            <strong>Erweiterter Check:</strong> Mit diesen Zusatzdaten können wir die Simulation verfeinern und genauere Empfehlungen geben.
          </p>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  i < step ? "bg-primary text-primary-foreground" : i === step ? "gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>{i + 1}</div>
                <span className={`hidden sm:block text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full gradient-hero rounded-full" initial={false} animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-elevated border border-border p-8">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">Heizkreis-Details</h2>
                  <div className="grid gap-5">
                    <div>
                      <Label htmlFor="vorlauf"><InfoTooltip term="Vorlauftemperatur">Maximale Vorlauftemperatur Heizung (°C)</InfoTooltip></Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Typisch: 35°C bei Fußbodenheizung, 42°C bei WP-Heizkörpern, 55°C bei Bestandsheizkörpern</p>
                      <div className="flex gap-2">
                        {["35", "42", "55"].map((v) => (
                          <Button key={v} type="button" variant={data.vorlauftemperatur === v ? "default" : "outline"} size="sm" onClick={() => update("vorlauftemperatur", v)}>{v}°C</Button>
                        ))}
                        <Input id="vorlauf" type="number" placeholder="Andere" value={!["35", "42", "55"].includes(data.vorlauftemperatur) ? data.vorlauftemperatur : ""} onChange={(e) => update("vorlauftemperatur", e.target.value)} className="w-24" />
                      </div>
                      <FieldError message={errors.vorlauftemperatur} />
                    </div>
                    <div>
                      <Label><InfoTooltip term="WP-Heizkörper">Wärmepumpenheizkörper vorhanden?</InfoTooltip></Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Speziell für Wärmepumpen ausgelegte Heizkörper mit großer Oberfläche</p>
                      <RadioGroup value={data.wpHeizkoerper} onValueChange={(v) => update("wpHeizkoerper", v)} className="mt-2 flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="ja" id="wphk-ja" /><Label htmlFor="wphk-ja" className="font-normal">Ja</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="nein" id="wphk-nein" /><Label htmlFor="wphk-nein" className="font-normal">Nein</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="unbekannt" id="wphk-unbekannt" /><Label htmlFor="wphk-unbekannt" className="font-normal">Unbekannt</Label></div>
                      </RadioGroup>
                      <FieldError message={errors.wpHeizkoerper} />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">Warmwasserbedarf</h2>
                  <div className="grid gap-5">
                    <div>
                      <Label htmlFor="duschen">Anzahl Dusch- und Badevorgänge pro Tag</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Zählen Sie alle täglichen Dusch- und Badevorgänge im gesamten Haushalt</p>
                      <div className="flex gap-2 items-center">
                        {["1", "2", "3", "4", "5"].map((v) => (
                          <Button key={v} type="button" variant={data.duschenProTag === v ? "default" : "outline"} size="sm" onClick={() => update("duschenProTag", v)} className="w-10">{v}</Button>
                        ))}
                        <Input id="duschen" type="number" placeholder="6+" value={Number(data.duschenProTag) > 5 ? data.duschenProTag : ""} onChange={(e) => update("duschenProTag", e.target.value)} className="w-20" />
                      </div>
                      <FieldError message={errors.duschenProTag} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-card-foreground">Raumklima</h2>
                  <div className="grid gap-5">
                    <div>
                      <Label htmlFor="raumtemp">Durchschnittliche Raumtemperatur (°C)</Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Die gewünschte Durchschnittstemperatur in Ihren Wohnräumen</p>
                      <div className="flex gap-2">
                        {["20", "21", "22", "23"].map((v) => (
                          <Button key={v} type="button" variant={data.raumtemperatur === v ? "default" : "outline"} size="sm" onClick={() => update("raumtemperatur", v)}>{v}°C</Button>
                        ))}
                        <Input id="raumtemp" type="number" placeholder="Andere" value={!["20", "21", "22", "23"].includes(data.raumtemperatur) ? data.raumtemperatur : ""} onChange={(e) => update("raumtemperatur", e.target.value)} className="w-24" />
                      </div>
                      <FieldError message={errors.raumtemperatur} />
                    </div>
                    <div>
                      <Label><InfoTooltip term="Automatische Raumregler">Automatische Raumregler / Thermostate vorhanden?</InfoTooltip></Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">Smarte oder programmierbare Thermostate an den Heizkörpern</p>
                      <RadioGroup value={data.automatischeRaumregler} onValueChange={(v) => update("automatischeRaumregler", v)} className="mt-2 flex gap-4">
                        <div className="flex items-center gap-2"><RadioGroupItem value="ja" id="arr-ja" /><Label htmlFor="arr-ja" className="font-normal">Ja</Label></div>
                        <div className="flex items-center gap-2"><RadioGroupItem value="nein" id="arr-nein" /><Label htmlFor="arr-nein" className="font-normal">Nein</Label></div>
                      </RadioGroup>
                      <FieldError message={errors.automatischeRaumregler} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button variant="outline" onClick={prev} disabled={step === 0}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Zurück
            </Button>
            {step < TOTAL_STEPS - 1 ? (
              <Button variant="default" onClick={next}>Weiter <ArrowRight className="ml-1 h-4 w-4" /></Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit}>Verfeinerte Ergebnisse berechnen <ArrowRight className="ml-1 h-4 w-4" /></Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCheckForm;
