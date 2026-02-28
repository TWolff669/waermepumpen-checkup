import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("private");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Erfolgreich eingeloggt" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;

        // Update profile with role after signup
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").update({
            full_name: fullName,
            role: role as any,
          }).eq("id", user.id);
        }

        toast({
          title: "Konto erstellt",
          description: "Bitte bestätigen Sie Ihre E-Mail-Adresse.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container max-w-md py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl shadow-elevated border border-border p-8"
        >
          <h1 className="text-2xl font-bold text-card-foreground mb-6 text-center">
            {isLogin ? "Anmelden" : "Konto erstellen"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName">Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ihr Name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Rolle</Label>
                  <RadioGroup value={role} onValueChange={setRole} className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="private" id="role-private" />
                      <Label htmlFor="role-private" className="font-normal">Privat (Eigenheimbesitzer)</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="handwerker" id="role-handwerker" />
                      <Label htmlFor="role-handwerker" className="font-normal">Handwerker / Installateur</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="energieberater" id="role-energieberater" />
                      <Label htmlFor="role-energieberater" className="font-normal">Energieberater</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.de"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 6 Zeichen"
                required
                minLength={6}
                className="mt-1.5"
              />
            </div>

            <Button type="submit" className="w-full" variant="hero" disabled={loading}>
              {loading ? "Bitte warten..." : isLogin ? "Anmelden" : "Registrieren"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? "Noch kein Konto? Jetzt registrieren" : "Bereits registriert? Anmelden"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
