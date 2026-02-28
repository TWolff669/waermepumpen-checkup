import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Menu, User, LogOut, FolderOpen, Settings, Crown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getTierLabel, getTierColor } from "@/lib/tier-guard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { to: "/", label: "Startseite" },
  { to: "/efficiency-check", label: "Effizienz-Check" },
  { to: "/blog", label: "Blog" },
];

const Header = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut, tierProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const tierLabel = tierProfile ? getTierLabel(tierProfile.tier) : null;
  const tierColorClass = tierProfile ? getTierColor(tierProfile.tier) : "";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">WP-Check</span>
        </Link>

        {/* Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                  {tierLabel && tierProfile?.tier !== "free" && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tierColorClass}`}>
                      {tierLabel}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span className="truncate text-xs">{user.email}</span>
                  {tierLabel && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ml-2 ${tierColorClass}`}>
                      {tierLabel}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/projekte")}>
                  <FolderOpen className="mr-2 h-4 w-4" /> Meine Projekte
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/einstellungen")}>
                  <Settings className="mr-2 h-4 w-4" /> Einstellungen
                </DropdownMenuItem>
                {tierProfile?.tier === "free" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/pricing")} className="text-primary">
                      <Crown className="mr-2 h-4 w-4" /> Upgrade
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link to="/auth">Anmelden</Link>
            </Button>
          )}
        </nav>

        {/* Mobile */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menü öffnen</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className="flex flex-col gap-4 mt-8">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)}
                  className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  {tierLabel && (
                    <div className="flex items-center gap-2 py-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${tierColorClass}`}>
                        {tierLabel}-Plan
                      </span>
                    </div>
                  )}
                  <Link to="/projekte" onClick={() => setOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                    Meine Projekte
                  </Link>
                  <Link to="/einstellungen" onClick={() => setOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2">
                    Einstellungen
                  </Link>
                  {tierProfile?.tier === "free" && (
                    <Link to="/pricing" onClick={() => setOpen(false)}
                      className="text-base font-medium text-primary hover:text-foreground transition-colors py-2">
                      ⭐ Upgrade
                    </Link>
                  )}
                  <button onClick={() => { handleSignOut(); setOpen(false); }}
                    className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors py-2 text-left">
                    Abmelden
                  </button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)}
                  className="text-base font-medium text-primary hover:text-foreground transition-colors py-2">
                  Anmelden
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
