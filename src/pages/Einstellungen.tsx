import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Lock, AlertTriangle, RotateCcw, Save, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  canCustomizeCosts,
  getTierLabel,
  getTierColor,
  isTierExpired,
  countUserProjects,
} from "@/lib/tier-guard";
import { DEFAULT_MASSNAHMEN_KOSTEN } from "@/lib/massnahmen-kosten";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ── Types ──────────────────────────────────────────────────────────
interface ProfileForm {
  full_name: string;
  company_name: string;
  role: "private" | "handwerker" | "energieberater";
}

interface CostOverride {
  massnahme_key: string;
  cost_min: number | "";
  cost_max: number | "";
  notes: string;
  enabled: boolean;
}

// ── Component ──────────────────────────────────────────────────────
const Einstellungen = () => {
  const { user, loading, tierProfile } = useAuth();
  const navigate = useNavigate();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl min-h-[60vh]">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold">Einstellungen</h1>
      </div>

      <Tabs defaultValue="profil" className="w-full">
        <TabsList className="mb-6 flex flex-col sm:flex-row h-auto sm:h-10 w-full sm:w-auto">
          <TabsTrigger value="profil" className="w-full sm:w-auto">Profil</TabsTrigger>
          <TabsTrigger value="abo" className="w-full sm:w-auto">Abonnement</TabsTrigger>
          <TabsTrigger value="kosten" className="w-full sm:w-auto">Kostenparameter</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <ProfilTab user={user} />
        </TabsContent>
        <TabsContent value="abo">
          <AboTab user={user} tierProfile={tierProfile} />
        </TabsContent>
        <TabsContent value="kosten">
          <KostenTab user={user} tierProfile={tierProfile} />
        </TabsContent>
      </Tabs>
    </main>
  );
};

// ── Tab 1: Profil ──────────────────────────────────────────────────
function ProfilTab({ user }: { user: { id: string; email?: string } }) {
  const [form, setForm] = useState<ProfileForm>({ full_name: "", company_name: "", role: "private" });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("full_name, company_name, role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: data.full_name ?? "",
            company_name: data.company_name ?? "",
            role: (data.role as ProfileForm["role"]) ?? "private",
          });
        }
        setLoaded(true);
      });
  }, [user.id]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        company_name: form.company_name || null,
        role: form.role,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      toast.success("Profil gespeichert");
    }
  };

  if (!loaded) return <Card><CardContent className="p-6">Laden…</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil bearbeiten</CardTitle>
        <CardDescription>Deine persönlichen Daten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input id="email" value={user.email ?? ""} disabled className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="full_name">Name</Label>
          <Input
            id="full_name"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            placeholder="Max Mustermann"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company_name">Firma / Unternehmen</Label>
          <Input
            id="company_name"
            value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rolle</Label>
          <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as ProfileForm["role"] }))}>
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Privat</SelectItem>
              <SelectItem value="handwerker">Handwerker</SelectItem>
              <SelectItem value="energieberater">Energieberater</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={saving} className="mt-2">
          <Save className="h-4 w-4" />
          {saving ? "Speichern…" : "Speichern"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Tab 2: Abonnement ──────────────────────────────────────────────
function AboTab({
  user,
  tierProfile,
}: {
  user: { id: string };
  tierProfile: import("@/lib/tier-guard").TierProfile | null;
}) {
  const navigate = useNavigate();
  const [projectCount, setProjectCount] = useState<number | null>(null);

  useEffect(() => {
    countUserProjects(user.id).then(setProjectCount);
  }, [user.id]);

  const tier = tierProfile?.tier ?? "free";
  const maxProjects = tierProfile?.maxProjects ?? 0;
  const expired = isTierExpired(tierProfile?.tierExpiresAt ?? null);
  const progress = maxProjects > 0 ? ((projectCount ?? 0) / maxProjects) * 100 : 0;
  const showUpgrade = tier === "free" || tier === "einzel";

  return (
    <div className="space-y-4">
      {expired && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Dein {getTierLabel(tier)}-Plan ist abgelaufen.{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/pricing")}>
              Jetzt verlängern
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Aktueller Plan
            <Badge className={getTierColor(tier)}>{getTierLabel(tier)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tierProfile?.tierExpiresAt && (
            <div className="text-sm text-muted-foreground">
              Gültig bis:{" "}
              <span className={expired ? "text-destructive font-medium" : ""}>
                {new Date(tierProfile.tierExpiresAt).toLocaleDateString("de-DE")}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Projekte</span>
              <span>
                {projectCount ?? "…"} / {maxProjects === 0 ? "–" : maxProjects}
              </span>
            </div>
            {maxProjects > 0 && <Progress value={Math.min(progress, 100)} className="h-2" />}
            {maxProjects === 0 && (
              <p className="text-xs text-muted-foreground">
                Im Free-Plan können keine Projekte gespeichert werden.
              </p>
            )}
          </div>

          {showUpgrade && (
            <Button variant="hero" onClick={() => navigate("/pricing")} className="mt-2">
              Plan upgraden
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Tab 3: Kostenparameter ─────────────────────────────────────────
function KostenTab({
  user,
  tierProfile,
}: {
  user: { id: string };
  tierProfile: import("@/lib/tier-guard").TierProfile | null;
}) {
  const navigate = useNavigate();
  const tier = tierProfile?.tier ?? "free";

  if (!canCustomizeCosts(tier)) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-3">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="font-medium">Ab Starter-Plan verfügbar</p>
          <p className="text-sm text-muted-foreground">
            Eigene Kostenparameter können ab dem Starter-Plan angepasst werden.
          </p>
          <Button variant="hero" onClick={() => navigate("/pricing")}>
            Plan upgraden
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <CostOverridesEditor userId={user.id} />;
}

// ── Cost Overrides Editor ──────────────────────────────────────────
function CostOverridesEditor({ userId }: { userId: string }) {
  const [overrides, setOverrides] = useState<CostOverride[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const initOverrides = useCallback(
    (dbOverrides: { massnahme_key: string; cost_min: number; cost_max: number; notes: string | null }[]) => {
      const dbMap = new Map(dbOverrides.map((o) => [o.massnahme_key, o]));
      return DEFAULT_MASSNAHMEN_KOSTEN.map((m) => {
        const db = dbMap.get(m.id);
        return {
          massnahme_key: m.id,
          cost_min: db ? db.cost_min : ("" as const),
          cost_max: db ? db.cost_max : ("" as const),
          notes: db?.notes ?? "",
          enabled: !!db,
        };
      });
    },
    []
  );

  useEffect(() => {
    supabase
      .from("custom_cost_overrides")
      .select("massnahme_key, cost_min, cost_max, notes")
      .eq("user_id", userId)
      .then(({ data }) => {
        setOverrides(initOverrides(data ?? []));
        setLoaded(true);
      });
  }, [userId, initOverrides]);

  const updateOverride = (key: string, patch: Partial<CostOverride>) => {
    setOverrides((prev) => prev.map((o) => (o.massnahme_key === key ? { ...o, ...patch } : o)));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const enabled = overrides.filter((o) => o.enabled && o.cost_min !== "" && o.cost_max !== "");
    const disabled = overrides.filter((o) => !o.enabled);

    // Delete disabled overrides
    if (disabled.length > 0) {
      await supabase
        .from("custom_cost_overrides")
        .delete()
        .eq("user_id", userId)
        .in("massnahme_key", disabled.map((o) => o.massnahme_key));
    }

    // Upsert enabled ones
    if (enabled.length > 0) {
      const rows = enabled.map((o) => ({
        user_id: userId,
        massnahme_key: o.massnahme_key,
        cost_min: Number(o.cost_min),
        cost_max: Number(o.cost_max),
        notes: o.notes || null,
      }));

      const { error } = await supabase.from("custom_cost_overrides").upsert(rows, {
        onConflict: "user_id,massnahme_key",
      });

      if (error) {
        toast.error("Fehler beim Speichern der Kostenparameter");
        setSaving(false);
        return;
      }
    }

    toast.success("Kostenparameter gespeichert");
    setSaving(false);
  };

  const handleResetOne = async (key: string) => {
    await supabase.from("custom_cost_overrides").delete().eq("user_id", userId).eq("massnahme_key", key);
    updateOverride(key, { enabled: false, cost_min: "", cost_max: "", notes: "" });
    toast.success("Zurückgesetzt");
  };

  const handleResetAll = async () => {
    await supabase.from("custom_cost_overrides").delete().eq("user_id", userId);
    setOverrides((prev) => prev.map((o) => ({ ...o, enabled: false, cost_min: "", cost_max: "", notes: "" })));
    toast.success("Alle Kostenparameter zurückgesetzt");
  };

  if (!loaded) return <Card><CardContent className="p-6">Laden…</CardContent></Card>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Eigene Kostenparameter</CardTitle>
          <CardDescription>
            Überschreibe die Standardkosten mit eigenen Werten basierend auf regionalen Angeboten.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {DEFAULT_MASSNAHMEN_KOSTEN.map((m) => {
            const o = overrides.find((ov) => ov.massnahme_key === m.id)!;
            return (
              <div key={m.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{m.label}</span>
                    <Badge variant="outline" className="text-xs">{m.kategorie}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Eigene Werte</span>
                    <Switch
                      checked={o.enabled}
                      onCheckedChange={(v) => updateOverride(m.id, { enabled: v })}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Standard: {m.kostenMin.toLocaleString("de-DE")} – {m.kostenMax.toLocaleString("de-DE")} € ({m.einheit})
                </p>

                {o.enabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Min (€)</Label>
                      <Input
                        type="number"
                        placeholder={String(m.kostenMin)}
                        value={o.cost_min}
                        onChange={(e) =>
                          updateOverride(m.id, { cost_min: e.target.value === "" ? "" : Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max (€)</Label>
                      <Input
                        type="number"
                        placeholder={String(m.kostenMax)}
                        value={o.cost_max}
                        onChange={(e) =>
                          updateOverride(m.id, { cost_max: e.target.value === "" ? "" : Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Notiz</Label>
                      <Input
                        maxLength={200}
                        placeholder="z.B. Regionaler Durchschnitt"
                        value={o.notes}
                        onChange={(e) => updateOverride(m.id, { notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {o.enabled && (
                  <Button variant="ghost" size="sm" onClick={() => handleResetOne(m.id)}>
                    <RotateCcw className="h-3 w-3" />
                    Zurücksetzen
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSaveAll} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Speichern…" : "Alle speichern"}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <Trash2 className="h-4 w-4" />
              Alle zurücksetzen
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alle Kostenparameter zurücksetzen?</AlertDialogTitle>
              <AlertDialogDescription>
                Alle eigenen Werte werden gelöscht und die Standardwerte wiederhergestellt.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetAll}>Zurücksetzen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default Einstellungen;
