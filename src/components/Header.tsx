import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-hero">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">WP-Check</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Startseite
          </Link>
          <Link to="/efficiency-check" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Effizienz-Check
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
