import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Crown } from "lucide-react";
import { canCreateProject, canSaveProjects, getTierLabel, isTierExpired } from "@/lib/tier-guard";
import type { SimulationInput, SimulationResult } from "@/lib/simulation";
import type { SzenarioExportData } from "@/components/ScenarioSimulator";

interface SaveProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputData: SimulationInput;
  resultData: SimulationResult;
  scenarioData?: SzenarioExportData | null;
  preselectedProjectId?: string | null;
  preselectedProjectName?: string | null;
}

function generateHeizperioden(): string[] {
  const currentYear = new Date().getFullYear();
  const periods: string[] = [];
  for (let y = currentYear - 2; y <= currentYear; y++) {
    periods.push(`${y}/${y + 1}`);
  }
  return periods.reverse();
}

function guessHeizperiode(von?: string, bis?: string): string {
  if (von && bis) {
    const start = new Date(von);
    const y = start.getMonth() >= 6 ? start.getFullYear() : start.getFullYear() - 1;
    return `${y}/${y + 1}`;
  }
  const now = new Date();
  const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return `${y}/${y + 1}`;
}

const SaveProjectDialog = ({ open, onOpenChange, inputData, resultData, scenarioData, preselectedProjectId, preselectedProjectName }: SaveProjectDialogProps) => {
  const { user, tierProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [tierCheck, setTierCheck] = useState<{ allowed: boolean; reason?: string; currentCount: number; maxCount: number } | null>(null);
  const [tierLoading, setTierLoading] = useState(false);

  // New project tab
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  // Existing project tab
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Shared
  const perioden = generateHeizperioden();
  const defaultPeriode = guessHeizperiode(inputData.abrechnungVon, inputData.abrechnungBis);
  const [heizperiode, setHeizperiode] = useState(defaultPeriode);
  const [checkDate, setCheckDate] = useState(new Date().toISOString().slice(0, 10));

  const defaultTab = preselectedProjectId ? "existing" : "new";

  // Check tier limits when dialog opens for new project creation
  useEffect(() => {
    if (open && user?.id && !preselectedProjectId) {
      setTierLoading(true);
      canCreateProject(user.id).then((result) => {
        setTierCheck(result);
        setTierLoading(false);
      });
    }
  }, [open, user?.id, preselectedProjectId]);

  const { data: projects } = useQuery({
    queryKey: ["projects-for-save", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
    enabled: !!user && open,
  });

  useEffect(() => {
    if (preselectedProjectId) setSelectedProjectId(preselectedProjectId);
  }, [preselectedProjectId]);

  const buildScenarioJson = () => {
    if (!scenarioData) return null;
    return {
      szenario: scenarioData.szenario,
      selectedMassnahmenIds: scenarioData.selectedMassnahmen.map(m => m.id),
      foerderungenBund: scenarioData.foerderungenBund,
      foerderungenRegional: scenarioData.foerderungenRegional,
    };
  };

  const insertCheck = async (projectId: string) => {
    const { error } = await supabase.from("checks").insert({
      project_id: projectId,
      check_date: checkDate,
      heating_period: heizperiode,
      input_data: inputData as any,
      result_data: resultData as any,
      is_advanced: resultData.isAdvanced,
    });
    if (error) throw error;
  };

  const handleSaveNew = async () => {
    if (!user || !name.trim()) return;

    // Re-check tier
    if (tierCheck && !tierCheck.allowed) {
      toast({ title: "Limit erreicht", description: tierCheck.reason, variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const scenarioJson = buildScenarioJson();
      const { data: proj, error: projErr } = await supabase.from("projects").insert({
        user_id: user.id,
        name: name.trim(),
        address: address.trim() || null,
        input_data: inputData as any,
        result_data: resultData as any,
        scenario_data: scenarioJson as any,
        is_advanced: resultData.isAdvanced,
      }).select("id").single();
      if (projErr) throw projErr;

      await insertCheck(proj.id);

      toast({ title: "Projekt angelegt & Check gespeichert" });
      onOpenChange(false);
      setName("");
      setAddress("");
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddToExisting = async () => {
    if (!selectedProjectId) return;
    setSaving(true);
    try {
      const scenarioJson = buildScenarioJson();
      await insertCheck(selectedProjectId);

      // Also update project's latest result_data + scenario_data
      await supabase.from("projects").update({
        result_data: resultData as any,
        input_data: inputData as any,
        scenario_data: scenarioJson as any,
        is_advanced: resultData.isAdvanced,
      }).eq("id", selectedProjectId);

      toast({ title: "Check hinzugefügt" });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isExpired = tierProfile ? isTierExpired(tierProfile.tierExpiresAt) : false;
  const canSave = tierProfile ? canSaveProjects(tierProfile.tier) : false;

  // Show tier limit warning
  const renderTierWarning = () => {
    if (tierLoading || !tierCheck) return null;
    if (tierCheck.allowed) {
      return (
        <p className="text-xs text-muted-foreground">
          Projekte: {tierCheck.currentCount}/{tierCheck.maxCount} belegt
        </p>
      );
    }
    return (
      <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">{tierCheck.reason}</p>
          <Button variant="link" size="sm" className="p-0 h-auto text-primary" asChild>
            <a href="/pricing"><Crown className="h-3 w-3 mr-1" /> Jetzt upgraden</a>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {preselectedProjectId ? `Check zu "${preselectedProjectName}" hinzufügen` : "Ergebnis speichern"}
          </DialogTitle>
        </DialogHeader>

        {/* Tier expired warning */}
        {isExpired && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Ihr {getTierLabel(tierProfile!.tier)}-Plan ist abgelaufen. Projekte sind aktuell nur lesbar.
            </p>
          </div>
        )}

        {preselectedProjectId ? (
          <div className="space-y-4 py-2">
            <div>
              <Label>Heizperiode</Label>
              <Select value={heizperiode} onValueChange={setHeizperiode}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {perioden.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Check-Datum</Label>
              <Input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} className="mt-1.5" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
              <Button variant="hero" onClick={handleAddToExisting} disabled={saving || isExpired}>
                {saving ? "Speichern..." : "Check hinzufügen"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Tabs defaultValue={defaultTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Zu Projekt hinzufügen</TabsTrigger>
              <TabsTrigger value="new">Neues Projekt</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 pt-2">
              <div>
                <Label>Projekt</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Projekt auswählen..." /></SelectTrigger>
                  <SelectContent>
                    {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Heizperiode</Label>
                <Select value={heizperiode} onValueChange={setHeizperiode}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {perioden.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Check-Datum</Label>
                <Input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} className="mt-1.5" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                <Button variant="hero" onClick={handleAddToExisting} disabled={!selectedProjectId || saving || isExpired}>
                  {saving ? "Speichern..." : "Check hinzufügen"}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="new" className="space-y-4 pt-2">
              {renderTierWarning()}
              <div>
                <Label>Projektname *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Mein Haus" className="mt-1.5" />
              </div>
              <div>
                <Label>Adresse (optional)</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="z.B. Musterstraße 1, München" className="mt-1.5" />
              </div>
              <div>
                <Label>Heizperiode</Label>
                <Select value={heizperiode} onValueChange={setHeizperiode}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {perioden.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Check-Datum</Label>
                <Input type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} className="mt-1.5" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                <Button variant="hero" onClick={handleSaveNew} disabled={!name.trim() || saving || (tierCheck !== null && !tierCheck.allowed) || isExpired}>
                  {saving ? "Speichern..." : "Projekt anlegen & Check speichern"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SaveProjectDialog;
