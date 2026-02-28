import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { SimulationInput, SimulationResult } from "@/lib/simulation";

interface SaveProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputData: SimulationInput;
  resultData: SimulationResult;
}

const SaveProjectDialog = ({ open, onOpenChange, inputData, resultData }: SaveProjectDialogProps) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("projects").insert({
        user_id: user.id,
        name: name.trim(),
        address: address.trim() || null,
        input_data: inputData as any,
        result_data: resultData as any,
        is_advanced: resultData.isAdvanced,
      });
      if (error) throw error;
      toast({ title: "Projekt gespeichert" });
      onOpenChange(false);
      setName("");
      setAddress("");
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Projekt speichern</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="project-name">Projektname *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Mein Haus oder Kundenname"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="project-address">Adresse (optional)</Label>
            <Input
              id="project-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="z.B. Musterstraße 1, 80331 München"
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
          <Button variant="hero" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveProjectDialog;
